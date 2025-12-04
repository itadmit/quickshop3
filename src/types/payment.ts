// Payment & Shipping Types based on schema.sql

export interface PaymentProvider {
  id: number;
  store_id: number;
  provider_name: string; // credit_card, paypal, etc.
  environment: 'test' | 'production';
  api_public_key: string | null;
  api_secret_key: string | null;
  webhook_secret: string | null;
  is_active: boolean;
  settings: Record<string, any> | null;
  created_at: Date;
  updated_at: Date;
}

export interface ShippingZone {
  id: number;
  store_id: number;
  name: string;
  countries: string[];
  provinces: string[];
  created_at: Date;
  updated_at: Date;
}

export interface ShippingRate {
  id: number;
  shipping_zone_id: number;
  name: string;
  price: string;
  min_order_subtotal: string | null;
  max_order_subtotal: string | null;
  min_weight: string | null;
  max_weight: string | null;
  free_shipping_threshold: string | null;
  delivery_days_min: number | null;
  delivery_days_max: number | null;
  carrier_service_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface ShippingZoneWithRates extends ShippingZone {
  rates?: ShippingRate[];
}

// API Request/Response types
export interface CreatePaymentProviderRequest {
  provider_name: string;
  environment?: 'test' | 'production';
  api_public_key?: string;
  api_secret_key?: string;
  webhook_secret?: string;
  is_active?: boolean;
  settings?: Record<string, any>;
}

export interface CreateShippingZoneRequest {
  name: string;
  countries: string[];
  provinces?: string[];
}

export interface CreateShippingRateRequest {
  name: string;
  price: string;
  min_order_subtotal?: string;
  max_order_subtotal?: string;
  min_weight?: string;
  max_weight?: string;
  free_shipping_threshold?: string;
  delivery_days_min?: number;
  delivery_days_max?: number;
}

