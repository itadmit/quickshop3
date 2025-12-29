-- ============================================
-- Staff Users & Invitations System
-- Similar to Shopify's staff management
-- ============================================

-- Staff Users Table
-- Stores staff members who can access multiple stores
CREATE TABLE IF NOT EXISTS staff_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  password_hash TEXT, -- Will be NULL until invitation is accepted
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_staff_users_email ON staff_users(email);
CREATE INDEX idx_staff_users_is_active ON staff_users(is_active);

-- Staff Store Access Table
-- Links staff users to stores with specific permissions
CREATE TABLE IF NOT EXISTS staff_store_access (
  id SERIAL PRIMARY KEY,
  staff_user_id INT REFERENCES staff_users(id) ON DELETE CASCADE,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'staff', -- owner, admin, staff, limited_staff
  permissions JSONB DEFAULT '{}', -- Custom permissions: { "products": true, "orders": true, "customers": false, etc. }
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(staff_user_id, store_id)
);

CREATE INDEX idx_staff_store_access_staff_user_id ON staff_store_access(staff_user_id);
CREATE INDEX idx_staff_store_access_store_id ON staff_store_access(store_id);
CREATE INDEX idx_staff_store_access_is_active ON staff_store_access(is_active);

-- Staff Invitations Table
-- Manages pending invitations to staff members
CREATE TABLE IF NOT EXISTS staff_invitations (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  invited_by INT REFERENCES store_owners(id) ON DELETE SET NULL,
  role VARCHAR(50) DEFAULT 'staff',
  permissions JSONB DEFAULT '{}',
  token VARCHAR(255) UNIQUE NOT NULL, -- Unique token for invitation link
  status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, expired, cancelled
  expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_staff_invitations_email ON staff_invitations(email);
CREATE INDEX idx_staff_invitations_store_id ON staff_invitations(store_id);
CREATE INDEX idx_staff_invitations_token ON staff_invitations(token);
CREATE INDEX idx_staff_invitations_status ON staff_invitations(status);
CREATE INDEX idx_staff_invitations_expires_at ON staff_invitations(expires_at);

-- Staff Sessions Table
-- Tracks active sessions for staff users
CREATE TABLE IF NOT EXISTS staff_sessions (
  id SERIAL PRIMARY KEY,
  staff_user_id INT NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
  store_id INT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  ip_address VARCHAR(100),
  user_agent TEXT,
  last_activity TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE INDEX idx_staff_sessions_staff_user_id ON staff_sessions(staff_user_id);
CREATE INDEX idx_staff_sessions_store_id ON staff_sessions(store_id);
CREATE INDEX idx_staff_sessions_last_activity ON staff_sessions(last_activity DESC);
CREATE INDEX idx_staff_sessions_expires_at ON staff_sessions(expires_at);
CREATE INDEX idx_staff_sessions_session_token ON staff_sessions(session_token);

-- Comments on tables
COMMENT ON TABLE staff_users IS 'Staff members who can access the dashboard';
COMMENT ON TABLE staff_store_access IS 'Links staff users to stores with specific permissions';
COMMENT ON TABLE staff_invitations IS 'Pending invitations to join stores as staff members';
COMMENT ON TABLE staff_sessions IS 'Active sessions for staff users';

-- Comments on columns
COMMENT ON COLUMN staff_users.password_hash IS 'NULL until invitation is accepted and password is set';
COMMENT ON COLUMN staff_store_access.role IS 'owner: full access, admin: most access, staff: limited access, limited_staff: custom permissions';
COMMENT ON COLUMN staff_store_access.permissions IS 'JSONB object with specific permission flags';
COMMENT ON COLUMN staff_invitations.token IS 'Unique token for invitation URL';
COMMENT ON COLUMN staff_invitations.status IS 'pending, accepted, expired, cancelled';

