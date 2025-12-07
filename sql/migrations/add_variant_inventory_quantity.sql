-- Migration: Add inventory_quantity to product_variants table
-- תיאור: הוספת עמודת inventory_quantity לטבלת product_variants כדי לאחסן מלאי ישירות על ה-variant

-- הוספת עמודת inventory_quantity
ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS inventory_quantity INT DEFAULT 0;

-- יצירת אינדקס על inventory_quantity לביצועים טובים יותר
CREATE INDEX IF NOT EXISTS idx_variants_inventory_qty ON product_variants(inventory_quantity);

-- עדכון ערכי מלאי קיימים מ-variant_inventory (אם יש)
UPDATE product_variants pv
SET inventory_quantity = COALESCE(
  (SELECT available FROM variant_inventory WHERE variant_id = pv.id LIMIT 1),
  0
)
WHERE inventory_quantity IS NULL OR inventory_quantity = 0;

-- הוספת הערה
COMMENT ON COLUMN product_variants.inventory_quantity IS 'Inventory quantity for this variant. Synced with variant_inventory table.';

