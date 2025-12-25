/**
 * Tracking Events - שידור אירועים לכל הפלטפורמות
 * 
 * מערכת מרכזית לשידור אירועי אנליטיקס לכל הפיקסלים
 * תומך ב-Facebook, TikTok, Google Analytics 4, Google Tag Manager
 */

// ============================================
// Event Types - All Supported Events
// ============================================

// Page Events
export interface PageViewEvent {
  event: 'PageView';
  page_path: string;
  page_title?: string;
  referrer?: string;
}

export interface ViewCategoryEvent {
  event: 'ViewCategory';
  category_id: string;
  category_name: string;
  items_count?: number;
}

// Product Events
export interface ViewContentEvent {
  event: 'ViewContent';
  content_type: 'product' | 'category' | 'article';
  content_ids: string[];
  contents: Array<{
    id: string;
    quantity: number;
    item_price: number;
    item_name?: string;
    item_category?: string;
    item_brand?: string;
  }>;
  currency: string;
  value: number;
}

export interface SelectVariantEvent {
  event: 'SelectVariant';
  product_id: string;
  variant_id: string;
  variant_title: string;
  price: number;
  currency: string;
}

export interface ViewProductGalleryEvent {
  event: 'ViewProductGallery';
  product_id: string;
  product_name: string;
  image_index: number;
}

// Cart Events
export interface AddToCartEvent {
  event: 'AddToCart';
  content_ids: string[];
  contents: Array<{
    id: string;
    quantity: number;
    item_price: number;
    item_name?: string;
  }>;
  currency: string;
  value: number;
}

export interface RemoveFromCartEvent {
  event: 'RemoveFromCart';
  content_ids: string[];
  contents: Array<{
    id: string;
    quantity: number;
    item_price: number;
    item_name?: string;
  }>;
  currency: string;
  value: number;
}

export interface UpdateCartEvent {
  event: 'UpdateCart';
  content_ids: string[];
  contents: Array<{
    id: string;
    quantity: number;
    item_price: number;
    item_name?: string;
  }>;
  currency: string;
  value: number;
  num_items: number;
}

export interface ViewCartEvent {
  event: 'ViewCart';
  content_ids: string[];
  contents: Array<{
    id: string;
    quantity: number;
    item_price: number;
  }>;
  currency: string;
  value: number;
  num_items: number;
}

// Checkout Events
export interface InitiateCheckoutEvent {
  event: 'InitiateCheckout';
  content_ids: string[];
  contents: Array<{
    id: string;
    quantity: number;
    item_price: number;
    item_name?: string;
  }>;
  currency: string;
  value: number;
  num_items: number;
}

export interface AddPaymentInfoEvent {
  event: 'AddPaymentInfo';
  currency: string;
  value: number;
  payment_type?: string;
}

export interface AddShippingInfoEvent {
  event: 'AddShippingInfo';
  currency: string;
  value: number;
  shipping_tier?: string;
}

export interface PurchaseEvent {
  event: 'Purchase';
  content_ids: string[];
  contents: Array<{
    id: string;
    quantity: number;
    item_price: number;
    item_name?: string;
  }>;
  currency: string;
  value: number;
  order_id: string;
  transaction_id?: string;
  shipping?: number;
  tax?: number;
  coupon?: string;
}

// User Events
export interface SignUpEvent {
  event: 'SignUp';
  method?: string;
  user_id?: string;
}

export interface LoginEvent {
  event: 'Login';
  method?: string;
  user_id?: string;
}

export interface LogoutEvent {
  event: 'Logout';
  user_id?: string;
}

export interface SubscribeEvent {
  event: 'Subscribe';
  subscription_type: 'newsletter' | 'premium' | 'notifications';
  value?: number;
  currency?: string;
}

// Wishlist Events
export interface AddToWishlistEvent {
  event: 'AddToWishlist';
  content_ids: string[];
  contents: Array<{
    id: string;
    item_price: number;
    item_name?: string;
  }>;
  currency: string;
  value: number;
}

export interface RemoveFromWishlistEvent {
  event: 'RemoveFromWishlist';
  content_ids: string[];
  currency: string;
  value: number;
}

// Search Events
export interface SearchEvent {
  event: 'Search';
  search_string: string;
  content_ids?: string[];
}

export interface SearchResultsEvent {
  event: 'SearchResults';
  search_string: string;
  results_count: number;
  content_ids?: string[];
}

// Other Events
export interface ContactEvent {
  event: 'Contact';
  contact_method?: 'email' | 'phone' | 'form' | 'chat' | 'whatsapp';
}

export interface LeadEvent {
  event: 'Lead';
  lead_type?: string;
  value?: number;
  currency?: string;
}

export interface CompleteRegistrationEvent {
  event: 'CompleteRegistration';
  registration_type?: string;
  value?: number;
  currency?: string;
}

export interface StartTrialEvent {
  event: 'StartTrial';
  trial_type?: string;
  value?: number;
  currency?: string;
}

export interface SubmitApplicationEvent {
  event: 'SubmitApplication';
  application_type?: string;
}

export interface ScheduleEvent {
  event: 'Schedule';
  appointment_type?: string;
  scheduled_date?: string;
}

export interface FindLocationEvent {
  event: 'FindLocation';
  location_id?: string;
  location_name?: string;
}

export interface CustomizeProductEvent {
  event: 'CustomizeProduct';
  product_id: string;
  product_name?: string;
  customization_type?: string;
}

export interface DonateEvent {
  event: 'Donate';
  value: number;
  currency: string;
  donation_type?: string;
}

export interface CustomEvent {
  event: 'Custom';
  custom_event_name: string;
  custom_data?: Record<string, any>;
}

// All Event Types Union
export type TrackingEvent =
  // Page
  | PageViewEvent
  | ViewCategoryEvent
  // Product
  | ViewContentEvent
  | SelectVariantEvent
  | ViewProductGalleryEvent
  // Cart
  | AddToCartEvent
  | RemoveFromCartEvent
  | UpdateCartEvent
  | ViewCartEvent
  // Checkout
  | InitiateCheckoutEvent
  | AddPaymentInfoEvent
  | AddShippingInfoEvent
  | PurchaseEvent
  // User
  | SignUpEvent
  | LoginEvent
  | LogoutEvent
  | SubscribeEvent
  // Wishlist
  | AddToWishlistEvent
  | RemoveFromWishlistEvent
  // Search
  | SearchEvent
  | SearchResultsEvent
  // Other
  | ContactEvent
  | LeadEvent
  | CompleteRegistrationEvent
  | StartTrialEvent
  | SubmitApplicationEvent
  | ScheduleEvent
  | FindLocationEvent
  | CustomizeProductEvent
  | DonateEvent
  | CustomEvent;

// ============================================
// Event Emitter
// ============================================

/**
 * שולח אירוע לכל הפלטפורמות הפעילות
 */
export function emitTrackingEvent(event: TrackingEvent) {
  if (typeof window === 'undefined') return;

  const eventName = event.event === 'Custom' 
    ? (event as CustomEvent).custom_event_name 
    : event.event;

  // קבל רשימת אירועים מותרים מהחנות (אם הוגדר)
  const allowedEvents = (window as any).__ALLOWED_TRACKING_EVENTS as string[] | undefined;
  
  // אם יש רשימת אירועים מותרים ואירוע זה לא ברשימה - לא לשדר
  if (allowedEvents && !allowedEvents.includes(eventName)) {
    return;
  }

  // Facebook Pixel
  emitFacebookEvent(eventName, event);

  // TikTok Pixel
  emitTikTokEvent(eventName, event);

  // Google Analytics 4 / gtag
  emitGoogleAnalyticsEvent(eventName, event);

  // Google Tag Manager
  emitGTMEvent(eventName, event);

  // Custom Analytics (אנליטיקס פנימי)
  if (window.quickshopAnalytics) {
    window.quickshopAnalytics.track(eventName, event);
  }

  // שמירה ב-database (לאנליטיקס פנימי)
  // רק events חשובים: InitiateCheckout, Purchase, AddToCart
  const eventsToSave = ['InitiateCheckout', 'Purchase', 'AddToCart', 'ViewContent'];
  if (eventsToSave.includes(eventName)) {
    saveEventToDatabase(eventName, event);
  }

  // Log for debugging (only in dev)
  if (process.env.NODE_ENV === 'development') {
    console.log('[Tracking]', eventName, event);
  }
}

/**
 * שומר event ב-database לאנליטיקס פנימי
 */
async function saveEventToDatabase(eventName: string, event: TrackingEvent) {
  try {
    // קבלת storeSlug ו-storeId מ-window
    const storeSlug = (window as any).__STORE_SLUG || 
                      window.location.pathname.match(/\/shops\/([^\/]+)/)?.[1];
    const storeId = (window as any).__STORE_ID;
    
    if (!storeSlug && !storeId) return;

    // קבלת visitor_id מ-localStorage
    const visitorId = localStorage.getItem('visitor_id') || 
                      localStorage.getItem(`visitor_id_${storeSlug}`);

    await fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeSlug,
        storeId,
        event: eventName,
        metadata: {
          ...event,
          visitor_id: visitorId,
          timestamp: new Date().toISOString(),
        },
      }),
    });
  } catch (error) {
    // Don't block on analytics errors
    console.error('[Tracking] Failed to save event to DB:', error);
  }
}

/**
 * Facebook Pixel Events
 */
function emitFacebookEvent(eventName: string, event: TrackingEvent) {
  if (!window.fbq) return;

  // Standard Events
  const standardEvents: Record<string, string> = {
    'PageView': 'PageView',
    'ViewContent': 'ViewContent',
    'AddToCart': 'AddToCart',
    'RemoveFromCart': 'AddToCart', // FB doesn't have RemoveFromCart
    'InitiateCheckout': 'InitiateCheckout',
    'AddPaymentInfo': 'AddPaymentInfo',
    'AddShippingInfo': 'AddShippingInfo',
    'Purchase': 'Purchase',
    'Search': 'Search',
    'AddToWishlist': 'AddToWishlist',
    'Lead': 'Lead',
    'CompleteRegistration': 'CompleteRegistration',
    'Contact': 'Contact',
    'Subscribe': 'Subscribe',
    'StartTrial': 'StartTrial',
    'SubmitApplication': 'SubmitApplication',
    'Schedule': 'Schedule',
    'FindLocation': 'FindLocation',
    'CustomizeProduct': 'CustomizeProduct',
    'Donate': 'Donate',
  };

  const fbEventName = standardEvents[eventName];
  
  if (fbEventName) {
    // Build Facebook-specific payload
    const fbPayload = buildFacebookPayload(event);
    window.fbq('track', fbEventName, fbPayload);
  } else if (eventName !== 'PageView') {
    // Custom event
    window.fbq('trackCustom', eventName, event);
  }
}

function buildFacebookPayload(event: TrackingEvent): Record<string, any> {
  const payload: Record<string, any> = {};

  if ('content_ids' in event) payload.content_ids = event.content_ids;
  if ('contents' in event) payload.contents = event.contents;
  if ('content_type' in event) payload.content_type = event.content_type;
  if ('currency' in event) payload.currency = event.currency;
  if ('value' in event) payload.value = event.value;
  if ('num_items' in event) payload.num_items = event.num_items;
  if ('search_string' in event) payload.search_string = event.search_string;
  if ('order_id' in event) payload.order_id = event.order_id;

  return payload;
}

/**
 * TikTok Pixel Events
 */
function emitTikTokEvent(eventName: string, event: TrackingEvent) {
  if (!window.ttq) return;

  // Map to TikTok event names
  const tikTokEvents: Record<string, string> = {
    'PageView': 'PageView',
    'ViewContent': 'ViewContent',
    'AddToCart': 'AddToCart',
    'InitiateCheckout': 'InitiateCheckout',
    'AddPaymentInfo': 'AddPaymentInfo',
    'Purchase': 'CompletePayment',
    'Search': 'Search',
    'AddToWishlist': 'AddToWishlist',
    'CompleteRegistration': 'CompleteRegistration',
    'Subscribe': 'Subscribe',
    'Contact': 'Contact',
    'SubmitApplication': 'SubmitForm',
  };

  const ttEventName = tikTokEvents[eventName];
  
  if (ttEventName) {
    const ttPayload = buildTikTokPayload(event);
    
    if (ttEventName === 'PageView') {
      window.ttq.page();
    } else {
      window.ttq.track(ttEventName, ttPayload);
    }
  }
}

function buildTikTokPayload(event: TrackingEvent): Record<string, any> {
  const payload: Record<string, any> = {};

  if ('content_ids' in event) payload.content_id = event.content_ids[0];
  if ('content_type' in event) payload.content_type = event.content_type;
  if ('currency' in event) payload.currency = event.currency;
  if ('value' in event) payload.value = event.value;
  if ('num_items' in event) payload.quantity = event.num_items;
  if ('search_string' in event) payload.query = event.search_string;
  if ('order_id' in event) payload.order_id = event.order_id;

  if ('contents' in event && event.contents.length > 0) {
    payload.contents = event.contents.map(item => ({
      content_id: item.id,
      quantity: item.quantity || 1,
      price: item.item_price,
    }));
  }

  return payload;
}

/**
 * Google Analytics 4 Events
 */
function emitGoogleAnalyticsEvent(eventName: string, event: TrackingEvent) {
  if (!window.gtag) return;

  // Map to GA4 event names
  const ga4Events: Record<string, string> = {
    'PageView': 'page_view',
    'ViewContent': 'view_item',
    'ViewCategory': 'view_item_list',
    'AddToCart': 'add_to_cart',
    'RemoveFromCart': 'remove_from_cart',
    'ViewCart': 'view_cart',
    'InitiateCheckout': 'begin_checkout',
    'AddPaymentInfo': 'add_payment_info',
    'AddShippingInfo': 'add_shipping_info',
    'Purchase': 'purchase',
    'Search': 'search',
    'AddToWishlist': 'add_to_wishlist',
    'SignUp': 'sign_up',
    'Login': 'login',
    'Lead': 'generate_lead',
    'Subscribe': 'subscribe',
  };

  const ga4EventName = ga4Events[eventName] || eventName.toLowerCase();
  const ga4Payload = buildGA4Payload(event);
  
  window.gtag('event', ga4EventName, ga4Payload);
}

function buildGA4Payload(event: TrackingEvent): Record<string, any> {
  const payload: Record<string, any> = {};

  if ('currency' in event) payload.currency = event.currency;
  if ('value' in event) payload.value = event.value;
  if ('search_string' in event) payload.search_term = event.search_string;
  if ('order_id' in event) payload.transaction_id = event.order_id;
  if ('shipping' in event) payload.shipping = event.shipping;
  if ('tax' in event) payload.tax = event.tax;
  if ('coupon' in event) payload.coupon = event.coupon;
  if ('payment_type' in event) payload.payment_type = event.payment_type;
  if ('shipping_tier' in event) payload.shipping_tier = event.shipping_tier;

  if ('contents' in event) {
    payload.items = event.contents.map((item, index) => ({
      item_id: item.id,
      item_name: 'item_name' in item ? item.item_name : undefined,
      price: item.item_price,
      quantity: 'quantity' in item ? item.quantity : 1,
      index,
    }));
  }

  return payload;
}

/**
 * Google Tag Manager Events
 */
function emitGTMEvent(eventName: string, event: TrackingEvent) {
  if (!window.dataLayer) return;

  const gtmPayload: Record<string, any> = {
    event: eventName,
  };

  // Add ecommerce data if available
  if ('contents' in event || 'value' in event) {
    gtmPayload.ecommerce = {
      ...event,
      items: 'contents' in event ? event.contents.map((item, index) => ({
        item_id: item.id,
        item_name: 'item_name' in item ? item.item_name : undefined,
        price: item.item_price,
        quantity: 'quantity' in item ? item.quantity : 1,
        index,
      })) : undefined,
    };
  } else {
    // Non-ecommerce events
    gtmPayload.eventData = event;
  }

  // Clear previous ecommerce data
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push(gtmPayload);
}

// ============================================
// Server-Side Tracking
// ============================================

/**
 * שולח אירוע מצד השרת (לדיוק טוב יותר)
 * נקרא מה-API routes
 */
export async function emitServerSideEvent(
  storeId: number,
  event: TrackingEvent,
  userData?: {
    ip?: string;
    userAgent?: string;
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
  }
) {
  // This will be implemented to call Facebook CAPI, TikTok Events API, etc.
  // For now, just log
  console.log('[Server Tracking]', storeId, event.event, event);
  
  // TODO: Implement server-side tracking
  // - Facebook Conversions API
  // - TikTok Events API
  // - Google Measurement Protocol
}

// ============================================
// Type Declarations
// ============================================

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    ttq?: {
      track: (event: string, data?: any) => void;
      page: () => void;
    };
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    quickshopAnalytics?: {
      track: (event: string, data: any) => void;
    };
    __ALLOWED_TRACKING_EVENTS?: string[];
  }
}
