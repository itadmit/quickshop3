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
  template: 'STANDARD' | 'CHOICES_OF';
  display_type: 'GRID' | 'LIST' | null;
  selected_products: number[] | null;
  coupon_code: string | null;
  influencer_id: number | null;
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
  display_on?: 'desktop' | 'mobile' | 'both'; // איפה להציג את התפריט
  created_at: Date;
  updated_at: Date;
}

export interface NavigationMenuItem {
  id: number;
  menu_id: number;
  title: string;
  label?: string; // alias for title
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
  template?: 'STANDARD' | 'CHOICES_OF';
  display_type?: 'GRID' | 'LIST';
  selected_products?: number[];
  coupon_code?: string;
  influencer_id?: number | null;
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

