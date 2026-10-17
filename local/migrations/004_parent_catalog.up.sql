-- Additive catalog structure. The original products/listings remain untouched.
ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('pending','active','suspended'));
CREATE TABLE catalog_products(
 id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, group_key TEXT NOT NULL UNIQUE,
 brand TEXT NOT NULL, category_id TEXT NOT NULL REFERENCES categories(id), subcategory TEXT,
 model_name TEXT NOT NULL, release_year INTEGER, option_axes TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(option_axes)),
 specs TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(specs)), default_variant_id TEXT REFERENCES catalog_variants(id),
 images TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(images)), approval_status TEXT NOT NULL DEFAULT 'approved',
 customized INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT
);
CREATE TABLE catalog_variants(
 id TEXT PRIMARY KEY, product_id TEXT NOT NULL REFERENCES catalog_products(id),
 legacy_product_id TEXT UNIQUE REFERENCES products(id), slug TEXT NOT NULL UNIQUE,
 options TEXT NOT NULL CHECK(json_valid(options)), specs TEXT NOT NULL CHECK(json_valid(specs)),
 base_price REAL CHECK(base_price IS NULL OR base_price>0), currency TEXT NOT NULL DEFAULT 'INR',
 images TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(images)), approval_status TEXT NOT NULL DEFAULT 'approved',
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT
);
CREATE INDEX catalog_variants_parent ON catalog_variants(product_id,deleted_at);
CREATE TABLE catalog_legacy_map(
 legacy_id TEXT PRIMARY KEY REFERENCES products(id), variant_id TEXT NOT NULL UNIQUE REFERENCES catalog_variants(id),
 product_id TEXT NOT NULL REFERENCES catalog_products(id), legacy_slug TEXT NOT NULL UNIQUE
);
CREATE TABLE catalog_seed_runs(
 id TEXT PRIMARY KEY, seed TEXT NOT NULL, distribution TEXT NOT NULL, created_at TEXT NOT NULL,
 wiped_at TEXT, report TEXT NOT NULL DEFAULT '{}'
);
CREATE TABLE offers(
 id TEXT PRIMARY KEY, variant_id TEXT NOT NULL REFERENCES catalog_variants(id), shop_id TEXT NOT NULL REFERENCES shops(id),
 price REAL NOT NULL CHECK(price>0), currency TEXT NOT NULL DEFAULT 'INR',
 stock_status TEXT NOT NULL CHECK(stock_status IN ('available','low_stock','out_of_stock','unavailable','unknown')),
 in_stock INTEGER CHECK(in_stock IN (0,1)), shop_product_url TEXT,
 approval_status TEXT NOT NULL DEFAULT 'approved' CHECK(approval_status IN ('pending','approved','rejected')),
 source TEXT NOT NULL CHECK(source IN ('seed','shop','field')), seed_run_id TEXT REFERENCES catalog_seed_runs(id),
 is_seed INTEGER NOT NULL DEFAULT 0 CHECK(is_seed IN (0,1)), updated_at TEXT NOT NULL,
 UNIQUE(variant_id,shop_id)
);
CREATE INDEX offers_variant_price ON offers(variant_id,approval_status,stock_status,price);
CREATE INDEX offers_shop ON offers(shop_id,variant_id);
CREATE TABLE offer_history(
 id TEXT PRIMARY KEY, offer_id TEXT NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
 price REAL NOT NULL, stock_status TEXT NOT NULL, actor_id TEXT NOT NULL, is_seed INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL
);
CREATE TABLE catalog_requests(
 id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE SET NULL, shop_id TEXT REFERENCES shops(id),
 kind TEXT NOT NULL CHECK(kind IN ('product','variant')), payload TEXT NOT NULL CHECK(json_valid(payload)),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 is_seed INTEGER NOT NULL DEFAULT 0, seed_run_id TEXT REFERENCES catalog_seed_runs(id),
 created_at TEXT NOT NULL, reviewed_at TEXT, review_note TEXT
);
CREATE TABLE catalog_seed_effects(
 id TEXT PRIMARY KEY, seed_run_id TEXT NOT NULL REFERENCES catalog_seed_runs(id), queue TEXT NOT NULL,
 target_id TEXT NOT NULL, before_status TEXT NOT NULL, after_status TEXT NOT NULL
);
