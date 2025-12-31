// ============================================
// QuickShop Remix Storefront - API Layer
// מתחבר ל-Next.js Backend API
// ============================================

const API_URL = process.env.API_URL || "http://localhost:3099/api";

// ============================================
// Types - מבוסס על הסכמה של QuickShop
// ============================================

export interface Store {
  id: number;
  name: string;
  slug: string;
  domain?: string;
  currency: string;
  locale: string;
  timezone: string;
  logo?: string;
}

export interface ProductListItem {
  id: number;
  title: string;
  handle: string;
  image: string | null;
  variant_id: number;
  price: number;
  compare_at_price: number | null;
  available: number;
  vendor?: string;
}

export interface ProductDetails extends ProductListItem {
  body_html: string | null;
  product_type: string | null;
  images: Array<{
    id: number;
    src: string;
    alt: string | null;
    position: number;
  }>;
  variants: Array<{
    id: number;
    title: string;
    price: number;
    compare_at_price: number | null;
    sku: string | null;
    option1: string | null;
    option2: string | null;
    option3: string | null;
    available: number;
  }>;
  options?: Array<{
    id: number;
    name: string;
    type?: 'button' | 'color' | 'pattern' | 'image';
    position: number;
    values?: Array<{
      id: number;
      value: string;
      position: number;
      metadata?: {
        color?: string;
        image?: string;
      };
    }>;
  }>;
  metafields?: Array<{
    namespace: string;
    key: string;
    value: string;
    value_type: string;
    name: string;
  }>;
}

export interface Collection {
  id: number;
  title: string;
  handle: string;
  description?: string | null;
  image_url?: string | null;
  parent_id?: number | null;
  products_count?: number;
  product_count?: number;
}

export interface Section {
  id: string;
  type: string;
  visible?: boolean;
  settings?: Record<string, any>;
  blocks?: Array<{
    id: string;
    type: string;
    settings?: Record<string, any>;
  }>;
}

export interface LayoutResponse {
  sections: Section[];
  store: Store;
  storeId: number;
  product?: ProductDetails | null;
  collection?: Collection | null;
  products?: ProductListItem[];
}

// ============================================
// Main API Functions
// ============================================

/**
 * טוען את ה-Layout של דף - זה ה-API הראשי!
 * מחזיר sections, store, product/collection/products
 */
export async function fetchPageLayout(
  storeSlug: string,
  pageType: 'home' | 'product' | 'collection' | 'category' | 'products' | 'categories' | 'other' = 'home',
  pageHandle?: string
): Promise<LayoutResponse | null> {
  try {
    const params = new URLSearchParams({
      storeSlug,
      pageType,
    });
    
    if (pageHandle) {
      params.set('pageHandle', pageHandle);
    }
    
    const url = `${API_URL}/storefront/layout?${params}`;
    console.log(`[Remix API] Fetching layout: ${url}`);
    
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      // No cache for development
      cache: 'no-store',
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Remix API] Layout API error (${res.status}):`, errorText);
      return null;
    }
    
    const data = await res.json();
    console.log(`[Remix API] Layout loaded successfully:`, {
      store: data.store?.name,
      productsCount: data.products?.length || 0,
      sectionsCount: data.sections?.length || 0,
    });
    return data;
  } catch (error: any) {
    console.error("[Remix API] Error fetching layout:", error.message, error.stack);
    return null;
  }
}

/**
 * טוען רשימת מוצרים
 */
export async function fetchProducts(
  storeSlug: string,
  options?: {
    limit?: number;
    offset?: number;
    collection?: string;
    sort?: string;
    featured?: boolean;
  }
): Promise<ProductListItem[]> {
  try {
    const params = new URLSearchParams({
      storeSlug,
      limit: String(options?.limit || 20),
      offset: String(options?.offset || 0),
    });
    
    if (options?.collection) params.set('collection', options.collection);
    if (options?.sort) params.set('sort', options.sort);
    if (options?.featured) params.set('featured', 'true');
    
    const url = `${API_URL}/storefront/products?${params}`;
    console.log(`[Remix API] Fetching products: ${url}`);
    
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Remix API] Products API error (${res.status}):`, errorText);
      return [];
    }
    
    const data = await res.json();
    console.log(`[Remix API] Products loaded: ${data.products?.length || 0} products`);
    return data.products || [];
  } catch (error: any) {
    console.error("[Remix API] Error fetching products:", error.message);
    return [];
  }
}

/**
 * טוען קטגוריות
 */
export async function fetchCollections(
  storeSlug: string,
  limit: number = 10
): Promise<Collection[]> {
  try {
    const params = new URLSearchParams({ storeSlug, limit: String(limit) });
    const res = await fetch(`${API_URL}/storefront/collections?${params}`, {
      headers: { "Content-Type": "application/json" },
    });
    
    if (!res.ok) return [];
    
    const data = await res.json();
    return data.collections || [];
  } catch (error) {
    console.error("Error fetching collections:", error);
    return [];
  }
}

/**
 * טוען הגדרות חנות
 */
export async function fetchStoreSettings(storeSlug: string): Promise<Store | null> {
  try {
    const res = await fetch(`${API_URL}/storefront/stores?slug=${storeSlug}`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      console.error(`[Remix API] Store API error (${res.status})`);
      return null;
    }
    const data = await res.json();
    return data.store || null;
  } catch (error: any) {
    console.error("[Remix API] Error fetching store:", error.message);
    return null;
  }
}

/**
 * הוספה לעגלה
 * דורש: product details, variant, storeId
 */
export async function addToCart(
  storeId: number,
  product: ProductDetails,
  variantId: number,
  quantity: number = 1
) {
  const variant = product.variants?.find(v => v.id === variantId);
  if (!variant) {
    throw new Error("Variant not found");
  }
  
  // יצירת cart item לפי הפורמט של QuickShop
  const cartItem = {
    variant_id: variant.id,
    product_id: product.id,
    product_title: product.title,
    variant_title: variant.title,
    price: variant.price,
    quantity: quantity,
    image: product.images?.[0]?.src || product.image || null,
  };
  
  // טעינת העגלה הנוכחית
  const currentCartRes = await fetch(`${API_URL}/cart?storeId=${storeId}`, {
    headers: { "Content-Type": "application/json" },
  });
  
  let currentItems: any[] = [];
  if (currentCartRes.ok) {
    const cartData = await currentCartRes.json();
    currentItems = cartData.items || [];
  }
  
  // בדיקה אם הפריט כבר קיים בעגלה
  const existingItemIndex = currentItems.findIndex(
    (item: any) => item.variant_id === variantId
  );
  
  if (existingItemIndex >= 0) {
    // עדכון כמות
    currentItems[existingItemIndex].quantity += quantity;
  } else {
    // הוספת פריט חדש
    currentItems.push(cartItem);
  }
  
  // שמירת העגלה
  const res = await fetch(`${API_URL}/cart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      items: currentItems,
      storeId 
    }),
  });
  
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to add to cart: ${error}`);
  }
  
  return res.json();
}

// ============================================
// Helper Functions
// ============================================
// Note: formatPrice and getDiscountPercent moved to ~/lib/utils.ts
// to allow client-side usage
