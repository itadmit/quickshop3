// Order Types based on schema.sql

export interface Order {
  id: number;
  store_id: number;
  customer_id: number | null;
  email: string | null;
  phone: string | null;
  name: string | null;
  order_number: number | null;
  order_name: string | null;
  order_handle: string | null; // Secure handle for order URL
  financial_status: 'pending' | 'authorized' | 'partially_paid' | 'paid' | 'partially_refunded' | 'refunded' | 'voided';
  fulfillment_status: 'pending' | 'approved' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'canceled' | 'returned' | 'fulfilled' | 'partial' | 'restocked' | string | null; // string for custom statuses
  total_price: string;
  subtotal_price: string | null;
  total_tax: string;
  total_discounts: string;
  total_shipping_price: string;
  currency: string;
  current_total_discounts: string | null;
  current_total_price: string | null;
  current_subtotal_price: string | null;
  current_total_tax: string | null;
  buyer_accepts_marketing: boolean;
  cancel_reason: string | null;
  cancelled_at: Date | null;
  cart_token: string | null;
  checkout_token: string | null;
  checkout_id: number | null;
  client_details: Record<string, any> | null;
  closed_at: Date | null;
  confirmed: boolean;
  contact_email: string | null;
  discount_codes: any[] | null;
  gateway: string | null;
  landing_site: string | null;
  landing_site_ref: string | null;
  location_id: number | null;
  note: string | null;
  note_attributes: Record<string, any> | null;
  number: number | null;
  processed_at: Date | null;
  referring_site: string | null;
  source_name: string | null;
  tags: string | null;
  test: boolean;
  token: string | null;
  total_duties: string | null;
  total_line_items_price: string | null;
  total_outstanding: string | null;
  total_price_usd: string | null;
  total_weight: number | null;
  user_id: number | null;
  billing_address: Record<string, any> | null;
  shipping_address: Record<string, any> | null;
  is_read: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface OrderLineItem {
  id: number;
  order_id: number;
  product_id: number | null;
  variant_id: number | null;
  title: string;
  variant_title: string | null;
  vendor: string | null;
  product_exists: boolean;
  quantity: number;
  sku: string | null;
  variant_inventory_management: string | null;
  fulfillment_service: string | null;
  fulfillment_status: string | null;
  requires_shipping: boolean;
  taxable: boolean;
  gift_card: boolean;
  name: string | null;
  variant_inventory_quantity: number | null;
  properties: Record<string, any> | null;
  product_properties: Record<string, any> | null;
  total_discount: string;
  price: string;
  grams: number | null;
  tax_lines: any[] | null;
  duties: any[] | null;
  discount_allocations: any[] | null;
  image?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface OrderFulfillment {
  id: number;
  order_id: number;
  status: 'pending' | 'open' | 'success' | 'cancelled' | 'error' | 'failure';
  created_at: Date;
  updated_at: Date;
  tracking_company: string | null;
  tracking_number: string | null;
  tracking_numbers: string[] | null;
  tracking_url: string | null;
  tracking_urls: string[] | null;
  receipt: Record<string, any> | null;
  name: string | null;
  service: string | null;
  shipment_status: string | null;
  location_id: number | null;
  origin_address: Record<string, any> | null;
  destination: Record<string, any> | null;
  line_items: number[] | null;
  notify_customer: boolean;
}

export interface OrderRefund {
  id: number;
  order_id: number;
  note: string | null;
  user_id: number | null;
  created_at: Date;
  refund_line_items: any[] | null;
  transactions: any[] | null;
  order_adjustments: any[] | null;
  currency: string;
}

// Extended types for API responses
export interface OrderWithDetails extends Order {
  line_items?: OrderLineItem[];
  fulfillments?: OrderFulfillment[];
  refunds?: OrderRefund[];
  customer?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}

// API Request/Response types
export interface CreateOrderRequest {
  customer_id?: number;
  email: string;
  phone?: string;
  name?: string;
  line_items: Array<{
    product_id?: number;
    variant_id?: number;
    title: string;
    quantity: number;
    price: string;
    sku?: string;
  }>;
  billing_address?: Record<string, any>;
  shipping_address?: Record<string, any>;
  discount_codes?: string[];
  note?: string;
  tags?: string;
}

export interface UpdateOrderStatusRequest {
  financial_status?: Order['financial_status'];
  fulfillment_status?: Order['fulfillment_status'];
  note?: string;
}

export interface CreateRefundRequest {
  note?: string;
  refund_line_items?: Array<{
    line_item_id: number;
    quantity: number;
  }>;
  amount?: string;
}

