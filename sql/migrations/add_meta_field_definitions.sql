-- ============================================
-- Add Meta Field Definitions Table
-- Allows creating meta field templates in dashboard
-- ============================================

-- Meta Field Definitions (templates for meta fields)
CREATE TABLE meta_field_definitions (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  namespace VARCHAR(150) NOT NULL DEFAULT 'custom',
  key VARCHAR(150) NOT NULL,
  label VARCHAR(255) NOT NULL,
  description TEXT,
  value_type VARCHAR(50) DEFAULT 'string', -- string, integer, json, date, color, checkbox, number, url, file
  required BOOLEAN DEFAULT false,
  validations JSONB DEFAULT '{}',
  scope VARCHAR(50) DEFAULT 'GLOBAL', -- GLOBAL, CATEGORY
  category_ids INT[] DEFAULT '{}', -- Array of category IDs if scope is CATEGORY
  show_in_storefront BOOLEAN DEFAULT false,
  position INT DEFAULT 0,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(store_id, namespace, key)
);

CREATE INDEX idx_meta_field_definitions_store_id ON meta_field_definitions(store_id);
CREATE INDEX idx_meta_field_definitions_namespace_key ON meta_field_definitions(namespace, key);
CREATE INDEX idx_meta_field_definitions_scope ON meta_field_definitions(scope);
CREATE INDEX idx_meta_field_definitions_position ON meta_field_definitions(store_id, position);

-- Add comment
COMMENT ON TABLE meta_field_definitions IS 'Definitions/templates for meta fields that can be used across products';
COMMENT ON COLUMN meta_field_definitions.scope IS 'GLOBAL = available for all products, CATEGORY = only for products in specific categories';
COMMENT ON COLUMN meta_field_definitions.category_ids IS 'Array of category IDs when scope is CATEGORY';

