-- ============================================
-- Quickshop3 Database Schema
-- Based on Shopify Admin API Structure
-- PostgreSQL Schema for Multi-Store SaaS E-commerce Platform
-- ============================================

-- ============================================
-- 1. AUTHENTICATION & MULTI-STORE BASE
-- ============================================

-- Store Owners (Shopify-like: Users)
CREATE TABLE store_owners (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_store_owners_email ON store_owners(email);

-- Stores (Shopify-like: Shops)
CREATE TABLE stores (
  id SERIAL PRIMARY KEY,
  owner_id INT REFERENCES store_owners(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL, -- Unique slug for URL (e.g., 'nike', 'adidas')
  domain VARCHAR(255),
  myshopify_domain VARCHAR(255), -- Shopify-like domain format
  currency VARCHAR(10) DEFAULT 'ILS',
  locale VARCHAR(10) DEFAULT 'he-IL',
  timezone VARCHAR(50) DEFAULT 'Asia/Jerusalem',
  plan VARCHAR(50) DEFAULT 'free',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_stores_owner_id ON stores(owner_id);
CREATE INDEX idx_stores_domain ON stores(domain);
CREATE INDEX idx_stores_slug ON stores(slug);

-- ============================================
-- 2. PRODUCTS (Shopify-like: Products API)
-- ============================================

-- Product Collections (Shopify-like: Collections)
CREATE TABLE product_collections (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  handle VARCHAR(200) NOT NULL,
  description TEXT,
  image_url TEXT,
  published_at TIMESTAMP WITHOUT TIME ZONE,
  published_scope VARCHAR(50) DEFAULT 'web',
  sort_order VARCHAR(50) DEFAULT 'manual',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(store_id, handle)
);

CREATE INDEX idx_collections_store_id ON product_collections(store_id);
CREATE INDEX idx_collections_handle ON product_collections(handle);

-- Products (Shopify-like: Products)
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  handle VARCHAR(255) NOT NULL,
  body_html TEXT, -- HTML description
  vendor VARCHAR(150),
  product_type VARCHAR(150),
  status VARCHAR(50) DEFAULT 'draft', -- draft, active, archived
  published_at TIMESTAMP WITHOUT TIME ZONE,
  published_scope VARCHAR(50) DEFAULT 'web',
  template_suffix VARCHAR(100),
  sell_when_sold_out BOOLEAN DEFAULT false, -- המשך מכירה כשאין במלאי
  sold_by_weight BOOLEAN DEFAULT false, -- מוצר נמכר לפי משקל
  show_price_per_100ml BOOLEAN DEFAULT false, -- האם לרשום מחיר ל-100 מ"ל
  price_per_100ml NUMERIC(12,2), -- מחיר ל-100 מ"ל
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(store_id, handle)
);

CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_handle ON products(handle);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_vendor ON products(vendor);
CREATE INDEX idx_products_product_type ON products(product_type);

-- Product Images (Shopify-like: Product Images)
CREATE TABLE product_images (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  position INT DEFAULT 1,
  src TEXT NOT NULL,
  alt TEXT,
  width INT,
  height INT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_position ON product_images(product_id, position);

-- Product Tags (Shopify-like: Tags)
CREATE TABLE product_tags (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(store_id, name)
);

CREATE INDEX idx_product_tags_store_id ON product_tags(store_id);

-- Product Tag Mapping (Many-to-Many)
CREATE TABLE product_tag_map (
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  tag_id INT REFERENCES product_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);

-- Product Collection Mapping (Many-to-Many)
CREATE TABLE product_collection_map (
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  collection_id INT REFERENCES product_collections(id) ON DELETE CASCADE,
  position INT DEFAULT 0,
  PRIMARY KEY (product_id, collection_id)
);

CREATE INDEX idx_product_collection_map_product ON product_collection_map(product_id);
CREATE INDEX idx_product_collection_map_collection ON product_collection_map(collection_id);

-- Product Options (Shopify-like: Options)
CREATE TABLE product_options (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) DEFAULT 'button' CHECK (type IN ('button', 'color', 'pattern', 'image')),
  position INT DEFAULT 1,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_product_options_product_id ON product_options(product_id);
CREATE INDEX idx_product_options_type ON product_options(type);

-- Product Option Values
CREATE TABLE product_option_values (
  id SERIAL PRIMARY KEY,
  option_id INT REFERENCES product_options(id) ON DELETE CASCADE,
  value VARCHAR(200) NOT NULL,
  metadata JSONB DEFAULT NULL,
  position INT DEFAULT 1,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_option_values_option_id ON product_option_values(option_id);

-- Product Variants (Shopify-like: Variants)
CREATE TABLE product_variants (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  title VARCHAR(255),
  price NUMERIC(12,2) DEFAULT 0,
  compare_at_price NUMERIC(12,2),
  sku VARCHAR(100),
  barcode VARCHAR(100),
  position INT DEFAULT 1,
  option1 VARCHAR(255),
  option2 VARCHAR(255),
  option3 VARCHAR(255),
  taxable BOOLEAN DEFAULT true,
  grams INT, -- Weight in grams
  weight NUMERIC(6,2),
  weight_unit VARCHAR(10) DEFAULT 'kg',
  requires_shipping BOOLEAN DEFAULT true,
  inventory_management VARCHAR(50), -- shopify, not_managed
  inventory_policy VARCHAR(50) DEFAULT 'deny', -- deny, continue
  fulfillment_service VARCHAR(100) DEFAULT 'manual',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(sku);
CREATE INDEX idx_variants_barcode ON product_variants(barcode);

-- Variant Inventory (Shopify-like: Inventory Levels)
CREATE TABLE variant_inventory (
  id SERIAL PRIMARY KEY,
  variant_id INT REFERENCES product_variants(id) ON DELETE CASCADE,
  location_id INT, -- For multi-location support
  available INT DEFAULT 0,
  committed INT DEFAULT 0, -- Reserved for orders
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_variant_inventory_variant_id ON variant_inventory(variant_id);
CREATE INDEX idx_variant_inventory_location ON variant_inventory(location_id);

-- Product Meta Fields (Shopify-like: Metafields)
CREATE TABLE product_meta_fields (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  namespace VARCHAR(150) NOT NULL,
  key VARCHAR(150) NOT NULL,
  value TEXT,
  value_type VARCHAR(50) DEFAULT 'string', -- string, integer, json, etc.
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(product_id, namespace, key)
);

CREATE INDEX idx_product_meta_fields_product_id ON product_meta_fields(product_id);
CREATE INDEX idx_product_meta_fields_namespace_key ON product_meta_fields(namespace, key);

-- ============================================
-- 3. CUSTOMERS (Shopify-like: Customers API)
-- ============================================

-- Customers
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  email VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),
  accepts_marketing BOOLEAN DEFAULT false,
  accepts_marketing_updated_at TIMESTAMP WITHOUT TIME ZONE,
  marketing_opt_in_level VARCHAR(50), -- single_opt_in, confirmed_opt_in, unknown
  tax_exempt BOOLEAN DEFAULT false,
  tax_exemptions TEXT[], -- Array of exemption types
  note TEXT,
  state VARCHAR(50) DEFAULT 'enabled', -- enabled, disabled, invited
  verified_email BOOLEAN DEFAULT false,
  multipass_identifier VARCHAR(255),
  tags TEXT, -- Comma-separated tags
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_customers_store_id ON customers(store_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_state ON customers(state);

-- Customer Addresses (Shopify-like: Customer Addresses)
CREATE TABLE customer_addresses (
  id SERIAL PRIMARY KEY,
  customer_id INT REFERENCES customers(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  company VARCHAR(150),
  address1 VARCHAR(255),
  address2 VARCHAR(255),
  city VARCHAR(150),
  province VARCHAR(150),
  country VARCHAR(150) DEFAULT 'IL',
  zip VARCHAR(50),
  phone VARCHAR(50),
  name VARCHAR(255), -- Full name
  province_code VARCHAR(50),
  country_code VARCHAR(10) DEFAULT 'IL',
  country_name VARCHAR(150),
  default_address BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_customer_addresses_customer_id ON customer_addresses(customer_id);
CREATE INDEX idx_customer_addresses_default ON customer_addresses(customer_id, default_address);

-- Customer Notes (Internal staff notes)
CREATE TABLE customer_notes (
  id SERIAL PRIMARY KEY,
  customer_id INT REFERENCES customers(id) ON DELETE CASCADE,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  staff_only BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_customer_notes_customer_id ON customer_notes(customer_id);

-- Customer Tags (Many-to-Many)
CREATE TABLE customer_tag_map (
  customer_id INT REFERENCES customers(id) ON DELETE CASCADE,
  tag_name VARCHAR(100) NOT NULL,
  PRIMARY KEY (customer_id, tag_name)
);

CREATE INDEX idx_customer_tag_map_customer_id ON customer_tag_map(customer_id);

-- Customer Segments (קבוצות לקוחות)
CREATE TABLE customer_segments (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL, -- קריטריונים לזיהוי הלקוחות (למשל: {"min_orders": 5, "tags": ["VIP"]})
  customer_count INT DEFAULT 0, -- מספר הלקוחות בקבוצה (מחושב)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_customer_segments_store_id ON customer_segments(store_id);
CREATE INDEX idx_customer_segments_active ON customer_segments(store_id, is_active);

-- Customer Segment Mapping (Many-to-Many)
CREATE TABLE customer_segment_map (
  customer_id INT REFERENCES customers(id) ON DELETE CASCADE,
  segment_id INT REFERENCES customer_segments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  PRIMARY KEY (customer_id, segment_id)
);

CREATE INDEX idx_customer_segment_map_customer_id ON customer_segment_map(customer_id);
CREATE INDEX idx_customer_segment_map_segment_id ON customer_segment_map(segment_id);

-- ============================================
-- 4. ORDERS (Shopify-like: Orders API)
-- ============================================

-- Orders
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  customer_id INT REFERENCES customers(id),
  email VARCHAR(255),
  phone VARCHAR(50),
  name VARCHAR(255), -- Customer full name
  order_number INT, -- Sequential order number per store (starts from 1000)
  order_name VARCHAR(50), -- Display name like #1001
  order_handle VARCHAR(255) UNIQUE, -- Secure handle for order URL (encrypted/random)
  financial_status VARCHAR(50) DEFAULT 'pending', -- pending, authorized, partially_paid, paid, partially_refunded, refunded, voided
  fulfillment_status VARCHAR(50), -- fulfilled, partial, restocked, null
  total_price NUMERIC(12,2) NOT NULL,
  subtotal_price NUMERIC(12,2),
  total_tax NUMERIC(12,2) DEFAULT 0,
  total_discounts NUMERIC(12,2) DEFAULT 0,
  total_shipping_price NUMERIC(12,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'ILS',
  current_total_discounts NUMERIC(12,2) DEFAULT 0,
  current_total_price NUMERIC(12,2),
  current_subtotal_price NUMERIC(12,2),
  current_total_tax NUMERIC(12,2),
  buyer_accepts_marketing BOOLEAN DEFAULT false,
  cancel_reason VARCHAR(100), -- customer, fraud, inventory, other
  cancelled_at TIMESTAMP WITHOUT TIME ZONE,
  cart_token VARCHAR(255),
  checkout_token VARCHAR(255),
  checkout_id BIGINT,
  client_details JSONB, -- Browser, IP, etc.
  closed_at TIMESTAMP WITHOUT TIME ZONE,
  confirmed BOOLEAN DEFAULT false,
  contact_email VARCHAR(255),
  discount_codes JSONB, -- Array of discount codes applied
  gateway VARCHAR(100),
  landing_site TEXT,
  landing_site_ref VARCHAR(255),
  location_id INT,
  note TEXT,
  note_attributes JSONB,
  number INT, -- Sequential number
  processed_at TIMESTAMP WITHOUT TIME ZONE,
  referring_site TEXT,
  source_name VARCHAR(100), -- web, pos, etc.
  tags TEXT, -- Comma-separated
  test BOOLEAN DEFAULT false,
  token VARCHAR(255),
  total_duties NUMERIC(12,2) DEFAULT 0,
  total_line_items_price NUMERIC(12,2),
  total_outstanding NUMERIC(12,2),
  total_price_usd NUMERIC(12,2),
  total_weight INT, -- In grams
  user_id INT, -- Staff user who created order
  billing_address JSONB, -- Full address object
  shipping_address JSONB, -- Full address object
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_handle ON orders(order_handle);
CREATE INDEX idx_orders_email ON orders(email);
CREATE INDEX idx_orders_financial_status ON orders(financial_status);
CREATE INDEX idx_orders_fulfillment_status ON orders(fulfillment_status);
CREATE INDEX idx_orders_order_number ON orders(store_id, order_number);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Order Line Items (Shopify-like: Line Items)
CREATE TABLE order_line_items (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id),
  variant_id INT REFERENCES product_variants(id),
  title VARCHAR(255) NOT NULL,
  variant_title VARCHAR(255),
  vendor VARCHAR(150),
  product_exists BOOLEAN DEFAULT true,
  quantity INT NOT NULL DEFAULT 1,
  sku VARCHAR(100),
  variant_inventory_management VARCHAR(50),
  fulfillment_service VARCHAR(100),
  fulfillment_status VARCHAR(50),
  requires_shipping BOOLEAN DEFAULT true,
  taxable BOOLEAN DEFAULT true,
  gift_card BOOLEAN DEFAULT false,
  name VARCHAR(255), -- Full product name with variant
  variant_inventory_quantity INT,
  properties JSONB, -- Custom properties
  product_properties JSONB,
  total_discount NUMERIC(12,2) DEFAULT 0,
  price NUMERIC(12,2) NOT NULL,
  grams INT,
  tax_lines JSONB, -- Array of tax lines
  duties JSONB,
  discount_allocations JSONB,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_order_line_items_order_id ON order_line_items(order_id);
CREATE INDEX idx_order_line_items_product_id ON order_line_items(product_id);
CREATE INDEX idx_order_line_items_variant_id ON order_line_items(variant_id);

-- Order Fulfillments (Shopify-like: Fulfillments)
CREATE TABLE order_fulfillments (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending', -- pending, open, success, cancelled, error, failure
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  tracking_company VARCHAR(150),
  tracking_number VARCHAR(255),
  tracking_numbers TEXT[], -- Array of tracking numbers
  tracking_url TEXT,
  tracking_urls TEXT[], -- Array of tracking URLs
  receipt JSONB,
  name VARCHAR(50), -- Fulfillment name like #1
  service VARCHAR(100),
  shipment_status VARCHAR(50),
  location_id INT,
  origin_address JSONB,
  destination JSONB,
  line_items JSONB, -- Array of line item IDs
  notify_customer BOOLEAN DEFAULT true
);

CREATE INDEX idx_order_fulfillments_order_id ON order_fulfillments(order_id);
CREATE INDEX idx_order_fulfillments_status ON order_fulfillments(status);

-- Order Refunds (Shopify-like: Refunds)
CREATE TABLE order_refunds (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id) ON DELETE CASCADE,
  note TEXT,
  user_id INT, -- Staff user who created refund
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  refund_line_items JSONB, -- Array of refund line items
  transactions JSONB, -- Array of transactions
  order_adjustments JSONB, -- Array of order adjustments
  currency VARCHAR(10) DEFAULT 'ILS'
);

CREATE INDEX idx_order_refunds_order_id ON order_refunds(order_id);

-- ============================================
-- 5. TRANSACTIONS (Shopify-like: Transactions API)
-- ============================================

-- Transactions
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  order_id INT REFERENCES orders(id) ON DELETE CASCADE,
  kind VARCHAR(50) NOT NULL, -- sale, capture, authorization, void, refund
  status VARCHAR(50), -- pending, success, failure, error
  amount NUMERIC(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'ILS',
  gateway VARCHAR(100),
  source_name VARCHAR(100), -- web, pos, etc.
  message TEXT,
  test BOOLEAN DEFAULT false,
  authorization_code VARCHAR(255),
  location_id INT,
  parent_id INT REFERENCES transactions(id), -- For refunds
  device_id INT,
  receipt JSONB,
  error_code VARCHAR(100),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_transactions_store_id ON transactions(store_id);
CREATE INDEX idx_transactions_order_id ON transactions(order_id);
CREATE INDEX idx_transactions_kind ON transactions(kind);
CREATE INDEX idx_transactions_status ON transactions(status);

-- ============================================
-- 6. PAYMENT PROVIDERS
-- ============================================

-- Payment Providers
CREATE TABLE payment_providers (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  provider_name VARCHAR(150) NOT NULL, -- credit_card, paypal, etc.
  environment VARCHAR(50) DEFAULT 'test', -- test, production
  api_public_key TEXT,
  api_secret_key TEXT,
  webhook_secret TEXT,
  is_active BOOLEAN DEFAULT false,
  settings JSONB, -- Provider-specific settings
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_payment_providers_store_id ON payment_providers(store_id);

-- ============================================
-- 7. SHIPPING (Shopify-like: Shipping Zones API)
-- ============================================

-- Shipping Zones
CREATE TABLE shipping_zones (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  countries TEXT[], -- Array of country codes
  provinces TEXT[], -- Array of province codes
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_shipping_zones_store_id ON shipping_zones(store_id);

-- Shipping Rates
CREATE TABLE shipping_rates (
  id SERIAL PRIMARY KEY,
  shipping_zone_id INT REFERENCES shipping_zones(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  price NUMERIC(12,2) DEFAULT 0,
  min_order_subtotal NUMERIC(12,2),
  max_order_subtotal NUMERIC(12,2),
  min_weight NUMERIC(6,2),
  max_weight NUMERIC(6,2),
  free_shipping_threshold NUMERIC(12,2),
  delivery_days_min INT,
  delivery_days_max INT,
  carrier_service_id INT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_shipping_rates_zone_id ON shipping_rates(shipping_zone_id);

-- ============================================
-- 8. DISCOUNTS (Shopify-like: Discounts API)
-- ============================================

-- Discount Codes (with all conditions support)
CREATE TABLE discount_codes (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  code VARCHAR(100) NOT NULL,
  discount_type VARCHAR(50) NOT NULL, -- percentage, fixed_amount, free_shipping, bogo, bundle, volume
  value NUMERIC(12,2),
  minimum_order_amount NUMERIC(12,2),
  maximum_order_amount NUMERIC(12,2),
  minimum_quantity INT,
  maximum_quantity INT,
  usage_limit INT,
  usage_count INT DEFAULT 0,
  applies_to VARCHAR(50) DEFAULT 'all', -- all, specific_products, specific_collections, specific_tags
  priority INT DEFAULT 0,
  can_combine_with_automatic BOOLEAN DEFAULT true,
  can_combine_with_other_codes BOOLEAN DEFAULT false,
  max_combined_discounts INT DEFAULT 1,
  customer_segment VARCHAR(50), -- all, vip, new_customer, returning_customer
  minimum_orders_count INT,
  minimum_lifetime_value NUMERIC(12,2),
  starts_at TIMESTAMP WITHOUT TIME ZONE,
  ends_at TIMESTAMP WITHOUT TIME ZONE,
  day_of_week INT[], -- 0=Sunday, 1=Monday, etc. NULL = כל יום
  hour_start INT, -- שעה התחלה (0-23)
  hour_end INT, -- שעה סיום (0-23)
  -- BOGO fields (Buy One Get One)
  buy_quantity INT, -- כמה לקנות (לדוגמה: 1)
  get_quantity INT, -- כמה לקבל (לדוגמה: 1)
  get_discount_type VARCHAR(50), -- free, percentage, fixed_amount (על מה שמקבלים)
  get_discount_value NUMERIC(12,2), -- ערך ההנחה על מה שמקבלים (אם לא free)
  applies_to_same_product BOOLEAN DEFAULT true, -- האם זה חל על אותו מוצר
  -- Bundle fields (קנה X מוצרים ביחד)
  bundle_min_products INT, -- מינימום מוצרים בחבילה
  bundle_discount_type VARCHAR(50), -- percentage, fixed_amount
  bundle_discount_value NUMERIC(12,2), -- ערך ההנחה על החבילה
  -- Volume fields (הנחה לפי כמות)
  volume_tiers JSONB, -- [{quantity: 5, discount_type: 'percentage', value: 10}, ...]
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(store_id, code)
);

CREATE INDEX idx_discount_codes_store_id ON discount_codes(store_id);
CREATE INDEX idx_discount_codes_code ON discount_codes(code);
CREATE INDEX idx_discount_codes_active ON discount_codes(is_active, starts_at, ends_at);
CREATE INDEX idx_discount_codes_priority ON discount_codes(priority DESC);

-- Automatic Discounts (הנחות אוטומטיות)
CREATE TABLE automatic_discounts (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  discount_type VARCHAR(50) NOT NULL, -- percentage, fixed_amount, free_shipping, bogo, bundle, volume
  value NUMERIC(12,2),
  minimum_order_amount NUMERIC(12,2),
  maximum_order_amount NUMERIC(12,2),
  minimum_quantity INT,
  maximum_quantity INT,
  applies_to VARCHAR(50) DEFAULT 'all', -- all, specific_products, specific_collections, specific_tags
  priority INT DEFAULT 0,
  can_combine_with_codes BOOLEAN DEFAULT true,
  can_combine_with_other_automatic BOOLEAN DEFAULT false,
  max_combined_discounts INT DEFAULT 1,
  customer_segment VARCHAR(50), -- all, vip, new_customer, returning_customer
  minimum_orders_count INT,
  minimum_lifetime_value NUMERIC(12,2),
  starts_at TIMESTAMP WITHOUT TIME ZONE,
  ends_at TIMESTAMP WITHOUT TIME ZONE,
  day_of_week INT[], -- 0=Sunday, 1=Monday, etc. NULL = כל יום
  hour_start INT, -- שעה התחלה (0-23)
  hour_end INT, -- שעה סיום (0-23)
  -- BOGO fields (Buy One Get One)
  buy_quantity INT, -- כמה לקנות (לדוגמה: 1)
  get_quantity INT, -- כמה לקבל (לדוגמה: 1)
  get_discount_type VARCHAR(50), -- free, percentage, fixed_amount (על מה שמקבלים)
  get_discount_value NUMERIC(12,2), -- ערך ההנחה על מה שמקבלים (אם לא free)
  applies_to_same_product BOOLEAN DEFAULT true, -- האם זה חל על אותו מוצר
  -- Bundle fields (קנה X מוצרים ביחד)
  bundle_min_products INT, -- מינימום מוצרים בחבילה
  bundle_discount_type VARCHAR(50), -- percentage, fixed_amount
  bundle_discount_value NUMERIC(12,2), -- ערך ההנחה על החבילה
  -- Volume fields (הנחה לפי כמות)
  volume_tiers JSONB, -- [{quantity: 5, discount_type: 'percentage', value: 10}, ...]
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_automatic_discounts_store_id ON automatic_discounts(store_id);
CREATE INDEX idx_automatic_discounts_active ON automatic_discounts(is_active, starts_at, ends_at);
CREATE INDEX idx_automatic_discounts_priority ON automatic_discounts(priority DESC);

-- Mapping Tables for Discount Codes

-- Products that discount code applies to
CREATE TABLE discount_code_products (
  discount_code_id INT REFERENCES discount_codes(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (discount_code_id, product_id)
);

CREATE INDEX idx_discount_code_products_code_id ON discount_code_products(discount_code_id);
CREATE INDEX idx_discount_code_products_product_id ON discount_code_products(product_id);

-- Collections that discount code applies to
CREATE TABLE discount_code_collections (
  discount_code_id INT REFERENCES discount_codes(id) ON DELETE CASCADE,
  collection_id INT REFERENCES product_collections(id) ON DELETE CASCADE,
  PRIMARY KEY (discount_code_id, collection_id)
);

CREATE INDEX idx_discount_code_collections_code_id ON discount_code_collections(discount_code_id);
CREATE INDEX idx_discount_code_collections_collection_id ON discount_code_collections(collection_id);

-- Tags that discount code applies to
CREATE TABLE discount_code_tags (
  discount_code_id INT REFERENCES discount_codes(id) ON DELETE CASCADE,
  tag_name VARCHAR(100) NOT NULL,
  PRIMARY KEY (discount_code_id, tag_name)
);

CREATE INDEX idx_discount_code_tags_code_id ON discount_code_tags(discount_code_id);

-- Mapping Tables for Automatic Discounts

-- Products that automatic discount applies to
CREATE TABLE automatic_discount_products (
  automatic_discount_id INT REFERENCES automatic_discounts(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (automatic_discount_id, product_id)
);

CREATE INDEX idx_automatic_discount_products_discount_id ON automatic_discount_products(automatic_discount_id);
CREATE INDEX idx_automatic_discount_products_product_id ON automatic_discount_products(product_id);

-- Collections that automatic discount applies to
CREATE TABLE automatic_discount_collections (
  automatic_discount_id INT REFERENCES automatic_discounts(id) ON DELETE CASCADE,
  collection_id INT REFERENCES product_collections(id) ON DELETE CASCADE,
  PRIMARY KEY (automatic_discount_id, collection_id)
);

CREATE INDEX idx_automatic_discount_collections_discount_id ON automatic_discount_collections(automatic_discount_id);
CREATE INDEX idx_automatic_discount_collections_collection_id ON automatic_discount_collections(collection_id);

-- Tags that automatic discount applies to
CREATE TABLE automatic_discount_tags (
  automatic_discount_id INT REFERENCES automatic_discounts(id) ON DELETE CASCADE,
  tag_name VARCHAR(100) NOT NULL,
  PRIMARY KEY (automatic_discount_id, tag_name)
);

CREATE INDEX idx_automatic_discount_tags_discount_id ON automatic_discount_tags(automatic_discount_id);

-- ============================================
-- 9. ANALYTICS
-- ============================================

-- Analytics Events
CREATE TABLE analytics_events (
  id BIGSERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  event_type VARCHAR(150) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_analytics_events_store_id ON analytics_events(store_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);

-- Daily Analytics Summary
CREATE TABLE analytics_daily (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  visits INT DEFAULT 0,
  unique_visitors INT DEFAULT 0,
  orders INT DEFAULT 0,
  revenue NUMERIC(12,2) DEFAULT 0,
  top_products JSONB,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(store_id, date)
);

CREATE INDEX idx_analytics_daily_store_date ON analytics_daily(store_id, date DESC);

-- ============================================
-- 10. WEBHOOKS (Shopify-like: Webhooks API)
-- ============================================

-- Webhook Subscriptions
CREATE TABLE webhook_subscriptions (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  topic VARCHAR(150) NOT NULL, -- orders/create, products/update, etc.
  address TEXT NOT NULL, -- Callback URL
  format VARCHAR(50) DEFAULT 'json', -- json, xml
  fields TEXT[], -- Array of fields to include
  metafield_namespaces TEXT[],
  api_version VARCHAR(20) DEFAULT '2024-01',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_webhook_subscriptions_store_id ON webhook_subscriptions(store_id);
CREATE INDEX idx_webhook_subscriptions_topic ON webhook_subscriptions(topic);

-- Webhook Events (Delivery Queue)
CREATE TABLE webhook_events (
  id BIGSERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  subscription_id INT REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
  topic VARCHAR(150) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed
  attempts INT DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_webhook_events_store_id ON webhook_events(store_id);
CREATE INDEX idx_webhook_events_status ON webhook_events(status);
CREATE INDEX idx_webhook_events_created_at ON webhook_events(created_at);

-- Webhook Delivery Attempts
CREATE TABLE webhook_delivery_attempts (
  id BIGSERIAL PRIMARY KEY,
  webhook_event_id BIGINT REFERENCES webhook_events(id) ON DELETE CASCADE,
  attempt_number INT NOT NULL,
  status VARCHAR(50) NOT NULL, -- success, failed
  http_status INT,
  response_time_ms INT,
  response_body TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_webhook_attempts_event_id ON webhook_delivery_attempts(webhook_event_id);

-- ============================================
-- 11. SYSTEM LOGS
-- ============================================

-- System Logs
CREATE TABLE system_logs (
  id BIGSERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  level VARCHAR(20) DEFAULT 'info', -- info, warn, error, debug
  source VARCHAR(100), -- api, webhook, billing, auth, etc.
  message TEXT NOT NULL,
  context JSONB,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_system_logs_store_id ON system_logs(store_id);
CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_source ON system_logs(source);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at DESC);

-- Request Logs (Optional - for API monitoring)
CREATE TABLE request_logs (
  id BIGSERIAL PRIMARY KEY,
  store_id INT,
  method VARCHAR(10),
  path TEXT,
  ip_address VARCHAR(100),
  user_agent TEXT,
  status_code INT,
  duration_ms INT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_request_logs_store_id ON request_logs(store_id);
CREATE INDEX idx_request_logs_created_at ON request_logs(created_at DESC);

-- User Sessions (למעקב ארוך טווח - Redis משמש למעקב בזמן אמת)
CREATE TABLE user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES store_owners(id) ON DELETE CASCADE,
  store_id INT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  ip_address VARCHAR(100),
  user_agent TEXT,
  last_activity TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_store_id ON user_sessions(store_id);
CREATE INDEX idx_user_sessions_last_activity ON user_sessions(last_activity DESC);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_session_token ON user_sessions(session_token);

-- ============================================
-- 12. ADMIN USERS & PERMISSIONS
-- ============================================

-- Admin Users (Staff users for stores)
CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  password_hash TEXT NOT NULL,
  role VARCHAR(50) DEFAULT 'staff', -- owner, admin, staff, limited_staff
  permissions JSONB, -- Custom permissions object
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(store_id, email)
);

CREATE INDEX idx_admin_users_store_id ON admin_users(store_id);
CREATE INDEX idx_admin_users_email ON admin_users(email);

-- ============================================
-- 13. GIFT CARDS (כרטיסי מתנה)
-- ============================================

-- Gift Cards
CREATE TABLE gift_cards (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  code VARCHAR(100) NOT NULL UNIQUE,
  initial_value NUMERIC(12,2) NOT NULL,
  current_value NUMERIC(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'ILS',
  expires_at TIMESTAMP WITHOUT TIME ZONE,
  customer_id INT REFERENCES customers(id),
  order_id INT REFERENCES orders(id), -- אם נוצר מהזמנה
  note TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(store_id, code)
);

CREATE INDEX idx_gift_cards_store_id ON gift_cards(store_id);
CREATE INDEX idx_gift_cards_code ON gift_cards(code);
CREATE INDEX idx_gift_cards_customer_id ON gift_cards(customer_id);
CREATE INDEX idx_gift_cards_active ON gift_cards(is_active, expires_at);

-- Gift Card Transactions (שלושות שימוש)
CREATE TABLE gift_card_transactions (
  id SERIAL PRIMARY KEY,
  gift_card_id INT REFERENCES gift_cards(id) ON DELETE CASCADE,
  order_id INT REFERENCES orders(id),
  amount NUMERIC(12,2) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, -- used, refunded, expired
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_gift_card_transactions_gift_card_id ON gift_card_transactions(gift_card_id);
CREATE INDEX idx_gift_card_transactions_order_id ON gift_card_transactions(order_id);

-- ============================================
-- 14. ABANDONED CARTS (עגלות נטושות)
-- ============================================

-- Abandoned Carts
CREATE TABLE abandoned_carts (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  customer_id INT REFERENCES customers(id),
  email VARCHAR(255),
  token VARCHAR(255) UNIQUE,
  cart_data JSONB NOT NULL, -- פריטי העגלה
  total_price NUMERIC(12,2),
  currency VARCHAR(10) DEFAULT 'ILS',
  abandoned_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  recovered_at TIMESTAMP WITHOUT TIME ZONE,
  last_activity_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_abandoned_carts_store_id ON abandoned_carts(store_id);
CREATE INDEX idx_abandoned_carts_customer_id ON abandoned_carts(customer_id);
CREATE INDEX idx_abandoned_carts_email ON abandoned_carts(email);
CREATE INDEX idx_abandoned_carts_token ON abandoned_carts(token);
CREATE INDEX idx_abandoned_carts_abandoned_at ON abandoned_carts(abandoned_at DESC);

-- ============================================
-- 15. WISHLISTS (רשימת המתנה)
-- ============================================

-- Wishlists
CREATE TABLE wishlists (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  customer_id INT REFERENCES customers(id) ON DELETE CASCADE,
  name VARCHAR(200) DEFAULT 'My Wishlist',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_wishlists_store_id ON wishlists(store_id);
CREATE INDEX idx_wishlists_customer_id ON wishlists(customer_id);

-- Wishlist Items
CREATE TABLE wishlist_items (
  id SERIAL PRIMARY KEY,
  wishlist_id INT REFERENCES wishlists(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  variant_id INT REFERENCES product_variants(id),
  quantity INT DEFAULT 1,
  note TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(wishlist_id, product_id, variant_id)
);

CREATE INDEX idx_wishlist_items_wishlist_id ON wishlist_items(wishlist_id);
CREATE INDEX idx_wishlist_items_product_id ON wishlist_items(product_id);

-- ============================================
-- 16. CONTENT MANAGEMENT (תוכן)
-- ============================================

-- Pages (דפים)
CREATE TABLE pages (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  handle VARCHAR(255) NOT NULL,
  body_html TEXT,
  author_id INT REFERENCES admin_users(id),
  published_at TIMESTAMP WITHOUT TIME ZONE,
  template_suffix VARCHAR(100),
  meta_title VARCHAR(255),
  meta_description TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(store_id, handle)
);

CREATE INDEX idx_pages_store_id ON pages(store_id);
CREATE INDEX idx_pages_handle ON pages(handle);
CREATE INDEX idx_pages_published ON pages(is_published, published_at);

-- Navigation Menus (תפריטי ניווט)
CREATE TABLE navigation_menus (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  handle VARCHAR(200) NOT NULL,
  position VARCHAR(50), -- header, footer, sidebar
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(store_id, handle)
);

CREATE INDEX idx_navigation_menus_store_id ON navigation_menus(store_id);

-- Navigation Menu Items
CREATE TABLE navigation_menu_items (
  id SERIAL PRIMARY KEY,
  menu_id INT REFERENCES navigation_menus(id) ON DELETE CASCADE,
  parent_id INT REFERENCES navigation_menu_items(id),
  title VARCHAR(255) NOT NULL,
  url TEXT,
  type VARCHAR(50) NOT NULL, -- link, page, collection, product
  resource_id INT, -- ID של המשאב (page, collection, product)
  position INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_navigation_menu_items_menu_id ON navigation_menu_items(menu_id);
CREATE INDEX idx_navigation_menu_items_parent_id ON navigation_menu_items(parent_id);
CREATE INDEX idx_navigation_menu_items_position ON navigation_menu_items(menu_id, position);

-- Blog Posts (בלוג)
CREATE TABLE blog_posts (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  blog_id INT, -- אם יש מספר בלוגים
  title VARCHAR(255) NOT NULL,
  handle VARCHAR(255) NOT NULL,
  body_html TEXT,
  excerpt TEXT,
  author_id INT REFERENCES admin_users(id),
  published_at TIMESTAMP WITHOUT TIME ZONE,
  tags TEXT[], -- מערך תגיות
  meta_title VARCHAR(255),
  meta_description TEXT,
  featured_image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(store_id, blog_id, handle)
);

CREATE INDEX idx_blog_posts_store_id ON blog_posts(store_id);
CREATE INDEX idx_blog_posts_blog_id ON blog_posts(blog_id);
CREATE INDEX idx_blog_posts_published ON blog_posts(is_published, published_at DESC);

-- Blog Categories
CREATE TABLE blog_categories (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  blog_id INT,
  name VARCHAR(200) NOT NULL,
  handle VARCHAR(200) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(store_id, blog_id, handle)
);

CREATE INDEX idx_blog_categories_store_id ON blog_categories(store_id);

-- Blog Post Categories (Many-to-Many)
CREATE TABLE blog_post_categories (
  post_id INT REFERENCES blog_posts(id) ON DELETE CASCADE,
  category_id INT REFERENCES blog_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);

-- Popups (פופאפים)
CREATE TABLE popups (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  title VARCHAR(255),
  content_html TEXT,
  trigger_type VARCHAR(50) DEFAULT 'time', -- time, scroll, exit_intent, page_load
  trigger_value INT, -- שניות, אחוז גלילה, וכו'
  display_rules JSONB, -- כללי תצוגה (דפים, זמן, וכו')
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP WITHOUT TIME ZONE,
  ends_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_popups_store_id ON popups(store_id);
CREATE INDEX idx_popups_active ON popups(is_active, starts_at, ends_at);

-- Media Library (מדיה)
CREATE TABLE media_files (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255),
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50), -- image, video, document, etc.
  mime_type VARCHAR(100),
  file_size BIGINT, -- בבתים
  width INT, -- לתמונות
  height INT, -- לתמונות
  alt_text TEXT,
  description TEXT,
  folder_path VARCHAR(500), -- ארגון בתיקיות
  created_by INT REFERENCES admin_users(id),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_media_files_store_id ON media_files(store_id);
CREATE INDEX idx_media_files_file_type ON media_files(file_type);
CREATE INDEX idx_media_files_folder_path ON media_files(folder_path);

-- ============================================
-- 17. PRODUCT REVIEWS (ביקורות)
-- ============================================

-- Product Reviews
CREATE TABLE product_reviews (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  customer_id INT REFERENCES customers(id),
  order_id INT REFERENCES orders(id), -- אם נוצר מהזמנה
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  review_text TEXT,
  reviewer_name VARCHAR(200),
  reviewer_email VARCHAR(255),
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  helpful_count INT DEFAULT 0,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_product_reviews_store_id ON product_reviews(store_id);
CREATE INDEX idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_customer_id ON product_reviews(customer_id);
CREATE INDEX idx_product_reviews_approved ON product_reviews(is_approved, is_published);
CREATE INDEX idx_product_reviews_rating ON product_reviews(product_id, rating);

-- Review Helpful Votes
CREATE TABLE review_helpful_votes (
  id SERIAL PRIMARY KEY,
  review_id INT REFERENCES product_reviews(id) ON DELETE CASCADE,
  customer_id INT REFERENCES customers(id),
  ip_address VARCHAR(100),
  is_helpful BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(review_id, customer_id)
);

CREATE INDEX idx_review_helpful_votes_review_id ON review_helpful_votes(review_id);

-- ============================================
-- 18. STORE CREDITS (קרדיט בחנות)
-- ============================================

-- Store Credits
CREATE TABLE store_credits (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  customer_id INT REFERENCES customers(id) ON DELETE CASCADE,
  balance NUMERIC(12,2) DEFAULT 0 NOT NULL,
  currency VARCHAR(10) DEFAULT 'ILS',
  expires_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(store_id, customer_id)
);

CREATE INDEX idx_store_credits_store_id ON store_credits(store_id);
CREATE INDEX idx_store_credits_customer_id ON store_credits(customer_id);

-- Store Credit Transactions
CREATE TABLE store_credit_transactions (
  id SERIAL PRIMARY KEY,
  store_credit_id INT REFERENCES store_credits(id) ON DELETE CASCADE,
  order_id INT REFERENCES orders(id),
  amount NUMERIC(12,2) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, -- earned, used, refunded, expired, manual_adjustment
  description TEXT,
  admin_user_id INT REFERENCES admin_users(id),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_store_credit_transactions_store_credit_id ON store_credit_transactions(store_credit_id);
CREATE INDEX idx_store_credit_transactions_order_id ON store_credit_transactions(order_id);

-- ============================================
-- 19. SIZE CHARTS (טבלת מידות)
-- ============================================

-- Size Charts
CREATE TABLE size_charts (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  chart_type VARCHAR(50) DEFAULT 'clothing', -- clothing, shoes, accessories, etc.
  chart_data JSONB NOT NULL, -- נתוני הטבלה (מידות, מדידות, וכו')
  image_url TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_size_charts_store_id ON size_charts(store_id);

-- Product Size Chart Mapping
CREATE TABLE product_size_chart_map (
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  size_chart_id INT REFERENCES size_charts(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, size_chart_id)
);

CREATE INDEX idx_product_size_chart_map_product_id ON product_size_chart_map(product_id);

-- ============================================
-- 20. PRODUCT ADDONS (תוספות למוצרים)
-- ============================================

-- Product Addons
CREATE TABLE product_addons (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  addon_type VARCHAR(50) NOT NULL, -- checkbox, radio, select, text_input, file_upload
  is_required BOOLEAN DEFAULT false,
  price_modifier NUMERIC(12,2) DEFAULT 0, -- תוספת/הנחה למחיר
  settings JSONB, -- הגדרות מותאמות לפי סוג התוספת
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_product_addons_store_id ON product_addons(store_id);

-- Product Addon Options (עבור radio/select)
CREATE TABLE product_addon_options (
  id SERIAL PRIMARY KEY,
  addon_id INT REFERENCES product_addons(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  value VARCHAR(255),
  price_modifier NUMERIC(12,2) DEFAULT 0,
  position INT DEFAULT 0,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_product_addon_options_addon_id ON product_addon_options(addon_id);

-- Product Addon Mapping (איזה מוצרים יכולים להשתמש בתוספת)
CREATE TABLE product_addon_map (
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  addon_id INT REFERENCES product_addons(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, addon_id)
);

CREATE INDEX idx_product_addon_map_product_id ON product_addon_map(product_id);

-- Order Line Item Addons (תוספות שנבחרו בהזמנה)
CREATE TABLE order_line_item_addons (
  id SERIAL PRIMARY KEY,
  order_line_item_id INT REFERENCES order_line_items(id) ON DELETE CASCADE,
  addon_id INT REFERENCES product_addons(id),
  addon_option_id INT REFERENCES product_addon_options(id),
  value TEXT, -- ערך מותאם (לטקסט, קובץ, וכו')
  price_modifier NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_order_line_item_addons_line_item_id ON order_line_item_addons(order_line_item_id);

-- ============================================
-- 21. AUTOMATIONS (אוטומציות)
-- ============================================

-- Automations
CREATE TABLE automations (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  trigger_type VARCHAR(100) NOT NULL, -- order.created, customer.created, cart.abandoned, etc.
  trigger_conditions JSONB, -- תנאים נוספים
  actions JSONB NOT NULL, -- פעולות לביצוע (send_email, add_tag, update_status, etc.)
  is_active BOOLEAN DEFAULT true,
  run_count INT DEFAULT 0,
  last_run_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_automations_store_id ON automations(store_id);
CREATE INDEX idx_automations_trigger_type ON automations(trigger_type);
CREATE INDEX idx_automations_active ON automations(is_active);

-- Automation Runs (היסטוריית הרצות)
CREATE TABLE automation_runs (
  id BIGSERIAL PRIMARY KEY,
  automation_id INT REFERENCES automations(id) ON DELETE CASCADE,
  trigger_event_id BIGINT, -- קישור לאירוע שגרם להרצה
  status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed
  result JSONB,
  error_message TEXT,
  started_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX idx_automation_runs_automation_id ON automation_runs(automation_id);
CREATE INDEX idx_automation_runs_status ON automation_runs(status);

-- ============================================
-- 22. TRACKING PIXELS & CODES (פיקסלים וקודי מעקב)
-- ============================================

-- Tracking Pixels
CREATE TABLE tracking_pixels (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  pixel_type VARCHAR(50) NOT NULL, -- facebook, google_analytics, tiktok, custom
  pixel_id VARCHAR(255),
  pixel_code TEXT, -- קוד מותאם
  placement VARCHAR(50) DEFAULT 'head', -- head, body, footer
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_tracking_pixels_store_id ON tracking_pixels(store_id);
CREATE INDEX idx_tracking_pixels_active ON tracking_pixels(is_active);

-- Tracking Codes (קודי מעקב מותאמים)
CREATE TABLE tracking_codes (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  code_type VARCHAR(50), -- script, noscript, custom_html
  code_content TEXT NOT NULL,
  placement VARCHAR(50) DEFAULT 'head',
  trigger_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_tracking_codes_store_id ON tracking_codes(store_id);

-- ============================================
-- 23. LOYALTY PROGRAM (מועדון לקוחות ונקודות)
-- ============================================

-- Customer Loyalty Tiers (רמות מועדון)
CREATE TABLE customer_loyalty_tiers (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  tier_level INT NOT NULL, -- 1, 2, 3, וכו'
  min_points INT DEFAULT 0, -- נקודות מינימום לרמה
  discount_percentage NUMERIC(5,2) DEFAULT 0, -- הנחה לרמה זו
  benefits JSONB, -- הטבות נוספות
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(store_id, tier_level)
);

CREATE INDEX idx_customer_loyalty_tiers_store_id ON customer_loyalty_tiers(store_id);

-- Customer Loyalty Points
CREATE TABLE customer_loyalty_points (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  customer_id INT REFERENCES customers(id) ON DELETE CASCADE,
  total_points INT DEFAULT 0 NOT NULL,
  available_points INT DEFAULT 0 NOT NULL, -- נקודות זמינות לשימוש
  pending_points INT DEFAULT 0, -- נקודות ממתינות (לפני אישור הזמנה)
  tier_id INT REFERENCES customer_loyalty_tiers(id),
  expires_at TIMESTAMP WITHOUT TIME ZONE, -- תאריך תפוגה לנקודות
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(store_id, customer_id)
);

CREATE INDEX idx_customer_loyalty_points_store_id ON customer_loyalty_points(store_id);
CREATE INDEX idx_customer_loyalty_points_customer_id ON customer_loyalty_points(customer_id);
CREATE INDEX idx_customer_loyalty_points_tier_id ON customer_loyalty_points(tier_id);

-- Loyalty Point Transactions
CREATE TABLE loyalty_point_transactions (
  id BIGSERIAL PRIMARY KEY,
  loyalty_points_id INT REFERENCES customer_loyalty_points(id) ON DELETE CASCADE,
  order_id INT REFERENCES orders(id),
  points INT NOT NULL, -- חיובי = צבירה, שלילי = שימוש
  transaction_type VARCHAR(50) NOT NULL, -- earned, redeemed, expired, manual_adjustment, refunded
  description TEXT,
  expires_at TIMESTAMP WITHOUT TIME ZONE,
  admin_user_id INT REFERENCES admin_users(id),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_loyalty_point_transactions_loyalty_points_id ON loyalty_point_transactions(loyalty_points_id);
CREATE INDEX idx_loyalty_point_transactions_order_id ON loyalty_point_transactions(order_id);
CREATE INDEX idx_loyalty_point_transactions_type ON loyalty_point_transactions(transaction_type);

-- Loyalty Program Rules (חוקי צבירת נקודות)
CREATE TABLE loyalty_program_rules (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  rule_type VARCHAR(50) NOT NULL, -- purchase, signup, review, referral, etc.
  points_amount INT NOT NULL,
  conditions JSONB, -- תנאים נוספים (סכום מינימום, וכו')
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP WITHOUT TIME ZONE,
  ends_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_loyalty_program_rules_store_id ON loyalty_program_rules(store_id);
CREATE INDEX idx_loyalty_program_rules_active ON loyalty_program_rules(is_active, starts_at, ends_at);

-- ============================================
-- 24. INTEGRATIONS (אינטגרציות)
-- ============================================

-- Integrations
CREATE TABLE integrations (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  integration_type VARCHAR(100) NOT NULL, -- email_marketing, crm, accounting, shipping, etc.
  provider_name VARCHAR(200) NOT NULL, -- mailchimp, hubspot, quickbooks, etc.
  is_active BOOLEAN DEFAULT false,
  credentials JSONB, -- API keys, API keys, tokens, וכו'
  settings JSONB, -- הגדרות מותאמות
  last_sync_at TIMESTAMP WITHOUT TIME ZONE,
  sync_status VARCHAR(50), -- success, failed, pending
  error_message TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_integrations_store_id ON integrations(store_id);
CREATE INDEX idx_integrations_type ON integrations(integration_type);
CREATE INDEX idx_integrations_active ON integrations(is_active);

-- ============================================
-- 25. EMAIL TEMPLATES (טמפלייטי מיילים)
-- ============================================

-- Email Templates - מאפשר לכל חנות לערוך את טמפלייטי המיילים
CREATE TABLE email_templates (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  template_type VARCHAR(50) NOT NULL, -- ORDER_CONFIRMATION, WELCOME, ORDER_SHIPPED, ORDER_CANCELLED
  subject TEXT NOT NULL, -- נושא המייל (עם משתנים {{variable}})
  body_html TEXT NOT NULL, -- תוכן המייל ב-HTML (עם משתנים {{variable}})
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(store_id, template_type)
);

CREATE INDEX idx_email_templates_store_id ON email_templates(store_id);
CREATE INDEX idx_email_templates_type ON email_templates(template_type);
CREATE INDEX idx_email_templates_active ON email_templates(is_active, store_id);

-- ============================================
-- 26. TRAFFIC SOURCES (מקורות תנועה)
-- ============================================

-- Traffic Sources
CREATE TABLE traffic_sources (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  customer_id INT REFERENCES customers(id),
  source_type VARCHAR(50), -- organic, paid, direct, referral, social, email
  source_name VARCHAR(200), -- google, facebook, email_campaign, etc.
  medium VARCHAR(100), -- cpc, organic, email, etc.
  campaign VARCHAR(200),
  term VARCHAR(200), -- מילות מפתח
  referrer_url TEXT,
  landing_page TEXT,
  first_visit_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  last_visit_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  visit_count INT DEFAULT 1,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_traffic_sources_store_id ON traffic_sources(store_id);
CREATE INDEX idx_traffic_sources_session_id ON traffic_sources(session_id);
CREATE INDEX idx_traffic_sources_customer_id ON traffic_sources(customer_id);
CREATE INDEX idx_traffic_sources_source_type ON traffic_sources(source_type);

-- ============================================
-- 26. NOTIFICATIONS (התראות)
-- ============================================

-- Notifications
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  user_id INT REFERENCES admin_users(id),
  notification_type VARCHAR(100) NOT NULL, -- order.new, inventory.low, customer.message, etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITHOUT TIME ZONE,
  metadata JSONB, -- נתונים נוספים
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_notifications_store_id ON notifications(store_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(notification_type);

-- ============================================
-- 27. CUSTOM ORDER STATUSES (סטטוסי הזמנות מותאמים)
-- ============================================

-- Custom Order Statuses
CREATE TABLE custom_order_statuses (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  status_type VARCHAR(50) NOT NULL, -- financial, fulfillment, custom
  color VARCHAR(50), -- צבע לתצוגה
  is_default BOOLEAN DEFAULT false,
  position INT DEFAULT 0,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(store_id, name)
);

CREATE INDEX idx_custom_order_statuses_store_id ON custom_order_statuses(store_id);
CREATE INDEX idx_custom_order_statuses_type ON custom_order_statuses(status_type);

-- ============================================
-- FILES STORAGE
-- ============================================

-- Files (for media library)
CREATE TABLE files (
  id SERIAL PRIMARY KEY,
  shop_id INT REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(500) NOT NULL,
  path TEXT NOT NULL,
  size BIGINT,
  mime_type VARCHAR(100),
  entity_type VARCHAR(50), -- products, collections, etc.
  entity_id VARCHAR(50),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_files_shop_id ON files(shop_id);
CREATE INDEX idx_files_entity ON files(entity_type, entity_id);
CREATE INDEX idx_files_created_at ON files(created_at);

-- ============================================
-- VISITOR ANALYTICS (Real-time → Historical)
-- ============================================

-- Visitor Sessions (היסטוריית מבקרים מ-Redis)
CREATE TABLE visitor_sessions (
  id BIGSERIAL PRIMARY KEY,
  visitor_id VARCHAR(255) NOT NULL,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  store_slug VARCHAR(100),
  session_started_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  session_ended_at TIMESTAMP WITHOUT TIME ZONE,
  duration_seconds INT DEFAULT 0,
  page_views INT DEFAULT 1,
  -- GeoIP
  ip_address VARCHAR(100),
  country VARCHAR(100),
  country_code VARCHAR(10),
  city VARCHAR(100),
  region VARCHAR(100),
  lat NUMERIC(10, 7),
  lon NUMERIC(10, 7),
  timezone VARCHAR(50),
  -- Device
  device_type VARCHAR(50), -- desktop, mobile, tablet, bot, unknown
  browser VARCHAR(100),
  os VARCHAR(100),
  user_agent TEXT,
  -- Referrer & UTM
  referrer TEXT,
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_term VARCHAR(255),
  utm_content VARCHAR(255),
  -- Pages visited (JSON array)
  pages_visited JSONB,
  -- Behavior
  reached_cart BOOLEAN DEFAULT false,
  reached_checkout BOOLEAN DEFAULT false,
  completed_purchase BOOLEAN DEFAULT false,
  -- Metadata
  metadata JSONB,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_visitor_sessions_store_id ON visitor_sessions(store_id);
CREATE INDEX idx_visitor_sessions_store_slug ON visitor_sessions(store_slug);
CREATE INDEX idx_visitor_sessions_visitor_id ON visitor_sessions(visitor_id);
CREATE INDEX idx_visitor_sessions_session_started ON visitor_sessions(session_started_at DESC);
CREATE INDEX idx_visitor_sessions_country ON visitor_sessions(country_code);
CREATE INDEX idx_visitor_sessions_city ON visitor_sessions(city);
CREATE INDEX idx_visitor_sessions_utm_source ON visitor_sessions(utm_source);
CREATE INDEX idx_visitor_sessions_device_type ON visitor_sessions(device_type);

-- Visitor Page Views (היסטוריית צפיות בעמודים)
CREATE TABLE visitor_page_views (
  id BIGSERIAL PRIMARY KEY,
  visitor_session_id BIGINT REFERENCES visitor_sessions(id) ON DELETE CASCADE,
  visitor_id VARCHAR(255) NOT NULL,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  page_path VARCHAR(500) NOT NULL,
  page_title VARCHAR(500),
  viewed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  referrer TEXT,
  metadata JSONB
);

CREATE INDEX idx_visitor_page_views_session ON visitor_page_views(visitor_session_id);
CREATE INDEX idx_visitor_page_views_store ON visitor_page_views(store_id);
CREATE INDEX idx_visitor_page_views_path ON visitor_page_views(page_path);
CREATE INDEX idx_visitor_page_views_viewed_at ON visitor_page_views(viewed_at DESC);

-- Visitor Carts (עגלות מבקרים - שמירה בשרת)
CREATE TABLE visitor_carts (
  visitor_session_id VARCHAR(255) NOT NULL,
  store_id INT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  PRIMARY KEY (visitor_session_id, store_id)
);

CREATE INDEX idx_visitor_carts_session ON visitor_carts(visitor_session_id);
CREATE INDEX idx_visitor_carts_store ON visitor_carts(store_id);
CREATE INDEX idx_visitor_carts_updated_at ON visitor_carts(updated_at DESC);

-- Function to update analytics_daily from visitor_sessions
CREATE OR REPLACE FUNCTION update_analytics_daily_from_visitors(target_date DATE DEFAULT CURRENT_DATE)
RETURNS void AS $$
BEGIN
  INSERT INTO analytics_daily (store_id, date, visits, unique_visitors, created_at, updated_at)
  SELECT 
    store_id,
    target_date,
    COUNT(*) as visits,
    COUNT(DISTINCT visitor_id) as unique_visitors,
    now(),
    now()
  FROM visitor_sessions
  WHERE DATE(session_started_at) = target_date
  GROUP BY store_id
  ON CONFLICT (store_id, date) 
  DO UPDATE SET
    visits = EXCLUDED.visits,
    unique_visitors = EXCLUDED.unique_visitors,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 23. TRANSLATIONS SYSTEM (מערכת תרגומים)
-- ============================================

-- Translation Keys (מפתחות תרגום - System Translations)
CREATE TABLE translation_keys (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  namespace VARCHAR(100) NOT NULL, -- 'storefront', 'products', 'common'
  key_path VARCHAR(255) NOT NULL, -- 'home.title', 'product.add_to_cart'
  default_value TEXT, -- ערך ברירת מחדל (עברית)
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(store_id, namespace, key_path)
);

CREATE INDEX idx_translation_keys_store ON translation_keys(store_id);
CREATE INDEX idx_translation_keys_namespace ON translation_keys(namespace);
CREATE INDEX idx_translation_keys_key_path ON translation_keys(key_path);

-- Translations (תרגומים - System Translations)
CREATE TABLE translations (
  id SERIAL PRIMARY KEY,
  translation_key_id INT REFERENCES translation_keys(id) ON DELETE CASCADE,
  locale VARCHAR(10) NOT NULL, -- 'he-IL', 'en-US', 'ar-SA'
  value TEXT NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(translation_key_id, locale)
);

CREATE INDEX idx_translations_key ON translations(translation_key_id);
CREATE INDEX idx_translations_locale ON translations(locale);

-- Templates (תבניות - Template/Content Translations)
CREATE TABLE templates (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL, -- 'home-hero', 'home-featured-products'
  type VARCHAR(100) NOT NULL, -- 'hero', 'section', 'banner'
  page_type VARCHAR(100), -- 'home', 'product', 'collection'
  settings JSONB, -- הגדרות התבנית
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(store_id, name)
);

CREATE INDEX idx_templates_store ON templates(store_id);
CREATE INDEX idx_templates_page_type ON templates(page_type);
CREATE INDEX idx_templates_type ON templates(type);

-- Template Translations (תרגומי תבניות - Template/Content Translations)
CREATE TABLE template_translations (
  id SERIAL PRIMARY KEY,
  template_id INT REFERENCES templates(id) ON DELETE CASCADE,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  key VARCHAR(255) NOT NULL, -- 'title', 'subtitle', 'cta_text'
  locale VARCHAR(10) NOT NULL, -- 'he-IL', 'en-US'
  value TEXT NOT NULL, -- התרגום
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(template_id, key, locale)
);

CREATE INDEX idx_template_translations_template ON template_translations(template_id);
CREATE INDEX idx_template_translations_store ON template_translations(store_id);
CREATE INDEX idx_template_translations_locale ON template_translations(locale);

-- ============================================
-- END OF SCHEMA
-- ============================================

