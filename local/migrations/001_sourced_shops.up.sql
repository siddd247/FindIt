CREATE TABLE shops_next (
 id TEXT PRIMARY KEY, owner_id TEXT REFERENCES users(id), name TEXT NOT NULL,
 address TEXT, area TEXT NOT NULL, city TEXT NOT NULL, lat REAL, lng REAL, phone TEXT, hours TEXT,
 photos TEXT NOT NULL DEFAULT '[]', categories TEXT NOT NULL DEFAULT '[]',
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','on_hold','deactivated','rejected')),
 verified_at TEXT, sample INTEGER NOT NULL DEFAULT 0, deleted_at TEXT,
 verification_status TEXT NOT NULL DEFAULT 'not_verified', source_url TEXT,
 google_maps_url TEXT, google_maps_place_url TEXT, type TEXT, pincode TEXT,
 hours_source TEXT, review_reason TEXT, changes_requested_at TEXT, legacy_status TEXT,
 created_at TEXT, updated_at TEXT
);
INSERT INTO shops_next(id,owner_id,name,address,area,city,lat,lng,phone,hours,photos,categories,status,verified_at,sample,deleted_at,verification_status,legacy_status)
 SELECT id,owner_id,name,address,area,city,lat,lng,phone,hours,photos,categories,
 CASE status WHEN 'verified' THEN 'active' WHEN 'suspended' THEN 'on_hold' ELSE status END,
 verified_at,sample,deleted_at,CASE WHEN sample=1 THEN 'sample' ELSE 'not_verified' END,status FROM shops;
DROP TABLE shops;
ALTER TABLE shops_next RENAME TO shops;
CREATE INDEX shops_location ON shops(city,lat,lng);
CREATE INDEX shops_owner ON shops(owner_id);
CREATE INDEX shops_status_area ON shops(status,area,pincode);
CREATE INDEX shops_name_pincode ON shops(name COLLATE NOCASE,pincode);
ALTER TABLE products ADD COLUMN series TEXT;
ALTER TABLE products ADD COLUMN variant TEXT;
ALTER TABLE products ADD COLUMN launch_year INTEGER;
ALTER TABLE products ADD COLUMN official_url TEXT;
ALTER TABLE products ADD COLUMN compatible_with TEXT;
ALTER TABLE products ADD COLUMN image_license TEXT;
CREATE INDEX products_lookup ON products(brand,model,name);
CREATE TABLE admins(id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT,disabled_at TEXT,failed_attempts INTEGER NOT NULL DEFAULT 0,locked_until TEXT);
CREATE TABLE admin_sessions(id TEXT PRIMARY KEY,admin_id TEXT NOT NULL REFERENCES admins(id),created_at TEXT NOT NULL,last_seen_at TEXT NOT NULL,expires_at TEXT NOT NULL);
CREATE TABLE import_batches(id TEXT PRIMARY KEY,type TEXT NOT NULL,source_name TEXT NOT NULL,source_hash TEXT NOT NULL,dry_run INTEGER NOT NULL,actor_id TEXT,created_at TEXT NOT NULL,total_rows INTEGER NOT NULL,inserted_count INTEGER NOT NULL DEFAULT 0,duplicate_count INTEGER NOT NULL DEFAULT 0,error_count INTEGER NOT NULL DEFAULT 0,report_json TEXT NOT NULL);
ALTER TABLE admin_actions ADD COLUMN before_json TEXT;
ALTER TABLE admin_actions ADD COLUMN after_json TEXT;
ALTER TABLE admin_actions ADD COLUMN reverted_at TEXT;
ALTER TABLE admin_actions ADD COLUMN reverted_by TEXT;
CREATE TABLE shop_counts(shop_id TEXT NOT NULL REFERENCES shops(id),day TEXT NOT NULL,kind TEXT NOT NULL,count INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(shop_id,day,kind));
