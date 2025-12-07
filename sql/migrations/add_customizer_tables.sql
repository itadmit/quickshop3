-- ============================================
-- Customizer Module - Database Schema
-- Quickshop3 Theme Customizer Tables
-- ============================================

-- תבניות (Templates)
CREATE TABLE IF NOT EXISTS theme_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,           -- 'new-york'
  display_name VARCHAR(255) NOT NULL,   -- 'ניו יורק'
  description TEXT,
  thumbnail_url TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,     -- תבניות בתשלום בעתיד
  price DECIMAL(10,2) DEFAULT 0,
  version VARCHAR(20) DEFAULT '1.0.0',
  -- Section Schema - מגדיר אילו סקשנים התבנית תומכת
  available_sections JSONB DEFAULT '[]',
  -- Default Settings Schema
  default_settings_schema JSONB DEFAULT '{}',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_theme_templates_name ON theme_templates(name);
CREATE INDEX idx_theme_templates_is_default ON theme_templates(is_default);

-- הגדרות חנות (Theme Settings) - הגדרות גלובליות
CREATE TABLE IF NOT EXISTS store_theme_settings (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  template_id INT REFERENCES theme_templates(id),
  
  -- Published vs Draft
  published_settings_json JSONB DEFAULT '{}',
  draft_settings_json JSONB DEFAULT '{}',
  
  -- Custom Code (למתכנתים)
  custom_css TEXT DEFAULT '',
  custom_js TEXT DEFAULT '',
  custom_head_code TEXT DEFAULT '',  -- קוד להזרקה ל-head
  
  -- Cache
  published_at TIMESTAMP WITHOUT TIME ZONE,
  edge_json_url TEXT,  -- URL לקובץ JSON ב-Edge
  
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(store_id)
);

CREATE INDEX idx_store_theme_settings_store ON store_theme_settings(store_id);
CREATE INDEX idx_store_theme_settings_template ON store_theme_settings(template_id);

-- מבנה עמודים (Page Layouts)
CREATE TABLE IF NOT EXISTS page_layouts (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  template_id INT REFERENCES theme_templates(id),
  page_type VARCHAR(50) NOT NULL,       -- 'home', 'product', 'collection', etc.
  page_handle VARCHAR(255),             -- לעמוד ספציפי (אופציונלי)
  
  -- Published vs Draft  
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITHOUT TIME ZONE,
  edge_json_url TEXT,
  
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(store_id, page_type, page_handle)
);

CREATE INDEX idx_page_layouts_store ON page_layouts(store_id);
CREATE INDEX idx_page_layouts_published ON page_layouts(store_id, is_published);
CREATE INDEX idx_page_layouts_type ON page_layouts(page_type);

-- סקשנים בעמוד (Page Sections)
CREATE TABLE IF NOT EXISTS page_sections (
  id SERIAL PRIMARY KEY,
  page_layout_id INT REFERENCES page_layouts(id) ON DELETE CASCADE,
  section_type VARCHAR(100) NOT NULL,
  section_id VARCHAR(100) NOT NULL,     -- unique ID for referencing in code
  position INT NOT NULL,
  is_visible BOOLEAN DEFAULT TRUE,
  is_locked BOOLEAN DEFAULT FALSE,      -- locked sections can't be moved/deleted
  
  -- Settings
  settings_json JSONB NOT NULL DEFAULT '{}',
  
  -- Custom overrides (למתכנתים)
  custom_css TEXT DEFAULT '',
  custom_classes TEXT DEFAULT '',
  
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_page_sections_layout ON page_sections(page_layout_id);
CREATE INDEX idx_page_sections_position ON page_sections(page_layout_id, position);
CREATE INDEX idx_page_sections_settings_gin ON page_sections USING GIN (settings_json);

-- בלוקים בתוך סקשנים (Section Blocks)
CREATE TABLE IF NOT EXISTS section_blocks (
  id SERIAL PRIMARY KEY,
  section_id INT REFERENCES page_sections(id) ON DELETE CASCADE,
  block_type VARCHAR(100) NOT NULL,
  block_id VARCHAR(100) NOT NULL,       -- unique ID
  position INT NOT NULL,
  is_visible BOOLEAN DEFAULT TRUE,
  settings_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_section_blocks_section ON section_blocks(section_id);
CREATE INDEX idx_section_blocks_position ON section_blocks(section_id, position);
CREATE INDEX idx_section_blocks_settings_gin ON section_blocks USING GIN (settings_json);

-- סקשנים מותאמים (Custom Sections - למתכנתים)
CREATE TABLE IF NOT EXISTS custom_sections (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Schema for settings
  settings_schema JSONB NOT NULL DEFAULT '[]',
  blocks_schema JSONB DEFAULT '[]',
  
  -- Render template
  template_code TEXT NOT NULL,          -- JSX/TSX template
  css_code TEXT DEFAULT '',
  
  -- Preview
  preview_data JSONB DEFAULT '{}',
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(store_id, name)
);

CREATE INDEX idx_custom_sections_store ON custom_sections(store_id, is_active);

-- Page Templates (עמודי לופ - product, collection)
CREATE TABLE IF NOT EXISTS page_templates (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  template_type VARCHAR(50) NOT NULL,  -- 'product', 'collection', 'blog_post', 'page'
  name VARCHAR(100),                    -- 'default', 'minimal', 'full-width'
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Published vs Draft
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITHOUT TIME ZONE,
  
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(store_id, template_type, name)
);

CREATE INDEX idx_page_templates_store ON page_templates(store_id, template_type);
CREATE INDEX idx_page_templates_published ON page_templates(store_id, is_published);

-- Template Widgets (וידג'טים ב-template)
CREATE TABLE IF NOT EXISTS template_widgets (
  id SERIAL PRIMARY KEY,
  template_id INT REFERENCES page_templates(id) ON DELETE CASCADE,
  widget_type VARCHAR(100) NOT NULL,   -- 'product_images', 'product_title', 'rich_text', etc.
  widget_id VARCHAR(100) NOT NULL,     -- unique identifier
  position INT NOT NULL,
  is_visible BOOLEAN DEFAULT TRUE,
  is_dynamic BOOLEAN DEFAULT TRUE,     -- true = pulls from object, false = static
  
  -- Settings
  settings_json JSONB NOT NULL DEFAULT '{}',
  
  -- Custom styling
  custom_css TEXT DEFAULT '',
  custom_classes TEXT DEFAULT '',
  
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_template_widgets_template ON template_widgets(template_id);
CREATE INDEX idx_template_widgets_position ON template_widgets(template_id, position);

-- Override per specific product/collection (אופציונלי)
CREATE TABLE IF NOT EXISTS template_overrides (
  id SERIAL PRIMARY KEY,
  template_id INT REFERENCES page_templates(id) ON DELETE CASCADE,
  object_type VARCHAR(50) NOT NULL,    -- 'product', 'collection'
  object_id INT NOT NULL,              -- product_id or collection_id
  
  -- Override specific widgets
  widget_overrides JSONB DEFAULT '{}', -- { "widget_id": { "settings": {...} } }
  
  -- Or completely different structure
  custom_widgets JSONB DEFAULT NULL,
  
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(template_id, object_type, object_id)
);

CREATE INDEX idx_template_overrides_template ON template_overrides(template_id);
CREATE INDEX idx_template_overrides_object ON template_overrides(object_type, object_id);

-- היסטוריית גרסאות (Version History)
CREATE TABLE IF NOT EXISTS page_layout_versions (
  id SERIAL PRIMARY KEY,
  page_layout_id INT REFERENCES page_layouts(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  snapshot_json JSONB NOT NULL,         -- צילום מצב של כל הסקשנים
  created_by INT REFERENCES admin_users(id),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  notes TEXT,
  
  -- Restore capability
  is_restorable BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_page_layout_versions_layout ON page_layout_versions(page_layout_id);
CREATE INDEX idx_page_layout_versions_version ON page_layout_versions(page_layout_id, version_number DESC);

-- Seed data - תבנית New York (ברירת מחדל)
INSERT INTO theme_templates (name, display_name, description, is_default, available_sections, default_settings_schema)
VALUES (
  'new-york',
  'ניו יורק',
  'תבנית מודרנית ומינימליסטית בהשראת עיצוב נקי',
  true,
  '[
    "announcement_bar",
    "header",
    "slideshow",
    "hero_banner",
    "collection_list",
    "featured_collection",
    "featured_product",
    "product_grid",
    "new_arrivals",
    "best_sellers",
    "image_with_text",
    "image_with_text_overlay",
    "rich_text",
    "video",
    "testimonials",
    "faq",
    "newsletter",
    "trust_badges",
    "footer",
    "mobile_sticky_bar",
    "custom_html",
    "custom_liquid",
    "custom_section"
  ]'::jsonb,
  '{
    "colors": {
      "primary": "#000000",
      "secondary": "#666666",
      "accent": "#10B981",
      "background": "#FFFFFF",
      "surface": "#F9FAFB",
      "text": "#000000",
      "muted": "#6B7280",
      "border": "#E5E7EB",
      "error": "#EF4444",
      "success": "#10B981"
    },
    "typography": {
      "headingFont": "Heebo",
      "bodyFont": "Heebo",
      "baseFontSize": 16,
      "lineHeight": 1.6,
      "headingWeight": 700,
      "bodyWeight": 400
    },
    "layout": {
      "containerMaxWidth": 1200,
      "containerPadding": 24,
      "sectionSpacing": 64,
      "gridGap": 24
    },
    "buttons": {
      "borderRadius": 4,
      "padding": "12px 24px",
      "primaryStyle": "solid",
      "secondaryStyle": "outline"
    },
    "cards": {
      "borderRadius": 8,
      "shadow": "sm",
      "hoverEffect": "lift"
    },
    "animations": {
      "enabled": true,
      "duration": 300,
      "easing": "ease-out"
    }
  }'::jsonb
)
ON CONFLICT DO NOTHING;

