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
  min_shipping_amount: string | null; // מינימום למשלוח
  is_pickup: boolean; // איסוף עצמי
  delivery_days_min: number | null;
  delivery_days_max: number | null;
  carrier_service_id: number | null;
  created_at: Date;
  updated_at: Date;
  cities?: ShippingRateCity[]; // מחירים לפי עיר
}

export interface ShippingRateCity {
  id: number;
  shipping_rate_id: number;
  city_name: string;
  price: string;
  free_shipping_threshold: string | null;
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
  min_shipping_amount?: string;
  is_pickup?: boolean;
  delivery_days_min?: number;
  delivery_days_max?: number;
  cities?: Array<{
    city_name: string;
    price: string;
    free_shipping_threshold?: string | null;
  }>;
}

// ============================================
// PAYMENT INTEGRATIONS
// ============================================

// Payment provider types - extensible for future providers
export type PaymentProviderType = 
  | 'quickpay'    // QuickShop Payments - הספק הפנימי שלנו
  | 'pelecard'    // פלאקארד
  | 'payplus'     // פייפלוס
  | 'hyp'         // הייפ
  | 'meshulam'    // משולם / Grow
  | 'tranzila'    // טרנזילה
  | 'cardcom'     // קארדקום
  | 'stripe';     // Stripe (בינלאומי)

// Payment provider configuration - loaded from DB or config
export interface PaymentProviderConfig {
  id: PaymentProviderType;
  name: string;
  nameEn: string;
  description: string;
  logo?: string;
  isRecommended?: boolean;
  isComingSoon?: boolean;
  requiredFields: PaymentProviderField[];
  supportedFeatures: PaymentProviderFeature[];
}

export interface PaymentProviderField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'select';
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  helpText?: string;
}

export type PaymentProviderFeature = 
  | 'credit_card'
  | 'bit'
  | 'apple_pay'
  | 'google_pay'
  | 'paypal'
  | 'tokenization'
  | 'recurring'
  | 'refunds'
  | 'partial_refunds'
  | 'installments';

export interface StorePaymentIntegration {
  id: number;
  store_id: number;
  provider: PaymentProviderType;
  display_name: string | null;
  terminal_number: string | null;
  username: string | null;
  password_encrypted: string | null;
  api_key_encrypted: string | null;
  is_sandbox: boolean;
  is_active: boolean;
  is_default: boolean;
  settings: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export type PaymentTransactionType = 'charge' | 'refund' | 'void' | 'authorize';
export type PaymentTransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'voided';

export interface PaymentTransaction {
  id: number;
  store_id: number;
  order_id: number | null;
  integration_id: number | null;
  provider: PaymentProviderType;
  external_transaction_id: string | null;
  amount: number;
  currency: string;
  transaction_type: PaymentTransactionType;
  status: PaymentTransactionStatus;
  card_last_four: string | null;
  card_brand: string | null;
  card_expiry: string | null;
  confirmation_key: string | null;
  user_key: string | null;
  approval_number: string | null;
  token: string | null;
  token_expiry: Date | null;
  error_code: string | null;
  error_message: string | null;
  raw_request: Record<string, any> | null;
  raw_response: Record<string, any> | null;
  original_transaction_id: number | null;
  refund_amount: number | null;
  refund_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

// ============================================
// SHIPPING INTEGRATIONS
// ============================================

export type ShippingProviderType = 
  | 'baldar'
  | 'focus'
  | 'runcom'
  | 'cargo'
  | 'lionwheel'
  | 'chita'
  | 'dhl'
  | 'ups'
  | 'fedex'
  | 'israel_post';

export interface StoreShippingIntegration {
  id: number;
  store_id: number;
  provider: ShippingProviderType;
  display_name: string | null;
  customer_number: string | null;
  api_key_encrypted: string | null;
  api_token_encrypted: string | null;
  api_base_url: string | null;
  shipment_type_code: string | null;
  cargo_type_code: string | null;
  return_cargo_type_code: string | null;
  reference_prefix: string | null;
  is_active: boolean;
  is_default: boolean;
  auto_create_shipment: boolean;
  auto_send_tracking_email: boolean;
  settings: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export type ShipmentStatus = 
  | 'pending' 
  | 'created' 
  | 'label_printed' 
  | 'picked_up' 
  | 'in_transit' 
  | 'out_for_delivery' 
  | 'delivered' 
  | 'failed' 
  | 'cancelled' 
  | 'returned';

export interface Shipment {
  id: number;
  store_id: number;
  order_id: number | null;
  integration_id: number | null;
  provider: ShippingProviderType;
  external_shipment_id: string | null;
  external_random_id: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  label_url: string | null;
  label_printed_at: Date | null;
  status: ShipmentStatus;
  status_description: string | null;
  estimated_delivery_date: Date | null;
  actual_delivery_date: Date | null;
  delivered_to: string | null;
  delivery_proof_url: string | null;
  driver_id: string | null;
  driver_name: string | null;
  pickup_point_code: string | null;
  pickup_point_name: string | null;
  our_reference: string | null;
  error_code: string | null;
  error_message: string | null;
  raw_response: Record<string, any> | null;
  created_at: Date;
  updated_at: Date;
}

export interface ShipmentStatusHistory {
  id: number;
  shipment_id: number;
  status_code: string | null;
  status_description: string | null;
  status_date: string | null;
  status_time: string | null;
  location: string | null;
  notes: string | null;
  created_at: Date;
}

export interface ShippingPickupPoint {
  id: number;
  provider: ShippingProviderType;
  point_code: string;
  point_name: string;
  point_type: 'store' | 'locker' | null;
  city: string | null;
  street: string | null;
  house_number: string | null;
  latitude: number | null;
  longitude: number | null;
  opening_hours: string | null;
  is_active: boolean;
  last_synced_at: Date;
  created_at: Date;
  updated_at: Date;
}

// ============================================
// PAYMENT GATEWAY INTERFACES
// ============================================

export interface PaymentInitResult {
  success: boolean;
  transactionId: string;
  paymentUrl: string;
  error?: string;
}

export interface PaymentCallbackData {
  statusCode: string;
  transactionId: string;
  approvalNumber?: string;
  token?: string;
  confirmationKey?: string;
  paramX?: string;
  userKey?: string;
  error?: string;
}

export interface PaymentValidationResult {
  valid: boolean;
  transactionId?: string;
  error?: string;
}

export interface PaymentTransactionDetails {
  transactionId: string;
  amount: number;
  currency: string;
  status: PaymentTransactionStatus;
  cardLastFour?: string;
  cardBrand?: string;
  approvalNumber?: string;
  createdAt: Date;
  raw?: Record<string, any>;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  amount?: number;
  error?: string;
}

// ============================================
// SHIPPING GATEWAY INTERFACES
// ============================================

export interface CreateShipmentInput {
  orderId: number;
  orderName: string;
  consigneeName: string;
  phone: string;
  email?: string;
  city: string;
  street: string;
  houseNumber?: string;
  entrance?: string;
  floor?: string;
  apartment?: string;
  addressRemarks?: string;
  shipmentRemarks?: string;
  numberOfPackages?: number;
  pickupPointCode?: string;
}

export interface CreateShipmentResult {
  success: boolean;
  shipmentId?: string;
  randomId?: string;
  trackingNumber?: string;
  error?: string;
  errorCode?: string;
}

export interface ShipmentTrackingResult {
  success: boolean;
  shipmentId?: string;
  status?: string;
  statusDescription?: string;
  isDelivered?: boolean;
  deliveryDate?: string;
  deliveryTime?: string;
  driverName?: string;
  statusHistory?: Array<{
    statusCode: string;
    statusDescription: string;
    date: string;
    time: string;
  }>;
  error?: string;
}

export interface CancelShipmentResult {
  success: boolean;
  error?: string;
}

export interface PrintLabelResult {
  success: boolean;
  labelUrl?: string;
  pdfBuffer?: Buffer;
  error?: string;
}

export interface GetPickupPointsResult {
  success: boolean;
  points?: Array<{
    code: string;
    name: string;
    type: 'store' | 'locker';
    city: string;
    street: string;
    houseNumber: string;
    latitude: number;
    longitude: number;
    openingHours: string;
  }>;
  error?: string;
}

