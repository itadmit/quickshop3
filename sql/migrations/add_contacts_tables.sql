-- ============================================
-- CONTACTS MODULE (אנשי קשר)
-- ============================================

-- Contact Categories (קטגוריות אנשי קשר)
CREATE TABLE IF NOT EXISTS contact_categories (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- CUSTOMER, CLUB_MEMBER, NEWSLETTER, CONTACT_FORM
  name VARCHAR(200) NOT NULL,
  color VARCHAR(50), -- צבע לתצוגה
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(store_id, type)
);

CREATE INDEX IF NOT EXISTS idx_contact_categories_store_id ON contact_categories(store_id);
CREATE INDEX IF NOT EXISTS idx_contact_categories_type ON contact_categories(type);

-- Contacts (אנשי קשר)
CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  customer_id INT REFERENCES customers(id) ON DELETE SET NULL, -- קישור ללקוח אם קיים
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),
  company VARCHAR(200),
  notes TEXT,
  tags TEXT[], -- Array of tags
  email_marketing_consent BOOLEAN DEFAULT false,
  email_marketing_consent_at TIMESTAMP WITHOUT TIME ZONE,
  source VARCHAR(100), -- contact_form, manual, import, etc.
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contacts_store_id ON contacts(store_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_customer_id ON contacts(customer_id);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);

-- Contact Category Assignments (הקצאות קטגוריות)
CREATE TABLE IF NOT EXISTS contact_category_assignments (
  id SERIAL PRIMARY KEY,
  contact_id INT REFERENCES contacts(id) ON DELETE CASCADE,
  category_id INT REFERENCES contact_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(contact_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_contact_category_assignments_contact_id ON contact_category_assignments(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_category_assignments_category_id ON contact_category_assignments(category_id);

-- Initialize default categories for existing stores
INSERT INTO contact_categories (store_id, type, name, color)
SELECT 
  id as store_id,
  'CUSTOMER' as type,
  'לקוחות' as name,
  '#10b981' as color
FROM stores
WHERE NOT EXISTS (
  SELECT 1 FROM contact_categories 
  WHERE contact_categories.store_id = stores.id 
  AND contact_categories.type = 'CUSTOMER'
)
ON CONFLICT (store_id, type) DO NOTHING;

INSERT INTO contact_categories (store_id, type, name, color)
SELECT 
  id as store_id,
  'CLUB_MEMBER' as type,
  'חברי מועדון' as name,
  '#3b82f6' as color
FROM stores
WHERE NOT EXISTS (
  SELECT 1 FROM contact_categories 
  WHERE contact_categories.store_id = stores.id 
  AND contact_categories.type = 'CLUB_MEMBER'
)
ON CONFLICT (store_id, type) DO NOTHING;

INSERT INTO contact_categories (store_id, type, name, color)
SELECT 
  id as store_id,
  'NEWSLETTER' as type,
  'דיוור' as name,
  '#f97316' as color
FROM stores
WHERE NOT EXISTS (
  SELECT 1 FROM contact_categories 
  WHERE contact_categories.store_id = stores.id 
  AND contact_categories.type = 'NEWSLETTER'
)
ON CONFLICT (store_id, type) DO NOTHING;

INSERT INTO contact_categories (store_id, type, name, color)
SELECT 
  id as store_id,
  'CONTACT_FORM' as type,
  'יצירת קשר' as name,
  '#a855f7' as color
FROM stores
WHERE NOT EXISTS (
  SELECT 1 FROM contact_categories 
  WHERE contact_categories.store_id = stores.id 
  AND contact_categories.type = 'CONTACT_FORM'
)
ON CONFLICT (store_id, type) DO NOTHING;

