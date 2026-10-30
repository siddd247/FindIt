import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';
import { CATALOG_CONFIG as config } from '../web/shop-pricing-config.mjs?v=20261017-final';
import { catalogIntegrity, stableId } from '../local/catalog-model.mjs';
import { seedCatalog } from '../local/catalog-seed.mjs';

export function updateIPhones(dbPath) {
  console.log(`\n========================================`);
  console.log(`Processing database: ${dbPath}`);
  console.log(`========================================`);
  const db = new DatabaseSync(dbPath);

  // 1. Update prices for iPhone XR, iPhone XS, and iPhone XS Max
  const priceUpdates = [
    // iPhone XR
    { model: 'iPhone XR', storage: '64GB', price: 17999 },
    { model: 'iPhone XR', storage: '128GB', price: 19999 },
    { model: 'iPhone XR', storage: '256GB', price: 22499 },
    // iPhone XS
    { model: 'iPhone XS', storage: '64GB', price: 18999 },
    { model: 'iPhone XS', storage: '256GB', price: 21999 },
    { model: 'iPhone XS', storage: '512GB', price: 24999 },
    // iPhone XS Max
    { model: 'iPhone XS Max', storage: '64GB', price: 22999 },
    { model: 'iPhone XS Max', storage: '256GB', price: 25999 },
    { model: 'iPhone XS Max', storage: '512GB', price: 28999 },
  ];

  for (const update of priceUpdates) {
    const variants = db.prepare(`
      SELECT v.id, v.product_id, v.legacy_product_id, v.options, p.model_name 
      FROM catalog_variants v
      JOIN catalog_products p ON p.id = v.product_id
      WHERE p.brand = 'Apple' AND p.model_name = ? AND v.options LIKE ?
    `).all(update.model, `%"storage":"${update.storage}"%`);

    console.log(`Updating ${variants.length} variants for ${update.model} (${update.storage}) to ₹${update.price}`);
    for (const v of variants) {
      db.prepare('UPDATE catalog_variants SET base_price = ? WHERE id = ?').run(update.price, v.id);
      if (v.legacy_product_id) {
        db.prepare('UPDATE products SET reference_price = ? WHERE id = ?').run(update.price, v.legacy_product_id);
      }
    }
  }

  // 2. Check if iPhone X already exists
  const existingX = db.prepare("SELECT id FROM catalog_products WHERE brand = 'Apple' AND model_name = 'iPhone X'").get();
  
  if (!existingX) {
    console.log('iPhone X not found. Adding Apple iPhone X (2017) to catalogue...');
    const groupKey = JSON.stringify(['phones', 'apple', 'iphone x']);
    const productId = stableId('model', groupKey);
    const productSlug = `apple-iphone-x-${productId.slice(-config.slugSignatureLength)}`;
    const now = new Date().toISOString();

    const iphoneXVariants = [
      {
        id: `uploaded-${createHash('sha256').update('apple-iphone-x-64gb-space-gray').digest('hex').slice(0, 24)}`,
        name: 'Apple iPhone X (64GB - Space Gray)',
        storage: '64GB',
        color: 'Space Gray',
        slug: 'apple-iphone-x-64gb-space-gray',
        price: 14999,
      },
      {
        id: `uploaded-${createHash('sha256').update('apple-iphone-x-64gb-silver').digest('hex').slice(0, 24)}`,
        name: 'Apple iPhone X (64GB - Silver)',
        storage: '64GB',
        color: 'Silver',
        slug: 'apple-iphone-x-64gb-silver',
        price: 14999,
      },
      {
        id: `uploaded-${createHash('sha256').update('apple-iphone-x-256gb-space-gray').digest('hex').slice(0, 24)}`,
        name: 'Apple iPhone X (256GB - Space Gray)',
        storage: '256GB',
        color: 'Space Gray',
        slug: 'apple-iphone-x-256gb-space-gray',
        price: 17999,
      },
      {
        id: `uploaded-${createHash('sha256').update('apple-iphone-x-256gb-silver').digest('hex').slice(0, 24)}`,
        name: 'Apple iPhone X (256GB - Silver)',
        storage: '256GB',
        color: 'Silver',
        slug: 'apple-iphone-x-256gb-silver',
        price: 17999,
      },
    ];

    const defaultVariantId = iphoneXVariants[0].id;

    const optionAxes = [
      {
        key: 'storage',
        label: 'Storage',
        keys: ['storage'],
        values: [
          { value: '64GB', label: '64GB', options: { storage: '64GB' } },
          { value: '256GB', label: '256GB', options: { storage: '256GB' } }
        ]
      },
      {
        key: 'color',
        label: 'Color',
        keys: ['color'],
        values: [
          { value: 'Space Gray', label: 'Space Gray', options: { color: 'Space Gray' } },
          { value: 'Silver', label: 'Silver', options: { color: 'Silver' } }
        ]
      }
    ];

    const commonSpecs = {
      screen: '5.8-inch Super Retina HD OLED',
      processor: 'Apple A11 Bionic',
      camera: 'Dual 12MP (wide + telephoto)',
      front_camera: '7MP TrueDepth',
      battery: '2716 mAh',
      os: 'iOS'
    };

    // Insert catalog_products first with default_variant_id = NULL to satisfy FK
    db.prepare(`
      INSERT INTO catalog_products (
        id, slug, group_key, brand, category_id, subcategory, model_name,
        release_year, option_axes, specs, default_variant_id, images,
        approval_status, customized, created_at, updated_at, deleted_at, redirect_to, default_locked
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, 'approved', 0, ?, ?, NULL, NULL, 0)
    `).run(
      productId,
      productSlug,
      groupKey,
      'Apple',
      'phones',
      'Smartphones',
      'iPhone X',
      2017,
      JSON.stringify(optionAxes),
      JSON.stringify(commonSpecs),
      JSON.stringify(['/images/products/iphone-x.jpg']),
      now,
      now
    );

    // Insert variants and legacy products
    for (const v of iphoneXVariants) {
      const options = { storage: v.storage, color: v.color };
      const variantSpecs = { storage: v.storage, color: v.color };
      const legacySpecs = {
        subcategory: 'Smartphones',
        supplied_specs: { storage: v.storage, color: v.color },
        slug: v.slug
      };
      const aliases = [
        v.name,
        'iPhone X',
        v.slug,
        'apple',
        'iphone x',
        'smartphone',
        v.storage.toLowerCase(),
        v.color.toLowerCase()
      ];

      // Insert products (legacy)
      db.prepare(`
        INSERT INTO products (
          id, brand, model, name, specs, photo, category_id, canonical_id, aliases, sample, deleted_at,
          reference_price, reference_currency, reference_price_source, reference_checked_at
        ) VALUES (?, 'Apple', 'iPhone X', ?, ?, '/images/products/iphone-x.jpg', 'phones', NULL, ?, 0, NULL, ?, 'INR', 'Retail Index', ?)
      `).run(
        v.id,
        v.name,
        JSON.stringify(legacySpecs),
        JSON.stringify(aliases),
        v.price,
        now
      );

      // Insert catalog_variants
      db.prepare(`
        INSERT INTO catalog_variants (
          id, product_id, legacy_product_id, slug, options, specs, base_price,
          currency, images, approval_status, created_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'INR', ?, 'approved', ?, ?, NULL)
      `).run(
        v.id,
        productId,
        v.id,
        v.slug,
        JSON.stringify(options),
        JSON.stringify(variantSpecs),
        v.price,
        JSON.stringify(['/images/products/iphone-x.jpg']),
        now,
        now
      );

      // Insert catalog_legacy_map
      db.prepare(`
        INSERT INTO catalog_legacy_map (legacy_id, variant_id, product_id, legacy_slug)
        VALUES (?, ?, ?, ?)
      `).run(v.id, v.id, productId, v.slug);
    }

    // Now set default_variant_id on catalog_products
    db.prepare('UPDATE catalog_products SET default_variant_id = ? WHERE id = ?').run(defaultVariantId, productId);
    console.log(`Added iPhone X model (${productId}) with ${iphoneXVariants.length} variants.`);
  } else {
    console.log('iPhone X already in database:', existingX.id);
  }

  // 3. Seed offers so shop listings reflect updated and new variants
  console.log('Seeding catalog offers...');
  const seedReport = seedCatalog(db, { apply: true });
  console.log('Seed report:', {
    variants: seedReport.variants,
    shops: seedReport.shops,
    createdOffers: seedReport.createdOffers,
    updatedSeedOffers: seedReport.updatedSeedOffers
  });

  // 4. Run integrity check
  const integrity = catalogIntegrity(db);
  const issues = Object.entries(integrity).filter(([, rows]) => rows.length > 0);
  if (issues.length > 0) {
    console.error('Integrity issues detected:', issues);
    throw new Error('Integrity check failed');
  } else {
    console.log('Catalog integrity check passed with 0 violations!');
  }

  db.close();
}

for (const p of ['local/seed.sqlite', '.local/stock.sqlite']) {
  updateIPhones(p);
}
console.log('\nAll databases updated successfully!');
