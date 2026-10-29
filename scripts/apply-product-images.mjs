import { DatabaseSync } from 'node:sqlite';
import { existsSync, copyFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

export const productRules = [
  { file: '/images/products/iphone-18.jpg', match: p => /iphone\s*18/i.test(p.brand + ' ' + (p.model_name || p.model || p.name)) },
  { file: '/images/products/iphone-17.jpg', match: p => /iphone\s*17/i.test(p.brand + ' ' + (p.model_name || p.model || p.name)) },
  { file: '/images/products/iphone-16e.jpg', match: p => /iphone\s*16e/i.test(p.brand + ' ' + (p.model_name || p.model || p.name)) },
  { file: '/images/products/iphone-16.jpg', match: p => /iphone\s*16(?!\s*e)/i.test(p.brand + ' ' + (p.model_name || p.model || p.name)) },
  { file: '/images/products/iphone-15.jpg', match: p => /iphone\s*15/i.test(p.brand + ' ' + (p.model_name || p.model || p.name)) },
  { file: '/images/products/iphone-14.jpg', match: p => /iphone\s*14/i.test(p.brand + ' ' + (p.model_name || p.model || p.name)) },
  { file: '/images/products/iphone-13.jpg', match: p => /iphone\s*13/i.test(p.brand + ' ' + (p.model_name || p.model || p.name)) },
  { file: '/images/products/iphone-12.jpg', match: p => /iphone\s*12/i.test(p.brand + ' ' + (p.model_name || p.model || p.name)) },
  { file: '/images/products/iphone-11.jpg', match: p => /iphone\s*11/i.test(p.brand + ' ' + (p.model_name || p.model || p.name)) },
  { file: '/images/products/iphone-x.jpg', match: p => /iphone\s*(x|xr|xs)/i.test(p.brand + ' ' + (p.model_name || p.model || p.name)) },
  { file: '/images/products/apple-pencil.jpg', match: p => /apple\s*pencil/i.test(p.brand + ' ' + (p.model_name || p.model || p.name)) },
  { file: '/images/products/apple-watch.jpg', match: p => /apple/i.test(p.brand) && /watch/i.test(p.model_name || p.model || p.name) },
  { file: '/images/products/imac.jpg', match: p => /imac/i.test(p.brand + ' ' + (p.model_name || p.model || p.name)) },
  { file: '/images/products/macbook.jpg', match: p => /macbook/i.test(p.brand + ' ' + (p.model_name || p.model || p.name)) },
  { file: '/images/products/ipad.jpg', match: p => /ipad/i.test(p.brand + ' ' + (p.model_name || p.model || p.name)) },
  { file: '/images/products/helios-16.jpg', match: p => /helios\s*16/i.test(p.brand + ' ' + (p.model_name || p.model || p.name)) },
  { file: '/images/products/rog-swift-monitor.jpg', match: p => /rog\s*swift/i.test(p.brand + ' ' + (p.model_name || p.model || p.name)) },
  { file: '/images/products/xm6.jpg', match: p => /(wh-1000xm|wf-1000xm|1000xm[456])/i.test(p.brand + ' ' + (p.model_name || p.model || p.name)) },
  { file: '/images/products/dyson.jpg', match: p => /dyson/i.test(p.brand + ' ' + (p.model_name || p.model || p.name)) },
  { file: '/images/products/anker.jpg', match: p => /anker/i.test(p.brand + ' ' + (p.model_name || p.model || p.name)) }
];

export function syncStockImages(sourceDir = 'stock', webDir = 'web') {
  const productsDir = path.join(webDir, 'images', 'products');
  const placeholdersDir = path.join(webDir, 'images', 'placeholders');
  mkdirSync(productsDir, { recursive: true });
  mkdirSync(placeholdersDir, { recursive: true });

  const filesMap = [
    ['anker.jpg', 'anker.jpg'],
    ['apple pencil.jpg', 'apple-pencil.jpg'],
    ['apple watch.jpg', 'apple-watch.jpg'],
    ['dyson.jpg', 'dyson.jpg'],
    ['helios 16.jpg', 'helios-16.jpg'],
    ['imac.jpg', 'imac.jpg'],
    ['ipad.jpg', 'ipad.jpg'],
    ['macbook.jpg', 'macbook.jpg'],
    ['rog swift monitor.jpg', 'rog-swift-monitor.jpg'],
    ['xm6.jpg', 'xm6.jpg'],
    ['iphone/iphone 18.jpg', 'iphone-18.jpg'],
    ['iphone/iphone x.jpg', 'iphone-x.jpg'],
    ['iphone/iphone11.jpg', 'iphone-11.jpg'],
    ['iphone/iphone12.jpg', 'iphone-12.jpg'],
    ['iphone/iphone13.jpg', 'iphone-13.jpg'],
    ['iphone/ipjone14.jpg', 'iphone-14.jpg'],
    ['iphone/iphone15.jpg', 'iphone-15.jpg'],
    ['iphone/iphone16.jpg', 'iphone-16.jpg'],
    ['iphone/iphone16e.jpg', 'iphone-16e.jpg'],
    ['iphone/iphone17.jpg', 'iphone-17.jpg']
  ];

  for (const [srcRel, dstName] of filesMap) {
    const src = path.join(sourceDir, srcRel);
    if (existsSync(src)) {
      copyFileSync(src, path.join(productsDir, dstName));
      // Also keep original filename variant
      copyFileSync(src, path.join(productsDir, path.basename(srcRel)));
    }
  }

  const catMap = [
    ['iphone-15.jpg', 'phones.jpg'],
    ['macbook.jpg', 'laptops.jpg'],
    ['ipad.jpg', 'tablets.jpg'],
    ['apple-watch.jpg', 'watches.jpg'],
    ['anker.jpg', 'chargers.jpg'],
    ['anker.jpg', 'chargers-cables.jpg'],
    ['rog-swift-monitor.jpg', 'monitors.jpg'],
    ['xm6.jpg', 'audio.jpg'],
    ['dyson.jpg', 'appliances.jpg'],
    ['imac.jpg', 'desktops.jpg'],
    ['apple-pencil.jpg', 'accessories.jpg'],
    ['dyson.jpg', 'tv.jpg'],
    ['dyson.jpg', 'tv-home.jpg']
  ];

  for (const [prodFile, catFile] of catMap) {
    const src = path.join(productsDir, prodFile);
    if (existsSync(src)) {
      copyFileSync(src, path.join(placeholdersDir, catFile));
    }
  }
}

export function applyProductImages(db, { dryRun = false } = {}) {
  const catalogProducts = db.prepare('SELECT id, slug, brand, model_name, category_id, images FROM catalog_products WHERE deleted_at IS NULL').all();
  const legacyProducts = db.prepare('SELECT id, brand, model, name, category_id, photo FROM products WHERE deleted_at IS NULL').all();

  let matchedCatalog = 0, fallbackCatalog = 0;
  let matchedLegacy = 0, fallbackLegacy = 0;

  const catalogUpdates = [];
  for (const p of catalogProducts) {
    const matched = productRules.find(r => r.match(p));
    const imgUrl = matched ? matched.file : `/images/placeholders/${p.category_id || 'accessories'}.jpg`;
    if (matched) matchedCatalog++; else fallbackCatalog++;
    catalogUpdates.push({ id: p.id, images: JSON.stringify([imgUrl]) });
  }

  const legacyUpdates = [];
  for (const p of legacyProducts) {
    const matched = productRules.find(r => r.match(p));
    const imgUrl = matched ? matched.file : `/images/placeholders/${p.category_id || 'accessories'}.jpg`;
    if (matched) matchedLegacy++; else fallbackLegacy++;
    legacyUpdates.push({ id: p.id, photo: imgUrl });
  }

  if (!dryRun) {
    db.exec('BEGIN IMMEDIATE');
    try {
      const updateCatalog = db.prepare('UPDATE catalog_products SET images=? WHERE id=?');
      const updateVariant = db.prepare('UPDATE catalog_variants SET images=? WHERE product_id=?');
      for (const u of catalogUpdates) {
        updateCatalog.run(u.images, u.id);
        updateVariant.run(u.images, u.id);
      }

      const updateLegacy = db.prepare('UPDATE products SET photo=? WHERE id=?');
      for (const u of legacyUpdates) {
        updateLegacy.run(u.photo, u.id);
      }
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }

  return {
    dryRun,
    catalog: { matched: matchedCatalog, fallback: fallbackCatalog, total: catalogProducts.length },
    legacy: { matched: matchedLegacy, fallback: fallbackLegacy, total: legacyProducts.length }
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'))) {
  syncStockImages();
  const dbPath = path.resolve('.local/stock.sqlite');
  if (existsSync(dbPath)) {
    const db = new DatabaseSync(dbPath);
    const result = applyProductImages(db, { dryRun: process.argv.includes('--dry-run') });
    console.log('Applied product images successfully:', JSON.stringify(result, null, 2));
    db.close();
  }
}

