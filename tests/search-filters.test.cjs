const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const api = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/archives/search-filters.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText, { exports: api, URLSearchParams });
const read = (params) => JSON.parse(JSON.stringify(api.readArchiveFilters(params, ['theme-a', 'theme-b'], ['2026', '2025'])));

test('shared archive URLs restore all filters including Japanese search text', () => {
  assert.deepEqual(read(new URLSearchParams('q=薬剤+%26+AI&theme=theme-b&asset=slides&year=2025')), {
    search: '薬剤 & AI', themeId: 'theme-b', asset: 'slides', year: '2025'
  });
});

test('unknown or partial filter values fall back safely', () => {
  assert.deepEqual(read(new URLSearchParams('theme=missing&asset=__proto__&year=20')), {
    search: '', themeId: '', asset: 'all', year: 'all'
  });
});

test('round trips encoded search without consuming unrelated or duplicate unrelated parameters', () => {
  const source = new URLSearchParams('utm_source=mail&tag=a&tag=b&q=old&q=duplicate');
  const filters = { search: '日本語 + & # %', themeId: 'theme-a', asset: 'notes', year: '2026' };
  const result = api.writeArchiveFilters(source, filters);
  assert.deepEqual(read(new URLSearchParams(result.toString())), filters);
  assert.deepEqual(result.getAll('tag'), ['a', 'b']);
  assert.deepEqual(result.getAll('q'), [filters.search]);
  assert.equal(result.get('utm_source'), 'mail');
  assert.deepEqual(source.getAll('q'), ['old', 'duplicate']);
});

test('reset removes every archive filter and keeps campaign context', () => {
  const result = api.writeArchiveFilters(new URLSearchParams('q=test&theme=theme-a&asset=slides&year=2026&utm_source=mail'), api.emptyArchiveFilters);
  assert.equal(result.toString(), 'utm_source=mail');
  assert.deepEqual(read(result), { search: '', themeId: '', asset: 'all', year: 'all' });
});
