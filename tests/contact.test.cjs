const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function loadContact(fetch) {
  const exports = {};
  const logs = [];
  const code = ts.transpileModule(fs.readFileSync('app/api/contact/route.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  vm.runInNewContext(code, {
    exports, fetch, Request, URLSearchParams, AbortSignal,
    console: { error: (...args) => logs.push(args) },
    process: { env: { CF_SECRET_KEY: 'test-secret', WEBHOOK_URL: 'https://example.invalid/webhook' } },
    require: (id) => {
      if (id === 'next/headers') return { headers: async () => new Headers() };
      if (id === 'next/server') return { NextResponse: { json: (body, options) => Response.json(body, options) } };
      throw new Error(`Unexpected import ${id}`);
    }
  });
  return exports.POST;
}
const payload = { name: 'めいき', email: 'user@example.com', message: '本文', token: 'test-token' };
const request = (body) => new Request('https://example.invalid/api/contact', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) });

test('contact delivers all 4000 characters within Discord embed limits without mentions', async () => {
  let sent;
  const POST = loadContact(async (url, options) => {
    assert.ok(options.signal);
    if (url.includes('siteverify')) return Response.json({ success: true });
    sent = JSON.parse(options.body);
    return new Response(null, { status: 204 });
  });
  const message = 'あ'.repeat(3998) + '終端';
  const result = await POST(request({ ...payload, name: '名'.repeat(80), message }));
  assert.equal(result.status, 200);
  const embed = sent.embeds[0];
  assert.equal(embed.description, message);
  assert.ok(embed.description.length <= 4096);
  assert.ok(embed.description.length + embed.title.length + embed.fields.reduce((sum, field) => sum + field.name.length + field.value.length, 0) <= 6000);
  assert.deepEqual(sent.allowed_mentions.parse, []);
});

test('contact rejects malformed and nonobject bodies before sending', async () => {
  const POST = loadContact(async () => { throw new Error('must not fetch'); });
  for (const body of ['{', 'null', '[]', '42', '"hello"', '{}']) {
    assert.equal((await POST(request(body))).status, 400, body);
  }
  assert.equal((await POST(request({ ...payload, message: 'x'.repeat(4001) }))).status, 400);
});

test('contact rejects failed Turnstile and reports failed webhook as unsuccessful', async () => {
  let calls = 0;
  const denied = loadContact(async () => { calls++; return Response.json({ success: false }); });
  assert.equal((await denied(request(payload))).status, 400);
  assert.equal(calls, 1);
  const failed = loadContact(async (url) => url.includes('siteverify') ? Response.json({ success: true }) : new Response(null, { status: 500 }));
  assert.equal((await failed(request(payload))).status, 502);
  const timeout = loadContact(async () => { throw new DOMException('timed out', 'TimeoutError'); });
  assert.notEqual((await timeout(request(payload))).status, 200);
});
