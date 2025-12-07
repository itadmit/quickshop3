-- Add missing product fields for full product editing support
-- Run this migration to add: availability, seo fields, video, etc.

-- Availability and stock management
ALTER TABLE products ADD COLUMN IF NOT EXISTS availability VARCHAR(50) DEFAULT 'IN_STOCK';
ALTER TABLE products ADD COLUMN IF NOT EXISTS available_date TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_alert INT;

-- SEO fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_description TEXT;

-- Media
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Physical attributes (if not tracking per-variant)
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight NUMERIC(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS length NUMERIC(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS width NUMERIC(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS height NUMERIC(10,2);

-- Default variant info (for simple products without variants)
ALTER TABLE products ADD COLUMN IF NOT EXISTS price NUMERIC(12,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_at_price NUMERIC(12,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_per_item NUMERIC(12,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS taxable BOOLEAN DEFAULT true;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_availability ON products(availability);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- Comment
COMMENT ON COLUMN products.availability IS 'IN_STOCK, OUT_OF_STOCK, PRE_ORDER, BACKORDER, DISCONTINUED';

