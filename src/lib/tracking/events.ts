/**
 * Tracking Events - שידור אירועים לכל הפלטפורמות
 * 
 * מערכת מרכזית לשידור אירועי אנליטיקס לכל הפיקסלים
 */

// ============================================
// Event Types
// ============================================

export interface PageViewEvent {
  event: 'PageView';
  page_path: string;
  page_title?: string;
  referrer?: string;
}

export interface ViewContentEvent {
  event: 'ViewContent';
  content_type: 'product';
  content_ids: string[];
  contents: Array<{
    id: string;
    quantity: number;
    item_price: number;
  }>;
  currency: string;
  value: number;
}

export interface AddToCartEvent {
  event: 'AddToCart';
  content_ids: string[];
  contents: Array<{
    id: string;
    quantity: number;
    item_price: number;
  }>;
  currency: string;
  value: number;
}

export interface InitiateCheckoutEvent {
  event: 'InitiateCheckout';
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

export interface PurchaseEvent {
  event: 'Purchase';
  content_ids: string[];
  contents: Array<{
    id: string;
    quantity: number;
    item_price: number;
  }>;
  currency: string;
  value: number;
  order_id: string;
  transaction_id?: string;
}

export interface SearchEvent {
  event: 'Search';
  search_string: string;
  content_ids?: string[];
}

export type TrackingEvent =
  | PageViewEvent
  | ViewContentEvent
  | AddToCartEvent
  | InitiateCheckoutEvent
  | PurchaseEvent
  | SearchEvent;

// ============================================
// Event Emitter
// ============================================

/**
 * שולח אירוע לכל הפלטפורמות הפעילות
 */
export function emitTrackingEvent(event: TrackingEvent) {
  if (typeof window === 'undefined') return;

  const eventName = event.event;

  // Facebook Pixel
  if (window.fbq) {
    switch (eventName) {
      case 'PageView':
        window.fbq('track', 'PageView');
        break;
      case 'ViewContent':
        window.fbq('track', 'ViewContent', {
          content_type: event.content_type,
          content_ids: event.content_ids,
          contents: event.contents,
          currency: event.currency,
          value: event.value,
        });
        break;
      case 'AddToCart':
        window.fbq('track', 'AddToCart', {
          content_ids: event.content_ids,
          contents: event.contents,
          currency: event.currency,
          value: event.value,
        });
        break;
      case 'InitiateCheckout':
        window.fbq('track', 'InitiateCheckout', {
          content_ids: event.content_ids,
          contents: event.contents,
          currency: event.currency,
          value: event.value,
          num_items: event.num_items,
        });
        break;
      case 'Purchase':
        window.fbq('track', 'Purchase', {
          content_ids: event.content_ids,
          contents: event.contents,
          currency: event.currency,
          value: event.value,
          order_id: event.order_id,
        });
        break;
    }
  }

  // TikTok Pixel
  if (window.ttq) {
    switch (eventName) {
      case 'ViewContent':
        window.ttq.track('ViewContent', {
          content_type: event.content_type,
          content_id: event.content_ids[0],
          value: event.value,
          currency: event.currency,
        });
        break;
      case 'AddToCart':
        window.ttq.track('AddToCart', {
          content_id: event.content_ids[0],
          value: event.value,
          currency: event.currency,
        });
        break;
      case 'InitiateCheckout':
        window.ttq.track('InitiateCheckout', {
          value: event.value,
          currency: event.currency,
        });
        break;
      case 'Purchase':
        window.ttq.track('CompletePayment', {
          content_id: event.content_ids[0],
          value: event.value,
          currency: event.currency,
          order_id: event.order_id,
        });
        break;
    }
  }

  // Google Analytics 4 / gtag
  if (window.gtag) {
    window.gtag('event', eventName.toLowerCase(), {
      event_category: 'ecommerce',
      ...event,
    });
  }

  // Google Tag Manager
  if (window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ecommerce: event,
    });
  }

  // Custom Analytics (אנליטיקס פנימי)
  if (window.quickshopAnalytics) {
    window.quickshopAnalytics.track(eventName, event);
  }
}

// ============================================
// Type Declarations
// ============================================

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    ttq?: {
      track: (event: string, data?: any) => void;
    };
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    quickshopAnalytics?: {
      track: (event: string, data: any) => void;
    };
  }
}

