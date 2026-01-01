-- ============================================
-- STORIES PLUGIN - Product Stories System
-- ============================================

-- Story Settings per Store
CREATE TABLE story_settings (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT false,
  display_mode VARCHAR(20) DEFAULT 'home_only' CHECK (display_mode IN ('home_only', 'category', 'everywhere')),
  auto_advance_seconds INT DEFAULT 5,
  show_product_info BOOLEAN DEFAULT true,
  allow_likes BOOLEAN DEFAULT true,
  allow_comments BOOLEAN DEFAULT true,
  allow_quick_add BOOLEAN DEFAULT true,
  circle_border_color VARCHAR(20) DEFAULT '#e91e63',
  viewed_border_color VARCHAR(20) DEFAULT '#9e9e9e',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(store_id)
);

CREATE INDEX idx_story_settings_store ON story_settings(store_id);

-- Stories (linked to products)
CREATE TABLE product_stories (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  position INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  views_count INT DEFAULT 0,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(store_id, product_id)
);

CREATE INDEX idx_product_stories_store ON product_stories(store_id);
CREATE INDEX idx_product_stories_product ON product_stories(product_id);
CREATE INDEX idx_product_stories_active ON product_stories(store_id, is_active, position);

-- Story Likes
CREATE TABLE story_likes (
  id SERIAL PRIMARY KEY,
  story_id INT REFERENCES product_stories(id) ON DELETE CASCADE,
  customer_id INT REFERENCES customers(id) ON DELETE SET NULL,
  session_id VARCHAR(100), -- for anonymous likes
  ip_address VARCHAR(50),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(story_id, customer_id),
  UNIQUE(story_id, session_id)
);

CREATE INDEX idx_story_likes_story ON story_likes(story_id);
CREATE INDEX idx_story_likes_customer ON story_likes(customer_id);

-- Story Comments
CREATE TABLE story_comments (
  id SERIAL PRIMARY KEY,
  story_id INT REFERENCES product_stories(id) ON DELETE CASCADE,
  customer_id INT REFERENCES customers(id) ON DELETE SET NULL,
  author_name VARCHAR(100), -- for anonymous comments
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false, -- require approval
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_story_comments_story ON story_comments(story_id);
CREATE INDEX idx_story_comments_approved ON story_comments(story_id, is_approved, is_visible);

-- Story Views (per session/user)
CREATE TABLE story_views (
  id SERIAL PRIMARY KEY,
  story_id INT REFERENCES product_stories(id) ON DELETE CASCADE,
  customer_id INT REFERENCES customers(id) ON DELETE SET NULL,
  session_id VARCHAR(100),
  viewed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  UNIQUE(story_id, customer_id),
  UNIQUE(story_id, session_id)
);

CREATE INDEX idx_story_views_story ON story_views(story_id);
CREATE INDEX idx_story_views_session ON story_views(session_id);

-- Trigger to update counts
CREATE OR REPLACE FUNCTION update_story_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE product_stories SET likes_count = likes_count + 1, updated_at = now() WHERE id = NEW.story_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE product_stories SET likes_count = likes_count - 1, updated_at = now() WHERE id = OLD.story_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_story_likes_count
AFTER INSERT OR DELETE ON story_likes
FOR EACH ROW EXECUTE FUNCTION update_story_likes_count();

CREATE OR REPLACE FUNCTION update_story_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE product_stories SET comments_count = comments_count + 1, updated_at = now() WHERE id = NEW.story_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE product_stories SET comments_count = comments_count - 1, updated_at = now() WHERE id = OLD.story_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_story_comments_count
AFTER INSERT OR DELETE ON story_comments
FOR EACH ROW EXECUTE FUNCTION update_story_comments_count();

CREATE OR REPLACE FUNCTION update_story_views_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE product_stories SET views_count = views_count + 1, updated_at = now() WHERE id = NEW.story_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_story_views_count
AFTER INSERT ON story_views
FOR EACH ROW EXECUTE FUNCTION update_story_views_count();

