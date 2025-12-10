// Influencer Types

export interface Influencer {
  id: number;
  store_id: number;
  name: string;
  email: string;
  password_hash: string;
  phone: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  is_active: boolean;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateInfluencerRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  instagram_handle?: string;
  tiktok_handle?: string;
  coupon_ids?: number[];
}

export interface UpdateInfluencerRequest {
  name?: string;
  email?: string;
  phone?: string;
  instagram_handle?: string;
  tiktok_handle?: string;
  is_active?: boolean;
  coupon_ids?: number[];
}

export interface InfluencerWithStats extends Influencer {
  coupons: Array<{
    id: number;
    code: string;
    discount_type: string;
    value: number | null;
    usage_count: number;
    usage_limit: number | null;
  }>;
  total_sales: number;
  total_orders: number;
}

export interface InfluencerStats {
  total_sales: number;
  total_orders: number;
  average_order_value: number;
  active_coupons: number;
  last_order_date: Date | null;
  first_order_date: Date | null;
}

export interface InfluencerOrder {
  id: number;
  order_number: string;
  created_at: Date;
  total_amount: number;
  discount_amount: number;
  coupon_code: string;
  coupon_id: number;
  status: string;
  item_count: number;
}

export interface InfluencerCouponStats {
  id: number;
  code: string;
  discount_type: string;
  value: number | null;
  usage_count: number;
  usage_limit: number | null;
  total_sales: number;
  orders_count: number;
  is_active: boolean;
  starts_at: Date | null;
  ends_at: Date | null;
}

export interface InfluencerChartData {
  labels: string[];
  sales: number[];
  orders: number[];
}

