-- Migration: Add type and metadata columns to product_options and product_option_values
-- Date: 2025-01-XX
-- Run: psql $DATABASE_URL -f sql/migrations/add_product_options_type_metadata.sql

-- Add type column to product_options
ALTER TABLE product_options 
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'button' CHECK (type IN ('button', 'color', 'pattern', 'image'));

-- Add metadata column to product_option_values (JSONB for flexibility)
ALTER TABLE product_option_values 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

-- Create index for type column
CREATE INDEX IF NOT EXISTS idx_product_options_type ON product_options(type);

-- Update existing records to have default type
UPDATE product_options SET type = 'button' WHERE type IS NULL;

