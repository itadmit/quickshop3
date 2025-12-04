// Discount Types based on schema.sql

export interface DiscountCode {
  id: number;
  store_id: number;
  code: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: string | null;
  minimum_order_amount: string | null;
  usage_limit: number | null;
  usage_count: number;
  applies_to: 'all' | 'specific_products' | 'specific_collections';
  starts_at: Date | null;
  ends_at: Date | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// API Request/Response types
export interface CreateDiscountCodeRequest {
  code: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value?: string;
  minimum_order_amount?: string;
  usage_limit?: number;
  applies_to?: 'all' | 'specific_products' | 'specific_collections';
  starts_at?: string;
  ends_at?: string;
  is_active?: boolean;
}

export interface UpdateDiscountCodeRequest {
  code?: string;
  discount_type?: 'percentage' | 'fixed_amount' | 'free_shipping';
  value?: string;
  minimum_order_amount?: string;
  usage_limit?: number;
  applies_to?: 'all' | 'specific_products' | 'specific_collections';
  starts_at?: string;
  ends_at?: string;
  is_active?: boolean;
}

