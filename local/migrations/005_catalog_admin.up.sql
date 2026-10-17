ALTER TABLE catalog_products ADD COLUMN redirect_to TEXT REFERENCES catalog_products(id);
ALTER TABLE catalog_products ADD COLUMN default_locked INTEGER NOT NULL DEFAULT 0;
ALTER TABLE catalog_requests ADD COLUMN result_product_id TEXT REFERENCES catalog_products(id);
ALTER TABLE catalog_requests ADD COLUMN result_variant_id TEXT REFERENCES catalog_variants(id);
