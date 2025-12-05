-- ============================================
-- Email Templates Table
-- מאפשר לכל חנות לערוך את טמפלייטי המיילים
-- ============================================

CREATE TABLE email_templates (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  template_type VARCHAR(50) NOT NULL, -- ORDER_CONFIRMATION, WELCOME, ORDER_SHIPPED, ORDER_CANCELLED
  subject TEXT NOT NULL, -- נושא המייל (עם משתנים {{variable}})
  body_html TEXT NOT NULL, -- תוכן המייל ב-HTML (עם משתנים {{variable}})
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(store_id, template_type)
);

CREATE INDEX idx_email_templates_store_id ON email_templates(store_id);
CREATE INDEX idx_email_templates_type ON email_templates(template_type);
CREATE INDEX idx_email_templates_active ON email_templates(is_active, store_id);

-- הערה: אם אין טמפלייט מותאם אישית, המערכת תשתמש בטמפלייט ברירת המחדל

