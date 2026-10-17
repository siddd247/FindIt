CREATE INDEX IF NOT EXISTS sessions_active_owner ON sessions(user_id,expires_at);
CREATE INDEX IF NOT EXISTS listings_shop_product_active ON listings(shop_id,product_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS products_category_active ON products(category_id) WHERE deleted_at IS NULL AND canonical_id IS NULL;
CREATE INDEX IF NOT EXISTS reports_listing_created ON reports(listing_id,created_at);
CREATE INDEX IF NOT EXISTS shops_active_area ON shops(status,area,pincode) WHERE deleted_at IS NULL;
