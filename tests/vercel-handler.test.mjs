import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createVercelNodeHandler } from '../local/vercel-handler.mjs';

function responseHarness() {
  return {
    statusCode: 200,
    headersSent: false,
    headers: {},
    body: undefined,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    end(body) { this.body = body; this.headersSent = true; },
  };
}

test('Vercel Node boundary preserves URL, method, headers, body and response', async () => {
  let seen;
  const handler = createVercelNodeHandler(async request => {
    seen = request;
    return Response.json({ path: new URL(request.url).pathname, value: await request.json() }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  });
  const req = Readable.from([Buffer.from('{"ok":true}')]);
  req.method = 'POST';
  req.url = '/api/test?q=1';
  req.headers = { host: 'nearbuy.example', 'content-type': 'application/json', 'x-forwarded-proto': 'https' };
  const res = responseHarness();
  await handler(req, res);
  assert.equal(seen.url, 'https://nearbuy.example/api/test?q=1');
  assert.equal(res.statusCode, 201);
  assert.equal(res.headers['cache-control'], 'no-store');
  assert.deepEqual(JSON.parse(res.body.toString()), { path: '/api/test', value: { ok: true } });
});

test('Vercel Node boundary rejects bodies over the existing 1 MB API limit', async () => {
  const handler = createVercelNodeHandler(async () => Response.json({ ok: true }));
  const req = Readable.from([Buffer.alloc(1_000_001)]);
  req.method = 'POST';
  req.url = '/api/test';
  req.headers = { host: 'nearbuy.example' };
  const res = responseHarness();
  await handler(req, res);
  assert.equal(res.statusCode, 413);
  assert.deepEqual(JSON.parse(res.body), { error: 'Request too large.' });
});
