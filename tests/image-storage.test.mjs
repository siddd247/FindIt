import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createMockCloudinaryStorage } from '../local/image-storage.mjs';

test('mock Cloudinary assets survive adapter recreation and cannot overwrite existing files', async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'nearbuy-cloudinary-mock-'));
  const file = '123e4567-e89b-12d3-a456-426614174000.jpg';
  const bytes = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
  try {
    const first = createMockCloudinaryStorage({ directory: dir });
    const stored = await first.upload(bytes, file);
    assert.equal(first.provider, 'mock-cloudinary');
    assert.equal(stored.url, `/uploads/${file}`);
    assert.deepEqual(await first.read(file), bytes);
    const recreatedAfterRedeploy = createMockCloudinaryStorage({ directory: dir });
    assert.deepEqual(await recreatedAfterRedeploy.read(file), bytes);
    await assert.rejects(recreatedAfterRedeploy.upload(Buffer.from('different'), file), error => error.code === 'EEXIST');
    assert.deepEqual(await recreatedAfterRedeploy.read(file), bytes);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

