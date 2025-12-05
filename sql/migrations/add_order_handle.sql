-- ============================================
-- Add order_handle column to orders table
-- מאפשר שימוש ב-handle מוצפן במקום ID גלוי
-- ============================================

-- הוספת עמודת handle
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_handle VARCHAR(255) UNIQUE;

-- יצירת אינדקס לחיפוש מהיר
CREATE INDEX IF NOT EXISTS idx_orders_handle ON orders(order_handle);

-- יצירת handle לכל הזמנה קיימת (אם יש)
-- נשתמש ב-format: store_id + order_id + random string
UPDATE orders 
SET order_handle = encode(gen_random_bytes(16), 'hex')
WHERE order_handle IS NULL;

-- הערה: בעתיד כל הזמנה חדשה תקבל handle אוטומטית בקוד

