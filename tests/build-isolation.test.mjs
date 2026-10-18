import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { buildSmokeEnvironment } from '../scripts/build-smoke-env.mjs';

const cloudEnvironment = {
  VERCEL: '1',
  VERCEL_URL: 'preview.invalid',
  VERCEL_ENV: 'preview',
  NEARBY_DATABASE: 'turso',
  IMAGE_STORAGE: 'cloudinary',
  TURSO_DATABASE_URL: 'libsql://unreachable.invalid',
  TURSO_AUTH_TOKEN: 'invalid-build-test-token',
  CLOUDINARY_CLOUD_NAME: 'invalid/cloud',
  CLOUDINARY_API_KEY: 'invalid-build-test-key',
  CLOUDINARY_API_SECRET: 'invalid-build-test-secret',
  ADMIN_SETUP_TOKEN: 'not-for-builds',
  LOCAL_DATA_DIR: '/must-not-use-parent-storage',
  ALLOWED_HOSTS: 'not-allowed.example',
  SEED_SAMPLE_DATA: '1',
};

test('build smoke environment selects isolated local storage without altering runtime environment', () => {
  const parent = { ...cloudEnvironment, PATH: 'retained-path' };
  const snapshot = { ...parent };
  const env = buildSmokeEnvironment(parent, { dataDir: '/isolated-build-fixture', port: 4321, deployHost: 'build.invalid' });
  assert.deepEqual(parent, snapshot);
  assert.equal(env.PATH, parent.PATH);
  assert.equal(env.NEARBY_DATABASE, 'sqlite');
  assert.equal(env.IMAGE_STORAGE, 'mock-cloudinary');
  assert.equal(env.LOCAL_DATA_DIR, '/isolated-build-fixture');
  assert.equal(env.SEED_SAMPLE_DATA, '0');
  assert.equal(env.ALLOWED_HOSTS, '');
  for (const key of Object.keys(env)) assert.doesNotMatch(key, /^(?:VERCEL(?:_|$)|TURSO_|CLOUDINARY_|ADMIN_SETUP_TOKEN$)/i);
});

test('actual build and HTTP smoke checks succeed with unusable cloud credentials and Vercel flags', { timeout: 60000 }, async () => {
  const child = spawn(process.execPath, ['scripts/build-local.mjs'], {
    cwd: process.cwd(), env: { ...process.env, ...cloudEnvironment },
    windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', chunk => { output += chunk; });
  child.stderr.on('data', chunk => { output += chunk; });
  const exitCode = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', resolve);
  });
  assert.equal(exitCode, 0, output);
  assert.match(output, /Build passed:/);
  assert.match(output, /smoke-tested built HTTP server and search/);
  for (const key of ['TURSO_AUTH_TOKEN', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'ADMIN_SETUP_TOKEN']) assert.ok(!output.includes(cloudEnvironment[key]), `${key} must not appear in build output`);
});
