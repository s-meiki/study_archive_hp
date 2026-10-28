const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const manifest = require('../content/archive-thumbnails.json');
const api = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/lib/archive-presentation.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
}).outputText, { exports: api, URL, require: () => manifest });
const context = { window: {} };
vm.runInNewContext(fs.readFileSync('public/data/site-content.js', 'utf8'), context);
const archives = context.window.STUDY_ARCHIVE_DATA.archives;

test('published thumbnails match the recording and exist locally', () => {
  for (const [id, thumbnail] of Object.entries(manifest)) {
    const archive = archives.find((item) => item.id === id);
    assert.ok(archive);
    assert.equal(api.getArchivePresentation(archive).thumbnailUrl, thumbnail.src);
    assert.ok(fs.statSync(`public${thumbnail.src}`).size > 1000);
  }
});

test('removed or changed recordings cannot show an unrelated cached thumbnail', () => {
  const archive = archives.find((item) => manifest[item.id]);
  assert.equal(api.getArchivePresentation({ ...archive, assets: { recording: false } }).thumbnailUrl, null);
  for (const recording of ['https://youtu.be/abcdefghijk', 'https://example.org/watch?v=DkLGmSEnxtE', 'invalid', '']) {
    assert.equal(api.getArchivePresentation({ ...archive, links: { recording } }).thumbnailUrl, null);
  }
});

test('learning descriptions use source points and never invent missing duration', () => {
  const archive = archives[0];
  const before = JSON.stringify(archive);
  const display = api.getArchivePresentation(archive);
  assert.ok(display.learningOutcome.includes(archive.detail.keyPoints[0]));
  assert.equal(display.durationLabel, '');
  assert.equal(display.thumbnailUrl, null);
  assert.equal(api.getArchivePresentation({ ...archive, duration: '45分' }).durationLabel, '45分');
  assert.equal(JSON.stringify(archive), before);
});
