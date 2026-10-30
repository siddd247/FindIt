import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { productRules, applyProductImages, syncStockImages } from '../scripts/apply-product-images.mjs';

test('every stock image file exists and is synchronized to web/images', () => {
  syncStockImages();
  const expectedFiles = [
    'anker.jpg',
    'apple-pencil.jpg',
    'apple-watch.jpg',
    'dyson.jpg',
    'helios-16.jpg',
    'imac.jpg',
    'ipad.jpg',
    'macbook.jpg',
    'rog-swift-monitor.jpg',
    'xm6.jpg',
    'lg-c4-oled.jpg',
    'iphone-11.jpg',
    'iphone-12.jpg',
    'iphone-13.jpg',
    'iphone-14.jpg',
    'iphone-15.jpg',
    'iphone-16.jpg',
    'iphone-16e.jpg',
    'iphone-17.jpg',
    'iphone-18.jpg',
    'iphone-x.jpg',
    'airpods.jpg',
    'asus.jpg',
    'jbl.jpg',
    'oppo.jpg',
    'phillips.jpg',
    'razer.jpg',
    'samsung.jpg',
    'sony.jpg',
    'tcl.jpg',
    'ugreen.jpg',
    'vivo.jpg',
    'wings-lifestyle.jpg',
    'xiaomi.jpg'
  ];

  for (const file of expectedFiles) {
    const fullPath = path.resolve('web', 'images', 'products', file);
    assert.ok(existsSync(fullPath), `Expected ${file} to exist in web/images/products`);
    assert.ok(statSync(fullPath).size > 1000, `Expected ${file} to have valid image size`);
  }

  const categoryPlaceholders = [
    'phones.jpg', 'laptops.jpg', 'tablets.jpg', 'watches.jpg',
    'chargers.jpg', 'monitors.jpg', 'audio.jpg', 'appliances.jpg', 'desktops.jpg', 'accessories.jpg'
  ];
  for (const file of categoryPlaceholders) {
    const fullPath = path.resolve('web', 'images', 'placeholders', file);
    assert.ok(existsSync(fullPath), `Expected ${file} to exist in web/images/placeholders`);
  }
});

test('product image matching rules correctly match target product families', () => {
  const check = (file, brand, model) => {
    const matched = productRules.find(r => r.match({ brand, model_name: model, model, name: `${brand} ${model}` }));
    assert.equal(matched?.file, `/images/products/${file}`, `Expected ${brand} ${model} to match ${file}`);
  };

  check('iphone-15.jpg', 'Apple', 'iPhone 15');
  check('iphone-15.jpg', 'Apple', 'iPhone 15 Pro Max');
  check('iphone-14.jpg', 'Apple', 'iPhone 14');
  check('iphone-13.jpg', 'Apple', 'iPhone 13 mini');
  check('iphone-16.jpg', 'Apple', 'iPhone 16 Pro');
  check('iphone-16e.jpg', 'Apple', 'iPhone 16e');
  check('iphone-17.jpg', 'Apple', 'iPhone 17 Pro Max');
  check('iphone-18.jpg', 'Apple', 'iPhone 18 Pro Max');
  check('iphone-x.jpg', 'Apple', 'iPhone XR');
  check('macbook.jpg', 'Apple', 'MacBook Pro 14 M4');
  check('ipad.jpg', 'Apple', 'iPad Air 11 M2');
  check('apple-watch.jpg', 'Apple', 'Apple Watch Ultra 2');
  check('apple-pencil.jpg', 'Apple', 'Apple Pencil Pro');
  check('imac.jpg', 'Apple', 'iMac 24-inch M4 All-in-One');
  check('helios-16.jpg', 'Acer', 'Predator Helios 16');
  check('rog-swift-monitor.jpg', 'ASUS', 'ROG Swift PG32UCDM 4K QD-OLED');
  check('xm6.jpg', 'Sony', 'WH-1000XM5');
  check('dyson.jpg', 'Dyson', 'V15 Detect Cordless Vacuum Cleaner');
  check('anker.jpg', 'Anker', 'Prime 200W Power Bank (20,000mAh)');
  check('lg-c4-oled.jpg', 'LG', 'OLED evo C4 Series 4K TV (48-inch)');
  check('airpods.jpg', 'Apple', 'AirPods Max (USB-C)');
  check('asus.jpg', 'ASUS', 'ROG Zephyrus G16 OLED');
  check('jbl.jpg', 'JBL', 'Tune 770NC');
  check('oppo.jpg', 'OPPO', 'Reno 12 Pro 5G');
  check('phillips.jpg', 'Philips', 'Airfryer XXL Connected (7000 Series)');
  check('razer.jpg', 'Razer', 'DeathAdder V3 Pro Wireless Gaming Mouse');
  check('samsung.jpg', 'Samsung', 'Galaxy S24');
  check('sony.jpg', 'Sony', 'Bravia 8 OLED 4K TV (65-inch)');
  check('tcl.jpg', 'TCL', 'QM8 QD-Mini LED 4K TV (65-inch)');
  check('ugreen.jpg', 'Ugreen', 'Nexode Pro 160W 4-Port GaN Fast Charger');
  check('vivo.jpg', 'Vivo', 'Vivo T3 5G');
  check('wings-lifestyle.jpg', 'Wings Lifestyle', 'Phantom 380');
  check('xiaomi.jpg', 'Xiaomi', 'Redmi Note 13 5G');
});

test('isolated SQLite database updates product images without modifying other fields', () => {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE categories(id TEXT PRIMARY KEY, name TEXT);
    CREATE TABLE catalog_products(id TEXT PRIMARY KEY, slug TEXT, brand TEXT, model_name TEXT, category_id TEXT, images TEXT DEFAULT '[]', deleted_at TEXT);
    CREATE TABLE catalog_variants(id TEXT PRIMARY KEY, product_id TEXT, images TEXT DEFAULT '[]', deleted_at TEXT);
    CREATE TABLE products(id TEXT PRIMARY KEY, brand TEXT, model TEXT, name TEXT, category_id TEXT, photo TEXT, deleted_at TEXT);
  `);
  db.prepare("INSERT INTO catalog_products VALUES ('p1', 'apple-iphone-15', 'Apple', 'iPhone 15', 'phones', '[]', NULL)").run();
  db.prepare("INSERT INTO catalog_variants VALUES ('v1', 'p1', '[]', NULL)").run();
  db.prepare("INSERT INTO catalog_products VALUES ('p2', 'motorola-edge-50', 'Motorola', 'Edge 50 Pro', 'phones', '[]', NULL)").run();
  db.prepare("INSERT INTO catalog_variants VALUES ('v2', 'p2', '[]', NULL)").run();
  db.prepare("INSERT INTO products VALUES ('l1', 'Apple', 'iPhone 15', 'Apple iPhone 15', 'phones', NULL, NULL)").run();

  const report = applyProductImages(db, { dryRun: false });
  assert.equal(report.catalog.matched, 1);
  assert.equal(report.catalog.fallback, 1);
  assert.equal(report.legacy.matched, 1);

  const p1 = db.prepare("SELECT images FROM catalog_products WHERE id='p1'").get();
  assert.deepEqual(JSON.parse(p1.images), ['/images/products/iphone-15.jpg']);

  const v1 = db.prepare("SELECT images FROM catalog_variants WHERE id='v1'").get();
  assert.deepEqual(JSON.parse(v1.images), ['/images/products/iphone-15.jpg']);

  const p2 = db.prepare("SELECT images FROM catalog_products WHERE id='p2'").get();
  assert.deepEqual(JSON.parse(p2.images), ['/images/placeholders/phones.jpg']);

  const l1 = db.prepare("SELECT photo FROM products WHERE id='l1'").get();
  assert.equal(l1.photo, '/images/products/iphone-15.jpg');

  db.close();
});
