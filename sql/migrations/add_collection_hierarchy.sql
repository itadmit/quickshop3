-- Add parent_id, type, rules, and is_published to product_collections
-- to support hierarchical categories, automatic/manual collections, and rules

-- Add parent_id for hierarchical organization
ALTER TABLE product_collections
ADD COLUMN IF NOT EXISTS parent_id INT REFERENCES product_collections(id) ON DELETE CASCADE;

-- Add type (MANUAL/AUTOMATIC)
ALTER TABLE product_collections
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'MANUAL' CHECK (type IN ('MANUAL', 'AUTOMATIC'));

-- Add rules for automatic collections (JSONB)
ALTER TABLE product_collections
ADD COLUMN IF NOT EXISTS rules JSONB DEFAULT NULL;

-- Add is_published flag
ALTER TABLE product_collections
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_collections_parent_id ON product_collections(parent_id);
CREATE INDEX IF NOT EXISTS idx_collections_type ON product_collections(type);
CREATE INDEX IF NOT EXISTS idx_collections_is_published ON product_collections(is_published);

-- Add comments
COMMENT ON COLUMN product_collections.parent_id IS 'Parent collection ID for hierarchical organization';
COMMENT ON COLUMN product_collections.type IS 'Collection type: MANUAL (manual product selection) or AUTOMATIC (rule-based)';
COMMENT ON COLUMN product_collections.rules IS 'JSON rules for automatic collections';
COMMENT ON COLUMN product_collections.is_published IS 'Whether the collection is published';

