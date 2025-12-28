-- ✅ Script to allow order_id NULL in returns table for manual returns
-- Run this command:
-- ALTER TABLE returns ALTER COLUMN order_id DROP NOT NULL;

-- Or run via psql:
-- psql "postgresql://neondb_owner:npg_3R1IYCdrLKqE@ep-red-mountain-aghu585l-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require" -c "ALTER TABLE returns ALTER COLUMN order_id DROP NOT NULL;"

ALTER TABLE returns ALTER COLUMN order_id DROP NOT NULL;

