-- ============================================
-- Migration: Add Automatic Discounts Support
-- ============================================

-- Table for Automatic Discounts (הנחות אוטומטיות)
CREATE TABLE IF NOT EXISTS automatic_discounts (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Discount Type
  discount_type VARCHAR(50) NOT NULL, -- percentage, fixed_amount, free_shipping
  
  -- Discount Value
  value NUMERIC(12,2), -- For percentage: 0-100, For fixed_amount: amount
  
  -- Conditions (תנאים)
  minimum_order_amount NUMERIC(12,2), -- סכום מינימום
  maximum_order_amount NUMERIC(12,2), -- סכום מקסימום
  minimum_quantity INT, -- כמות מינימום פריטים
  maximum_quantity INT, -- כמות מקסימום פריטים
  
  -- Applies To (חל על)
  applies_to VARCHAR(50) DEFAULT 'all', -- all, specific_products, specific_collections, specific_tags
  
  -- Priority (עדיפות)
  priority INT DEFAULT 0, -- גבוה יותר = עדיפות גבוהה יותר
  
  -- Combination Rules (כללי שילוב)
  can_combine_with_codes BOOLEAN DEFAULT true, -- האם ניתן לשלב עם קופונים
  can_combine_with_other_automatic BOOLEAN DEFAULT false, -- האם ניתן לשלב עם הנחות אוטומטיות אחרות
  max_combined_discounts INT DEFAULT 1, -- מקסימום הנחות מצטברות
  
  -- Customer Conditions (תנאי לקוח)
  customer_segment VARCHAR(50), -- all, vip, new_customer, returning_customer
  minimum_orders_count INT, -- מינימום הזמנות קודמות
  minimum_lifetime_value NUMERIC(12,2), -- ערך חיים מינימום
  
  -- Time Conditions (תנאי זמן)
  starts_at TIMESTAMP WITHOUT TIME ZONE,
  ends_at TIMESTAMP WITHOUT TIME ZONE,
  day_of_week INT[], -- 0=Sunday, 1=Monday, etc. NULL = כל יום
  hour_start INT, -- שעה התחלה (0-23)
  hour_end INT, -- שעה סיום (0-23)
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_automatic_discounts_store_id ON automatic_discounts(store_id);
CREATE INDEX idx_automatic_discounts_active ON automatic_discounts(is_active, starts_at, ends_at);
CREATE INDEX idx_automatic_discounts_priority ON automatic_discounts(priority DESC);

-- Mapping Tables for Automatic Discounts

-- Products that automatic discount applies to
CREATE TABLE IF NOT EXISTS automatic_discount_products (
  automatic_discount_id INT REFERENCES automatic_discounts(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (automatic_discount_id, product_id)
);

CREATE INDEX idx_automatic_discount_products_discount_id ON automatic_discount_products(automatic_discount_id);
CREATE INDEX idx_automatic_discount_products_product_id ON automatic_discount_products(product_id);

-- Collections that automatic discount applies to
CREATE TABLE IF NOT EXISTS automatic_discount_collections (
  automatic_discount_id INT REFERENCES automatic_discounts(id) ON DELETE CASCADE,
  collection_id INT REFERENCES product_collections(id) ON DELETE CASCADE,
  PRIMARY KEY (automatic_discount_id, collection_id)
);

CREATE INDEX idx_automatic_discount_collections_discount_id ON automatic_discount_collections(automatic_discount_id);
CREATE INDEX idx_automatic_discount_collections_collection_id ON automatic_discount_collections(collection_id);

-- Tags that automatic discount applies to
CREATE TABLE IF NOT EXISTS automatic_discount_tags (
  automatic_discount_id INT REFERENCES automatic_discounts(id) ON DELETE CASCADE,
  tag_name VARCHAR(100) NOT NULL,
  PRIMARY KEY (automatic_discount_id, tag_name)
);

CREATE INDEX idx_automatic_discount_tags_discount_id ON automatic_discount_tags(automatic_discount_id);

-- Update discount_codes table to support all discount conditions (same as automatic_discounts)
ALTER TABLE discount_codes 
ADD COLUMN IF NOT EXISTS can_combine_with_automatic BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS can_combine_with_other_codes BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_combined_discounts INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS priority INT DEFAULT 0,
-- Quantity conditions
ADD COLUMN IF NOT EXISTS minimum_quantity INT,
ADD COLUMN IF NOT EXISTS maximum_quantity INT,
-- Customer conditions
ADD COLUMN IF NOT EXISTS customer_segment VARCHAR(50), -- all, vip, new_customer, returning_customer
ADD COLUMN IF NOT EXISTS minimum_orders_count INT,
ADD COLUMN IF NOT EXISTS minimum_lifetime_value NUMERIC(12,2),
-- Time conditions
ADD COLUMN IF NOT EXISTS day_of_week INT[], -- 0=Sunday, 1=Monday, etc. NULL = כל יום
ADD COLUMN IF NOT EXISTS hour_start INT, -- שעה התחלה (0-23)
ADD COLUMN IF NOT EXISTS hour_end INT; -- שעה סיום (0-23)

-- Mapping tables for discount_codes (if not exist)

-- Products that discount code applies to
CREATE TABLE IF NOT EXISTS discount_code_products (
  discount_code_id INT REFERENCES discount_codes(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (discount_code_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_discount_code_products_code_id ON discount_code_products(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_discount_code_products_product_id ON discount_code_products(product_id);

-- Collections that discount code applies to
CREATE TABLE IF NOT EXISTS discount_code_collections (
  discount_code_id INT REFERENCES discount_codes(id) ON DELETE CASCADE,
  collection_id INT REFERENCES product_collections(id) ON DELETE CASCADE,
  PRIMARY KEY (discount_code_id, collection_id)
);

CREATE INDEX IF NOT EXISTS idx_discount_code_collections_code_id ON discount_code_collections(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_discount_code_collections_collection_id ON discount_code_collections(collection_id);

-- Tags that discount code applies to
CREATE TABLE IF NOT EXISTS discount_code_tags (
  discount_code_id INT REFERENCES discount_codes(id) ON DELETE CASCADE,
  tag_name VARCHAR(100) NOT NULL,
  PRIMARY KEY (discount_code_id, tag_name)
);

CREATE INDEX IF NOT EXISTS idx_discount_code_tags_code_id ON discount_code_tags(discount_code_id);

