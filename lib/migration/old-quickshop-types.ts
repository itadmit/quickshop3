/**
 * Types for old QuickShop database structure
 */

export interface OldProduct {
  id: number;
  store_id: number;
  name: string;
  description: string | null;
  regular_price: number | null;
  sale_price: number | null;
  cost_per_item: number | null;
  category_id: string | null;
  gallery: string | null;
  product_image: string | null;
  product_gallery: string | null; // JSON array
  featured_video: string | null;
  video_enabled: number;
  external_video_url: string | null;
  tags: string | null;
  vendor: string | null;
  selected_options: string | null;
  display_order: number;
  product_slug: string | null;
  is_weighted: number;
  product_type: 'regular' | 'variable' | 'bundle' | 'calendar' | null;
  sku: string | null;
  is_hidden: number;
  ignore_inventory: number;
  badge_text: string | null;
  badge_color: string | null;
  product_badges: string | null;
  meta_title: string | null;
  meta_description: string | null;
  url_handle: string | null;
  is_active: number;
  created_at: Date;
  updated_at: Date;
  inventory_quantity: number;
  attributes_display: string | null; // JSON
  gallery_mode: string | null;
  complete_look_products: string | null;
  connected_products: string | null;
  vimeo_url: string | null;
  gallery_per_value_enabled: number;
  gallery_per_value_option: string | null;
  show_per_100ml: number;
  price_per_100ml: number | null;
  options_data: string | null; // JSON
  bundle_data: string | null; // JSON
}

export interface OldProductVariant {
  id: number;
  product_id: number;
  sku: string | null;
  regular_price: number | null;
  sale_price: number | null;
  inventory_quantity: number;
  variant_options: string | null; // JSON: {"צבע":"שחור","מידה":"XS"}
  ignore_inventory: number;
  created_at: Date;
  display_type: 'button' | 'color' | 'image';
  color_code: string | null;
  variant_image: string | null;
  variant_gallery: string | null; // JSON array
  updated_at: Date;
  gallery_order: string | null; // JSON array
  options_data: string | null; // JSON
}

export interface OldProductOption {
  id: number;
  option_name: string;
  option_type: 'checkbox' | 'radio' | 'select' | 'text';
  max_selection: number | null;
  min_selection: number | null;
  is_quantity_option: number;
  condition_option: string | null;
  store_id: number;
  display_order: number;
}

export interface OldOptionValue {
  id: number;
  option_id: number;
  value_name: string;
  price: number | null;
}

export interface OldStore {
  id: number;
  name: string;
  slug: string;
  // ... many other fields
}

export interface OldMedia {
  id: number;
  store_id: number;
  file_name: string;
  alt_text: string | null;
  file_type: string;
  file_size: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Parsed variant options from JSON
 */
export interface ParsedVariantOptions {
  [optionName: string]: string; // e.g., {"צבע": "שחור", "מידה": "XS"}
}

