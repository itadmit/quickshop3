-- Migration: Add visitor_carts table for server-side cart storage
-- Date: 2025-01-XX
-- Run: psql $DATABASE_URL -f sql/migrations/add_visitor_carts_table.sql

-- Visitor Carts (עגלות מבקרים - שמירה בשרת)
CREATE TABLE IF NOT EXISTS visitor_carts (
  visitor_session_id VARCHAR(255) NOT NULL,
  store_id INT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  PRIMARY KEY (visitor_session_id, store_id)
);

CREATE INDEX IF NOT EXISTS idx_visitor_carts_session ON visitor_carts(visitor_session_id);
CREATE INDEX IF NOT EXISTS idx_visitor_carts_store ON visitor_carts(store_id);
CREATE INDEX IF NOT EXISTS idx_visitor_carts_updated_at ON visitor_carts(updated_at DESC);

