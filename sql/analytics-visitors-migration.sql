-- ============================================
-- Visitor Sessions History Table
-- טבלה לשמירת היסטוריית מבקרים מ-Redis ל-PostgreSQL
-- ============================================

-- Visitor Sessions (היסטוריית מבקרים)
CREATE TABLE IF NOT EXISTS visitor_sessions (
  id BIGSERIAL PRIMARY KEY,
  visitor_id VARCHAR(255) NOT NULL,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  store_slug VARCHAR(100),
  session_started_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  session_ended_at TIMESTAMP WITHOUT TIME ZONE,
  duration_seconds INT DEFAULT 0,
  page_views INT DEFAULT 1,
  -- GeoIP
  ip_address VARCHAR(100),
  country VARCHAR(100),
  country_code VARCHAR(10),
  city VARCHAR(100),
  region VARCHAR(100),
  lat NUMERIC(10, 7),
  lon NUMERIC(10, 7),
  timezone VARCHAR(50),
  -- Device
  device_type VARCHAR(50), -- desktop, mobile, tablet, bot, unknown
  browser VARCHAR(100),
  os VARCHAR(100),
  user_agent TEXT,
  -- Referrer & UTM
  referrer TEXT,
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_term VARCHAR(255),
  utm_content VARCHAR(255),
  -- Pages visited (JSON array)
  pages_visited JSONB,
  -- Behavior
  reached_cart BOOLEAN DEFAULT false,
  reached_checkout BOOLEAN DEFAULT false,
  completed_purchase BOOLEAN DEFAULT false,
  -- Metadata
  metadata JSONB,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_visitor_sessions_store_id ON visitor_sessions(store_id);
CREATE INDEX idx_visitor_sessions_store_slug ON visitor_sessions(store_slug);
CREATE INDEX idx_visitor_sessions_session_started ON visitor_sessions(session_started_at DESC);
CREATE INDEX idx_visitor_sessions_country ON visitor_sessions(country_code);
CREATE INDEX idx_visitor_sessions_city ON visitor_sessions(city);
CREATE INDEX idx_visitor_sessions_utm_source ON visitor_sessions(utm_source);
CREATE INDEX idx_visitor_sessions_device_type ON visitor_sessions(device_type);

-- Visitor Page Views (היסטוריית צפיות בעמודים)
CREATE TABLE IF NOT EXISTS visitor_page_views (
  id BIGSERIAL PRIMARY KEY,
  visitor_session_id BIGINT REFERENCES visitor_sessions(id) ON DELETE CASCADE,
  visitor_id VARCHAR(255) NOT NULL,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  page_path VARCHAR(500) NOT NULL,
  page_title VARCHAR(500),
  viewed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  referrer TEXT,
  metadata JSONB
);

CREATE INDEX idx_visitor_page_views_session ON visitor_page_views(visitor_session_id);
CREATE INDEX idx_visitor_page_views_store ON visitor_page_views(store_id);
CREATE INDEX idx_visitor_page_views_path ON visitor_page_views(page_path);
CREATE INDEX idx_visitor_page_views_viewed_at ON visitor_page_views(viewed_at DESC);

-- Function to update analytics_daily from visitor_sessions
CREATE OR REPLACE FUNCTION update_analytics_daily_from_visitors(target_date DATE DEFAULT CURRENT_DATE)
RETURNS void AS $$
BEGIN
  INSERT INTO analytics_daily (store_id, date, visits, unique_visitors, created_at, updated_at)
  SELECT 
    store_id,
    target_date,
    COUNT(*) as visits,
    COUNT(DISTINCT visitor_id) as unique_visitors,
    now(),
    now()
  FROM visitor_sessions
  WHERE DATE(session_started_at) = target_date
  GROUP BY store_id
  ON CONFLICT (store_id, date) 
  DO UPDATE SET
    visits = EXCLUDED.visits,
    unique_visitors = EXCLUDED.unique_visitors,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

