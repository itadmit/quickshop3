// Content Types based on schema.sql

export interface Page {
  id: number;
  store_id: number;
  title: string;
  handle: string;
  body_html: string | null;
  author_id: number | null;
  published_at: Date | null;
  template_suffix: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface NavigationMenu {
  id: number;
  store_id: number;
  name: string;
  handle: string;
  position: string | null; // header, footer, sidebar
  created_at: Date;
  updated_at: Date;
}

export interface NavigationMenuItem {
  id: number;
  menu_id: number;
  title: string;
  type: 'link' | 'page' | 'collection' | 'product';
  url: string | null;
  page_id: number | null;
  collection_id: number | null;
  product_id: number | null;
  parent_id: number | null;
  position: number;
  created_at: Date;
}

export interface BlogPost {
  id: number;
  store_id: number;
  blog_id: number | null;
  title: string;
  handle: string;
  body_html: string | null;
  excerpt: string | null;
  author_id: number | null;
  published_at: Date | null;
  tags: string[] | null;
  meta_title: string | null;
  meta_description: string | null;
  featured_image_url: string | null;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Popup {
  id: number;
  store_id: number;
  name: string;
  title: string | null;
  content_html: string | null;
  trigger_type: 'time' | 'scroll' | 'exit_intent' | 'page_load';
  trigger_value: number | null;
  display_rules: Record<string, any> | null;
  is_active: boolean;
  starts_at: Date | null;
  ends_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// API Request/Response types
export interface CreatePageRequest {
  title: string;
  handle?: string;
  body_html?: string;
  meta_title?: string;
  meta_description?: string;
  is_published?: boolean;
}

export interface CreateBlogPostRequest {
  title: string;
  handle?: string;
  body_html?: string;
  excerpt?: string;
  tags?: string[];
  meta_title?: string;
  meta_description?: string;
  featured_image_url?: string;
  is_published?: boolean;
}

