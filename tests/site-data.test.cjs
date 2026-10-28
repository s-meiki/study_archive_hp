const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function loadData(readFile = require('node:fs/promises').readFile) {
  const exports = {};
  const logs = [];
  const code = ts.transpileModule(fs.readFileSync('app/site-data.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
  }).outputText;
  vm.runInNewContext(code, {
    exports, process, console: { error: (...args) => logs.push(args) },
    require: (id) => id === 'node:fs/promises' ? { readFile } : require(id)
  });
  return { ...exports, logs };
}

test('actual published course and quiz data pass runtime validation', async () => {
  const data = loadData();
  assert.ok((await data.loadLearningContent()).courses.length > 0);
  assert.ok((await data.loadQuizBank()).quizzes.length > 0);
});

for (const [method, variable, key] of [['loadLearningContent', 'LEARNING_CONTENT', 'courses'], ['loadQuizBank', 'QUIZ_BANK', 'quizzes']]) {
  test(`${method} distinguishes empty content from failure and retries after recovery`, async () => {
    let raw = 'throw new Error("broken")';
    let reads = 0;
    const data = loadData(async () => { reads++; return raw; });
    await assert.rejects(data[method](), /教材データ/);
    assert.equal(data.logs.length, 1);
    raw = `window.${variable} = ${JSON.stringify({ schemaVersion: 1, [key]: [] })}`;
    const result = await data[method]();
    assert.equal(result[key].length, 0);
    assert.equal(await data[method](), result);
    assert.equal(reads, 2);
  });
  test(`${method} rejects missing assignment, unknown schema and malformed records`, async () => {
    for (const raw of ['window.UNRELATED = {}', `window.${variable} = { schemaVersion: 2, ${key}: [] }`, `window.${variable} = { schemaVersion: 1, ${key}: [null] }`]) {
      await assert.rejects(loadData(async () => raw)[method](), /教材データ/);
    }
  });
}
