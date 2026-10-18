import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { makeTestDirectory, freePort, stopServer } from './helpers/runtime.mjs';

test('Vercel function entrypoints serve buyer routes and retain auth/uploads across a process restart', async t => {
  const dataDir = makeTestDirectory(path.resolve('.local/vercel-function-test-'));
  const port = await freePort(), base = `http://127.0.0.1:${port}`;
  const start = () => spawn(process.execPath, ['tests/helpers/vercel-function-process.mjs'], {
    cwd: process.cwd(), windowsHide: true, stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    env: { ...process.env, LOCAL_DATA_DIR: dataDir, SEED_SAMPLE_DATA: '1', PORT: String(port), HOST: '127.0.0.1', ALLOWED_HOSTS: `127.0.0.1:${port}` },
  });
  const waitReady = proc => new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error(`Vercel function harness timed out: ${output}`)), 12000);
    proc.stdout.on('data', chunk => { output += chunk; if (output.includes('harness ready')) { clearTimeout(timer); resolve(); } });
    proc.stderr.on('data', chunk => { output += chunk; });
    proc.once('exit', code => { clearTimeout(timer); reject(new Error(`Function process exited ${code}: ${output}`)); });
  });
  let proc = start();
  await waitReady(proc);
  const call = async (route, body, cookie = '') => {
    const response = await fetch(base + route, body === undefined ? { headers: cookie ? { Cookie: cookie } : {} } : {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base, ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body),
    });
    return { response, data: response.headers.get('content-type')?.includes('json') ? await response.json() : null, cookie: response.headers.get('set-cookie')?.split(';')[0] };
  };
  t.after(async () => { if (proc && proc.exitCode === null) await stopServer(proc); });

  const home = await fetch(base + '/');
  assert.equal(home.status, 200);
  assert.match(await home.text(), /Nearbuy/);
  const search = await call('/api/search?q=iphn%2015');
  assert.equal(search.response.status, 200);
  assert.equal(search.data.products[0].model, 'iPhone 15');

  const signup = await call('/api/auth/signup', { email: 'function@example.test', password: 'function-test-password-42' });
  assert.equal(signup.response.status, 200);
  const upload = await call('/api/upload', { image: 'data:image/jpeg;base64,/9j/AA==' }, signup.cookie);
  assert.equal(upload.response.status, 200);
  assert.match(upload.data.url, /^\/uploads\/[a-f0-9-]+\.jpg$/);
  const imageBefore = await fetch(base + upload.data.url);
  assert.equal(imageBefore.status, 200);
  assert.deepEqual(Buffer.from(await imageBefore.arrayBuffer()), Buffer.from([0xff, 0xd8, 0xff, 0x00]));

  await stopServer(proc); proc = start(); await waitReady(proc);
  const session = await call('/api/session', undefined, signup.cookie);
  assert.equal(session.response.status, 200);
  assert.equal(session.data.user.email, 'function@example.test');
  const imageAfter = await fetch(base + upload.data.url);
  assert.equal(imageAfter.status, 200);
  assert.deepEqual(Buffer.from(await imageAfter.arrayBuffer()), Buffer.from([0xff, 0xd8, 0xff, 0x00]));
});
