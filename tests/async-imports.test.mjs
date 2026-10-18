import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { openLocalDatabase } from '../local/database.mjs';
import { migrateAsync } from '../local/migrate.mjs';
import { importShopsAsync } from '../local/import-shops.mjs';
import { importProductsAsync } from '../local/import-products.mjs';
import { makeTestDirectory } from './helpers/runtime.mjs';

async function fixture(t) {
  const directory = makeTestDirectory(path.resolve('.local/async-import-test-'));
  const db = openLocalDatabase(path.join(directory, 'stock.sqlite'));
  t.after(() => db.close());
  await db.exec(readFileSync('local/schema.sql', 'utf8'));
  await migrateAsync(db);
  return db;
}

test('async shop import supports dry run, atomic apply, duplicate detection and no invented inventory', async t => {
  const db = await fixture(t), csv = readFileSync('docs/jammu_shops_seed.csv', 'utf8');
  const dry = await importShopsAsync(db, csv);
  assert.equal(dry.valid, 18);
  assert.equal(dry.inserted, 0);
  assert.equal((await db.prepare('SELECT count(*) AS n FROM shops').get()).n, 0);
  const applied = await importShopsAsync(db, csv, { dryRun: false });
  assert.equal(applied.inserted, 18);
  assert.equal((await db.prepare('SELECT count(*) AS n FROM listings').get()).n, 0);
  assert.equal((await importShopsAsync(db, csv, { dryRun: false })).duplicates.length, 18);
});

test('async product import keeps source validation, dry run and duplicate behavior', async t => {
  const db = await fixture(t), header = readFileSync('docs/products_template.csv', 'utf8').trim();
  const row = 'TestBrand,TestSeries,Fixture Model,Fixture Variant,accessories,2025,https://official.example.test/model,,,fixture|fixture model,Fixture Phone,Provided fixture spec';
  const opts = { brand: 'TestBrand', approvedHosts: { TestBrand: ['official.example.test'] } }, csv = `${header}\n${row}`;
  assert.equal((await importProductsAsync(db, csv)).errors.length, 1);
  const dry = await importProductsAsync(db, csv, opts);
  assert.equal(dry.valid, 1);
  assert.equal((await db.prepare('SELECT count(*) AS n FROM products').get()).n, 0);
  assert.equal((await importProductsAsync(db, csv, { ...opts, dryRun: false })).inserted, 1);
  assert.equal((await importProductsAsync(db, csv, { ...opts, dryRun: false })).duplicates.length, 1);
});
