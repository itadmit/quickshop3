-- Add missing product fields for full product editing support
-- Run this migration to add: availability, seo fields, video, dimensions

-- Availability and stock management (product level)
ALTER TABLE products ADD COLUMN IF NOT EXISTS availability VARCHAR(50) DEFAULT 'IN_STOCK';
ALTER TABLE products ADD COLUMN IF NOT EXISTS available_date TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_alert INT;

-- SEO fields (product level)
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_description TEXT;

-- Media (product level)
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Physical dimensions (product level - shared by all variants)
ALTER TABLE products ADD COLUMN IF NOT EXISTS length NUMERIC(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS width NUMERIC(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS height NUMERIC(10,2);

-- Create index for availability queries
CREATE INDEX IF NOT EXISTS idx_products_availability ON products(availability);

-- Comment
COMMENT ON COLUMN products.availability IS 'IN_STOCK, OUT_OF_STOCK, PRE_ORDER, BACKORDER, DISCONTINUED';

-- NOTE: price, compare_at_price, sku, taxable, weight, cost_per_item 
-- are stored at the VARIANT level (product_variants table)
-- Every product has at least one variant (Shopify model)
