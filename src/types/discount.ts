// Discount Types based on schema.sql

export interface DiscountCode {
  id: number;
  store_id: number;
  code: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_shipping' | 'bogo' | 'bundle' | 'volume' | 'fixed_price';
  value: string | null;
  minimum_order_amount: string | null;
  maximum_order_amount: string | null;
  minimum_quantity: number | null;
  maximum_quantity: number | null;
  usage_limit: number | null;
  usage_count: number;
  applies_to: 'all' | 'specific_products' | 'specific_collections' | 'specific_tags';
  priority: number;
  can_combine_with_automatic: boolean;
  can_combine_with_other_codes: boolean;
  max_combined_discounts: number;
  customer_segment: 'all' | 'vip' | 'new_customer' | 'returning_customer' | null;
  minimum_orders_count: number | null;
  minimum_lifetime_value: string | null;
  starts_at: Date | null;
  ends_at: Date | null;
  day_of_week: number[] | null;
  hour_start: number | null;
  hour_end: number | null;
  // BOGO fields
  buy_quantity: number | null;
  get_quantity: number | null;
  get_discount_type: 'free' | 'percentage' | 'fixed_amount' | null;
  get_discount_value: string | null;
  applies_to_same_product: boolean | null;
  // Gift Product (מתנה אוטומטית)
  gift_product_id: number | null;
  // Bundle fields
  bundle_min_products: number | null;
  bundle_discount_type: 'percentage' | 'fixed_amount' | null;
  bundle_discount_value: string | null;
  // Volume fields
  volume_tiers: Array<{
    quantity: number;
    discount_type: 'percentage' | 'fixed_amount';
    value: number;
  }> | null;
  // Fixed Price fields (מחיר קבוע לכמות - לדוגמא: 2 פריטים ב-55 ש"ח)
  fixed_price_quantity: number | null;
  fixed_price_amount: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  product_ids?: number[];
  collection_ids?: number[];
  tag_names?: string[];
}

// API Request/Response types
export interface CreateDiscountCodeRequest {
  code: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_shipping' | 'bogo' | 'bundle' | 'volume' | 'fixed_price';
  value?: string;
  minimum_order_amount?: string;
  maximum_order_amount?: string;
  minimum_quantity?: number;
  maximum_quantity?: number;
  usage_limit?: number;
  applies_to?: 'all' | 'specific_products' | 'specific_collections' | 'specific_tags';
  priority?: number;
  can_combine_with_automatic?: boolean;
  can_combine_with_other_codes?: boolean;
  max_combined_discounts?: number;
  customer_segment?: 'all' | 'vip' | 'new_customer' | 'returning_customer' | null;
  minimum_orders_count?: number;
  minimum_lifetime_value?: string;
  starts_at?: string;
  ends_at?: string;
  day_of_week?: number[] | null;
  hour_start?: number;
  hour_end?: number;
  // BOGO fields
  buy_quantity?: number;
  get_quantity?: number;
  get_discount_type?: 'free' | 'percentage' | 'fixed_amount';
  get_discount_value?: string;
  applies_to_same_product?: boolean;
  // Bundle fields
  bundle_min_products?: number;
  bundle_discount_type?: 'percentage' | 'fixed_amount';
  bundle_discount_value?: string;
  // Volume fields
  volume_tiers?: Array<{
    quantity: number;
    discount_type: 'percentage' | 'fixed_amount';
    value: number;
  }>;
  // Fixed Price fields
  fixed_price_quantity?: number;
  fixed_price_amount?: string;
  is_active?: boolean;
  product_ids?: number[];
  collection_ids?: number[];
  tag_names?: string[];
}

export interface UpdateDiscountCodeRequest {
  code?: string;
  discount_type?: 'percentage' | 'fixed_amount' | 'free_shipping' | 'bogo' | 'bundle' | 'volume' | 'fixed_price';
  value?: string | null;
  minimum_order_amount?: string | null;
  maximum_order_amount?: string | null;
  minimum_quantity?: number | null;
  maximum_quantity?: number | null;
  usage_limit?: number | null;
  applies_to?: 'all' | 'specific_products' | 'specific_collections' | 'specific_tags';
  priority?: number;
  can_combine_with_automatic?: boolean;
  can_combine_with_other_codes?: boolean;
  max_combined_discounts?: number;
  customer_segment?: 'all' | 'vip' | 'new_customer' | 'returning_customer' | null;
  minimum_orders_count?: number | null;
  minimum_lifetime_value?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  day_of_week?: number[] | null;
  hour_start?: number | null;
  hour_end?: number | null;
  // BOGO fields
  buy_quantity?: number | null;
  get_quantity?: number | null;
  get_discount_type?: 'free' | 'percentage' | 'fixed_amount' | null;
  get_discount_value?: string | null;
  applies_to_same_product?: boolean | null;
  // Gift Product (מתנה אוטומטית)
  gift_product_id?: number | null;
  // Bundle fields
  bundle_min_products?: number | null;
  bundle_discount_type?: 'percentage' | 'fixed_amount' | null;
  bundle_discount_value?: string | null;
  // Volume fields
  volume_tiers?: Array<{
    quantity: number;
    discount_type: 'percentage' | 'fixed_amount';
    value: number;
  }> | null;
  // Fixed Price fields
  fixed_price_quantity?: number | null;
  fixed_price_amount?: string | null;
  is_active?: boolean;
  product_ids?: number[];
  collection_ids?: number[];
  tag_names?: string[];
}

// Automatic Discount Types
export interface AutomaticDiscount {
  id: number;
  store_id: number;
  name: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed_amount' | 'free_shipping' | 'bogo' | 'bundle' | 'volume' | 'fixed_price';
  value: string | null;
  minimum_order_amount: string | null;
  maximum_order_amount: string | null;
  minimum_quantity: number | null;
  maximum_quantity: number | null;
  applies_to: 'all' | 'specific_products' | 'specific_collections' | 'specific_tags';
  priority: number;
  can_combine_with_codes: boolean;
  can_combine_with_other_automatic: boolean;
  max_combined_discounts: number;
  customer_segment: 'all' | 'vip' | 'new_customer' | 'returning_customer' | null;
  minimum_orders_count: number | null;
  minimum_lifetime_value: string | null;
  starts_at: Date | null;
  ends_at: Date | null;
  day_of_week: number[] | null;
  hour_start: number | null;
  hour_end: number | null;
  // BOGO fields
  buy_quantity?: number | null;
  get_quantity?: number | null;
  get_discount_type?: 'free' | 'percentage' | 'fixed_amount' | null;
  get_discount_value?: string | null;
  applies_to_same_product?: boolean | null;
  // Gift Product (מתנה אוטומטית)
  gift_product_id?: number | null;
  // Bundle fields
  bundle_min_products?: number | null;
  bundle_discount_type?: 'percentage' | 'fixed_amount' | null;
  bundle_discount_value?: string | null;
  // Volume fields
  volume_tiers?: Array<{
    quantity: number;
    discount_type: 'percentage' | 'fixed_amount';
    value: number;
  }> | null;
  // Fixed Price fields (מחיר קבוע לכמות)
  fixed_price_quantity?: number | null;
  fixed_price_amount?: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  product_ids?: number[];
  collection_ids?: number[];
  tag_names?: string[];
}

export interface CreateAutomaticDiscountRequest {
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_shipping' | 'bogo' | 'bundle' | 'volume' | 'fixed_price';
  value?: string;
  minimum_order_amount?: string;
  maximum_order_amount?: string;
  minimum_quantity?: number;
  maximum_quantity?: number;
  applies_to?: 'all' | 'specific_products' | 'specific_collections' | 'specific_tags';
  priority?: number;
  can_combine_with_codes?: boolean;
  can_combine_with_other_automatic?: boolean;
  max_combined_discounts?: number;
  customer_segment?: 'all' | 'vip' | 'new_customer' | 'returning_customer' | null;
  minimum_orders_count?: number;
  minimum_lifetime_value?: string;
  starts_at?: string;
  ends_at?: string;
  day_of_week?: number[] | null;
  hour_start?: number;
  hour_end?: number;
  // BOGO fields
  buy_quantity?: number;
  get_quantity?: number;
  get_discount_type?: 'free' | 'percentage' | 'fixed_amount';
  get_discount_value?: string;
  applies_to_same_product?: boolean;
  // Bundle fields
  bundle_min_products?: number;
  bundle_discount_type?: 'percentage' | 'fixed_amount';
  bundle_discount_value?: string;
  // Volume fields
  volume_tiers?: Array<{
    quantity: number;
    discount_type: 'percentage' | 'fixed_amount';
    value: number;
  }>;
  // Fixed Price fields
  fixed_price_quantity?: number;
  fixed_price_amount?: string;
  // Gift Product (מתנה אוטומטית)
  gift_product_id?: number | null;
  is_active?: boolean;
  product_ids?: number[];
  collection_ids?: number[];
  tag_names?: string[];
}

export interface UpdateAutomaticDiscountRequest {
  name?: string;
  description?: string | null;
  discount_type?: 'percentage' | 'fixed_amount' | 'free_shipping' | 'bogo' | 'bundle' | 'volume' | 'fixed_price';
  value?: string | null;
  minimum_order_amount?: string | null;
  maximum_order_amount?: string | null;
  minimum_quantity?: number | null;
  maximum_quantity?: number | null;
  applies_to?: 'all' | 'specific_products' | 'specific_collections' | 'specific_tags';
  priority?: number;
  can_combine_with_codes?: boolean;
  can_combine_with_other_automatic?: boolean;
  max_combined_discounts?: number;
  customer_segment?: 'all' | 'vip' | 'new_customer' | 'returning_customer' | null;
  minimum_orders_count?: number | null;
  minimum_lifetime_value?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  day_of_week?: number[] | null;
  hour_start?: number | null;
  hour_end?: number | null;
  // BOGO fields
  buy_quantity?: number | null;
  get_quantity?: number | null;
  get_discount_type?: 'free' | 'percentage' | 'fixed_amount' | null;
  get_discount_value?: string | null;
  applies_to_same_product?: boolean | null;
  // Gift Product (מתנה אוטומטית)
  gift_product_id?: number | null;
  // Bundle fields
  bundle_min_products?: number | null;
  bundle_discount_type?: 'percentage' | 'fixed_amount' | null;
  bundle_discount_value?: string | null;
  // Volume fields
  volume_tiers?: Array<{
    quantity: number;
    discount_type: 'percentage' | 'fixed_amount';
    value: number;
  }> | null;
  // Fixed Price fields
  fixed_price_quantity?: number | null;
  fixed_price_amount?: string | null;
  is_active?: boolean;
  product_ids?: number[];
  collection_ids?: number[];
  tag_names?: string[];
}

