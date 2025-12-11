// Plugin Types - Types for Marketplace Plugins System

export type PluginType = 'CORE' | 'SCRIPT';
export type PluginCategory = 
  | 'ANALYTICS' 
  | 'MARKETING' 
  | 'PAYMENT' 
  | 'INVENTORY' 
  | 'COMMUNICATION' 
  | 'OPERATIONS' 
  | 'CUSTOMIZATION' 
  | 'LOYALTY';

export type ScriptLocation = 'HEAD' | 'BODY_START' | 'BODY_END';

export type PluginSubscriptionStatus = 
  | 'PENDING' 
  | 'ACTIVE' 
  | 'CANCELLED' 
  | 'EXPIRED' 
  | 'FAILED';

// Plugin Database Model
export interface Plugin {
  id: number;
  store_id: number | null; // null = גלובלי
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  version: string;
  author: string | null;
  type: PluginType;
  category: PluginCategory;
  is_active: boolean;
  is_installed: boolean;
  is_built_in: boolean;
  script_url: string | null;
  script_content: string | null;
  inject_location: ScriptLocation | null;
  config_schema: any | null;
  config: any;
  is_free: boolean;
  price: number | null;
  currency: string;
  is_editable: boolean;
  is_deletable: boolean;
  metadata: any;
  requirements: any | null;
  admin_notes: string | null;
  display_order: number;
  created_at: Date;
  updated_at: Date;
  installed_at: Date | null;
}

// Plugin Subscription Database Model
export interface PluginSubscription {
  id: number;
  store_id: number;
  plugin_id: number;
  status: PluginSubscriptionStatus;
  is_active: boolean;
  start_date: Date | null;
  end_date: Date | null;
  next_billing_date: Date | null;
  payment_method: string | null; // 'quickshop_payments', 'payplus', 'stripe', etc.
  payment_details: any | null;
  recurring_payment_uid: string | null; // UID של הוראת הקבע
  card_token: string | null;
  monthly_price: number;
  last_payment_date: Date | null;
  last_payment_amount: number | null;
  cancelled_at: Date | null;
  cancellation_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

// Plugin Definition (for registry)
export interface PluginDefinition {
  slug: string;
  name: string;
  description: string;
  type: PluginType;
  category: PluginCategory;
  version: string;
  is_built_in: boolean;
  is_free: boolean;
  price?: number; // מחיר חודשי (אם לא חינמי)
  currency?: string;
  icon?: string;
  author?: string;
  script_url?: string;
  script_content?: string;
  inject_location?: ScriptLocation;
  config_schema?: any;
  defaultConfig: any;
  metadata?: {
    menuItem?: {
      icon: string;
      labelKey: string;
      href: string;
      permission?: string;
      section?: string;
    };
    screenshots?: string[];
    documentation?: string;
  };
  requirements?: {
    minVersion?: string;
    requiredPlugins?: string[];
  };
}

// Plugin Hook Interface (for Core plugins)
export interface PluginHook {
  // אירועי עגלה
  onCartAdd?: (item: any, storeId: number) => Promise<void>;
  onCartUpdate?: (cart: any, storeId: number) => Promise<void>;
  onCartRemove?: (itemId: string, storeId: number) => Promise<void>;
  
  // אירועי הזמנה
  onOrderCreate?: (order: any, storeId: number) => Promise<void>;
  onOrderUpdate?: (order: any, storeId: number) => Promise<void>;
  onOrderComplete?: (order: any, storeId: number) => Promise<void>;
  
  // אירועי מוצר
  onProductView?: (product: any, storeId: number) => Promise<void>;
  onProductPurchase?: (product: any, order: any, storeId: number) => Promise<void>;
  
  // אירועי תשלום
  onPaymentMethodAdd?: (methods: any[], storeId: number) => Promise<any[]>;
  onPaymentProcess?: (order: any, method: string, storeId: number) => Promise<any>;
  
  // אירועי storefront
  onStorefrontRender?: (shop: any, storeId: number) => Promise<React.ReactNode | null>;
  onCheckoutRender?: (checkout: any, storeId: number) => Promise<React.ReactNode | null>;
  
  // אירועי לוח זמנים
  onScheduleCheck?: (date: Date, storeId: number) => Promise<boolean>;
}

// Payment Provider Interface (גנרי לסליקה)
export interface PaymentProvider {
  name: string;
  slug: string;
  createRecurringPayment: (params: CreateRecurringPaymentParams) => Promise<RecurringPaymentResult>;
  cancelRecurringPayment: (recurringPaymentUid: string) => Promise<boolean>;
  updateRecurringPayment: (recurringPaymentUid: string, params: UpdateRecurringPaymentParams) => Promise<boolean>;
  getRecurringPaymentStatus: (recurringPaymentUid: string) => Promise<RecurringPaymentStatus>;
}

export interface CreateRecurringPaymentParams {
  storeId: number;
  pluginId: number;
  amount: number; // בשקלים
  currency: string;
  cardToken: string;
  customerEmail?: string;
  customerName?: string;
  description?: string;
  metadata?: any;
}

export interface UpdateRecurringPaymentParams {
  amount?: number;
  cardToken?: string;
  isActive?: boolean;
}

export interface RecurringPaymentResult {
  success: boolean;
  recurringPaymentUid?: string;
  error?: string;
  paymentDetails?: any;
}

export interface RecurringPaymentStatus {
  isActive: boolean;
  nextBillingDate: Date | null;
  lastPaymentDate: Date | null;
  lastPaymentAmount: number | null;
  status: 'active' | 'cancelled' | 'failed' | 'expired';
}

// API Request/Response Types
export interface InstallPluginRequest {
  pluginSlug: string;
}

export interface SubscribePluginRequest {
  pluginSlug: string;
  cardToken?: string; // אם יש token קיים
}

export interface UpdatePluginConfigRequest {
  config: any;
}

export interface CreatePluginRequest {
  name: string;
  slug: string;
  description: string;
  type: PluginType;
  category: PluginCategory;
  is_free: boolean;
  price?: number;
  script_content?: string;
  inject_location?: ScriptLocation;
  defaultConfig?: any;
}



