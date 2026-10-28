const test = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const code = ts.transpileModule(fs.readFileSync('app/learning/progress-store.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function setup() {
  const data = new Map();
  let tail = Promise.resolve();
  let fail = false;
  const listeners = new Set();
  const context = { exports: {}, structuredClone, console, window: {
    localStorage: { getItem: k => data.get(k) ?? null, setItem: (k, v) => { if (fail) throw new Error('quota'); data.set(k, v); } },
    navigator: { locks: { request: (_, callback) => { const next = tail.then(callback); tail = next.catch(() => {}); return next; } } },
    addEventListener(_, listener) { listeners.add(listener); }, removeEventListener(_, listener) { listeners.delete(listener); }
  } };
  vm.runInNewContext(code, context);
  return { ...context.exports, data, emit: key => listeners.forEach(listener => listener({ key })), fail: () => { fail = true; }, withoutLocks: () => { delete context.window.navigator.locks; } };
}
const complete = key => current => ({ ...current, lessons: { ...current.lessons, [key]: { status: 'completed' } } });
test('invalid imports preserve existing data, including versions, dates and numbers', async () => {
  const api = setup(); const store = api.createProgressStore(); await store.update(complete('a'));
  const original = store.exportJson();
  const base = JSON.parse(original);
  for (const invalid of [{ unrelated: true }, { ...base, schemaVersion: 2 }, { ...base, updatedAt: '2026-02-30T00:00:00Z' }, { ...base, lessons: { a: { status: 'watched', quizBestScore: 101 } } }, { ...base, streak: { current: -1, longest: 0, lastActiveDate: '' } }]) {
    assert.equal((await store.importJson(JSON.stringify(invalid))).ok, false);
    assert.equal(store.exportJson(), original);
  }
});
test('concurrent stale tabs retain different lessons through locked fresh reads', async () => {
  const api = setup(); const a = api.createProgressStore(); const b = api.createProgressStore(); a.get(); b.get();
  await Promise.all([a.update(complete('a')), b.update(complete('b'))]);
  assert.deepEqual(Object.keys(JSON.parse(api.data.get(api.PROGRESS_STORAGE_KEY)).lessons).sort(), ['a', 'b']);
});
test('reset/import do not resurrect stale lessons from other tabs; backup precedes replacement', async () => {
  const api = setup(); const a = api.createProgressStore(); const b = api.createProgressStore();
  await a.update(complete('old')); b.get();
  await a.reset(); await b.update(complete('new'));
  assert.deepEqual(Object.keys(b.get().lessons), ['new']);
  const incoming = api.createDefaultProgressState(); incoming.lessons.imported = { status: 'watched' };
  await a.importJson(JSON.stringify(incoming)); await b.update(complete('later'));
  assert.deepEqual(Object.keys(b.get().lessons).sort(), ['imported', 'later']);
  assert.deepEqual(Object.keys(JSON.parse(a.exportBackup()).lessons), ['new']);
});
test('failed backup aborts import, failed writes remain exportable and never overwrite other tabs on retry', async () => {
  const api = setup(); const a = api.createProgressStore(); await a.update(complete('saved'));
  const before = a.exportJson(); api.fail();
  assert.equal((await a.importJson(JSON.stringify(api.createDefaultProgressState()))).ok, false);
  assert.equal(a.exportJson(), before);
  assert.equal((await a.update(complete('unsaved'))).ok, false);
  assert.ok(JSON.parse(a.exportJson()).lessons.unsaved);
  assert.ok(a.getError());
  assert.deepEqual(Object.keys(JSON.parse(api.data.get(api.PROGRESS_STORAGE_KEY)).lessons), ['saved']);
});

test('storage notifications synchronize other tabs, including clear, without overwriting unsaved memory', async () => {
  const api = setup(); const a = api.createProgressStore(); const b = api.createProgressStore();
  const unsubscribe = b.subscribe(() => {}); b.get();
  await a.update(complete('a')); api.emit(api.PROGRESS_STORAGE_KEY);
  assert.ok(b.get().lessons.a);
  api.data.delete(api.PROGRESS_STORAGE_KEY); api.emit(null);
  assert.equal(Object.keys(b.get().lessons).length, 0);
  api.fail(); await b.update(complete('unsaved')); api.emit(null);
  assert.ok(b.get().lessons.unsaved);
  unsubscribe();
});

test('unsupported locking preserves persisted data and offers unsaved progress for export', async () => {
  const api = setup();
  const store = api.createProgressStore();
  await store.update(complete('saved'));
  api.withoutLocks();
  assert.equal((await store.update(complete('unsaved'))).ok, false);
  assert.ok(JSON.parse(store.exportJson()).lessons.unsaved);
  assert.deepEqual(Object.keys(JSON.parse(api.data.get(api.PROGRESS_STORAGE_KEY)).lessons), ['saved']);
  assert.ok(store.getError());
});

test('an explicit valid import can recover corrupt storage without losing its original bytes', async () => {
  const api = setup();
  const corrupt = '{broken original';
  api.data.set(api.PROGRESS_STORAGE_KEY, corrupt);
  const store = api.createProgressStore();
  store.get();
  assert.ok(store.getError());
  const incoming = api.createDefaultProgressState();
  incoming.lessons.recovered = { status: 'watched' };
  assert.equal((await store.importJson(JSON.stringify(incoming))).ok, true);
  assert.equal(store.exportBackup(), corrupt);
  assert.equal(store.getError(), null);
  assert.equal(store.get().lessons.recovered.status, 'watched');
});
