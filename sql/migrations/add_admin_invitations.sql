-- Migration: Add Admin User Invitations
-- Run this to add the invitations table

-- Admin User Invitations (הזמנות לעובדים)
CREATE TABLE IF NOT EXISTS admin_user_invitations (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'staff', -- admin, staff, limited_staff
  token VARCHAR(255) UNIQUE NOT NULL,
  invited_by INT REFERENCES store_owners(id),
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, expired, cancelled
  expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(store_id, email)
);

CREATE INDEX IF NOT EXISTS idx_admin_user_invitations_token ON admin_user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_admin_user_invitations_store_id ON admin_user_invitations(store_id);
CREATE INDEX IF NOT EXISTS idx_admin_user_invitations_email ON admin_user_invitations(email);

-- Add store_owner_id to admin_users if not exists (for linking admin users to store_owners)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_users' AND column_name = 'store_owner_id') THEN
    ALTER TABLE admin_users ADD COLUMN store_owner_id INT REFERENCES store_owners(id);
  END IF;
END $$;

