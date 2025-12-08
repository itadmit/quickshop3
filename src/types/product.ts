// Product Types based on schema.sql

export interface Product {
  id: number;
  store_id: number;
  title: string;
  handle: string;
  body_html: string | null;
  vendor: string | null;
  product_type: string | null;
  status: 'draft' | 'active' | 'archived';
  published_at: Date | null;
  archived_at: Date | null;
  published_scope: string;
  template_suffix: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ProductImage {
  id: number;
  product_id: number;
  position: number;
  src: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  compare_at_price: string | null;
  sku: string | null;
  barcode: string | null;
  position: number;
  option1?: string | null;
  option2?: string | null;
  option3?: string | null;
  inventory_quantity: number;
  inventory_policy: string;
  inventory_management: string | null;
  weight: number | null;
  weight_unit: string;
  requires_shipping: boolean;
  taxable: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ProductOption {
  id: number;
  product_id: number;
  name: string;
  position: number;
  type?: 'button' | 'color' | 'pattern' | 'image';
  created_at: Date;
  values?: ProductOptionValue[];
}

export interface ProductOptionValue {
  id: number;
  option_id: number;
  value: string;
  position: number;
  metadata?: {
    color?: string; // Hex color for color type
    image?: string; // Image URL for pattern/image type
    images?: string[]; // Array of images for gallery
    pattern?: string; // CSS pattern for pattern type
    backgroundSize?: string; // Background size for pattern
    backgroundPosition?: string; // Background position for pattern
  };
}

export interface ProductCollection {
  id: number;
  store_id: number;
  title: string;
  handle: string;
  description: string | null;
  image_url: string | null;
  published_at: Date | null;
  published_scope: string;
  sort_order: string;
  created_at: Date;
  updated_at: Date;
}

export interface ProductTag {
  id: number;
  store_id: number;
  name: string;
  created_at: Date;
}

// Extended types for API responses
export interface ProductWithDetails extends Product {
  images?: ProductImage[];
  variants?: ProductVariant[];
  options?: ProductOption[];
  collections?: ProductCollection[];
  tags?: ProductTag[];
  defaultVariantId?: string | null;
}

