-- Add type and metadata columns to existing database
-- Run this if you already have a database and want to add the columns without resetting

-- Add type column to product_options (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_options' AND column_name = 'type'
  ) THEN
    ALTER TABLE product_options 
    ADD COLUMN type VARCHAR(50) DEFAULT 'button' CHECK (type IN ('button', 'color', 'pattern', 'image'));
    
    CREATE INDEX idx_product_options_type ON product_options(type);
    
    UPDATE product_options SET type = 'button' WHERE type IS NULL;
  END IF;
END $$;

-- Add metadata column to product_option_values (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_option_values' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE product_option_values 
    ADD COLUMN metadata JSONB DEFAULT NULL;
  END IF;
END $$;

