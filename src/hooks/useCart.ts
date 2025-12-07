'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useStoreId } from './useStoreId';

export interface CartItem {
  variant_id: number;
  product_id: number;
  product_title: string;
  variant_title: string;
  price: number;
  quantity: number;
  image?: string;
  // אפשרויות נוספות (מידה, צבע וכו')
  properties?: Array<{
    name: string; // שם האפשרות (מידה, צבע וכו')
    value: string; // הערך (42, אדום וכו')
  }>;
}

/**
 * Cart Management Hook - Shopify-like Implementation
 * 
 * עקרונות כמו Shopify:
 * 1. מבודד לחלוטין בין חנויות - כל חנות = עגלה נפרדת
 * 2. שימוש ב-cookies (visitor_session_id) לזיהוי מבקרים
 * 3. השרת הוא המקור האמת (visitor_carts table עם visitor_session_id + store_id)
 * 4. localStorage הוא cache מקומי בלבד (per store)
 * 5. כל החישובים דרך מנוע מרכזי אחד (cartCalculator)
 * 
 * Isolation Strategy:
 * - Server: visitor_carts table עם (visitor_session_id, store_id) כמפתח ייחודי
 * - Client: localStorage עם מפתח per-store: quickshop_cart_store_{storeId}
 * - Cookies: visitor_session_id cookie משותף לכל החנויות (כמו Shopify)
 */

// כל חנות מקבלת מפתח נפרד ב-localStorage - מונע ערבוב עגלות בין חנויות
const CART_STORAGE_KEY_PREFIX = 'quickshop_cart_store_';

// === SINGLE SOURCE OF TRUTH: Server (via cookies) ===
// localStorage הוא cache מקומי בלבד - השרת הוא המקור האמת
function getCartFromStorage(storeId: number | null): CartItem[] {
  if (typeof window === 'undefined' || !storeId) {
    return [];
  }
  
  try {
    const key = `${CART_STORAGE_KEY_PREFIX}${storeId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('[useCart] Failed to parse cart from localStorage', e);
  }
  
  return [];
}

function setCartToStorage(items: CartItem[], storeId: number | null): void {
  if (typeof window === 'undefined' || !storeId) {
    return;
  }
  
  try {
    const key = `${CART_STORAGE_KEY_PREFIX}${storeId}`;
    localStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.error('[useCart] Error saving to localStorage:', error);
  }
}

function clearCartFromStorage(storeId: number | null): void {
  if (typeof window === 'undefined' || !storeId) {
    return;
  }
  
  try {
    const key = `${CART_STORAGE_KEY_PREFIX}${storeId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('[useCart] Error clearing localStorage:', error);
  }
}

export function useCart() {
  // State מסונכרן עם localStorage
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isLoadingFromServer, setIsLoadingFromServer] = useState(false);
  const storeId = useStoreId();
  
  // Ref to track if we've initialized from localStorage
  const initialized = useRef(false);
  
  // Initialize from server when storeId changes (like Shopify - server is source of truth)
  // When switching stores, always load from server to ensure isolation
  useEffect(() => {
    if (typeof window !== 'undefined' && storeId) {
      // Reset state when storeId changes
      setCartItems([]);
      initialized.current = false;
      
      // Load from server first (source of truth), then sync to localStorage
      loadCartFromServer();
    } else if (typeof window !== 'undefined' && !storeId) {
      // If no storeId, clear cart
      setCartItems([]);
      initialized.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);
  
  // Listen to localStorage changes (from other tabs or direct updates)
  useEffect(() => {
    if (typeof window === 'undefined' || !storeId) return;
    
    const cartKey = `${CART_STORAGE_KEY_PREFIX}${storeId}`;
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === cartKey) {
        const newItems = e.newValue ? JSON.parse(e.newValue) : [];
        setCartItems(Array.isArray(newItems) ? newItems : []);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storeId]);

  // Load cart from server (like Shopify - cookies-based, per-store isolation)
  // This is the SINGLE SOURCE OF TRUTH - server has the real cart via cookies
  const loadCartFromServer = useCallback(async () => {
    if (!storeId) {
      return;
    }

    setIsLoadingFromServer(true);
    
    try {
      // Fetch from server using cookies (visitor_session_id cookie)
      // Server returns cart for this specific store_id + visitor_session_id combination
      const response = await fetch(`/api/cart?storeId=${storeId}`, {
        method: 'GET',
        credentials: 'include', // Important: sends cookies
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.items && Array.isArray(data.items)) {
          // Sync server data to localStorage (for offline support)
          setCartToStorage(data.items, storeId);
          setCartItems(data.items);
          initialized.current = true;
        } else {
          // Empty cart - clear localStorage for this store
          setCartToStorage([], storeId);
          setCartItems([]);
          initialized.current = true;
        }
      } else {
        // If server error, try localStorage as fallback
        const stored = getCartFromStorage(storeId);
        setCartItems(stored);
        initialized.current = true;
      }
    } catch (error) {
      console.error('[useCart] Error loading cart from server:', error);
      // Fallback to localStorage if server fails
      const stored = getCartFromStorage(storeId);
      setCartItems(stored);
      initialized.current = true;
    } finally {
      setIsLoadingFromServer(false);
    }
  }, [storeId]);

  // Save cart to server (like Shopify - cookies-based, per-store)
  // Server stores cart in database using visitor_session_id cookie + store_id
  const saveCartToServer = useCallback(async (items: CartItem[]) => {
    if (!storeId) {
      console.warn('[useCart] Cannot save to server: storeId is missing');
      return;
    }

    try {
      // Save to server using cookies (visitor_session_id cookie)
      // Server stores in visitor_carts table with (visitor_session_id, store_id) as unique key
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important: sends cookies
        body: JSON.stringify({
          items,
          storeId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save cart: ${response.status}`);
      }
      
      // After successful save, sync response back to ensure consistency
      const data = await response.json();
      if (data.items && Array.isArray(data.items)) {
        setCartToStorage(data.items, storeId);
        setCartItems(data.items);
      }
    } catch (error) {
      console.error('[useCart] Error saving cart to server:', error);
      // Don't throw - allow localStorage to continue working offline
    }
  }, [storeId]);

  // Helper function to compare cart items (including properties)
  const areItemsEqual = useCallback((a: CartItem, b: CartItem): boolean => {
    if (a.variant_id !== b.variant_id) {
      return false;
    }
    // Compare properties if they exist
    const aProps = a.properties || [];
    const bProps = b.properties || [];
    if (aProps.length !== bProps.length) {
      return false;
    }
    // Sort properties for comparison
    const sortProps = (props: Array<{ name: string; value: string }>) =>
      [...props].sort((x, y) => x.name.localeCompare(y.name));
    const sortedA = sortProps(aProps);
    const sortedB = sortProps(bProps);
    return sortedA.every((prop, idx) => 
      prop.name === sortedB[idx].name && prop.value === sortedB[idx].value
    );
  }, []);

  const addToCart = useCallback(async (item: CartItem) => {
    // Validation
    if (!item.variant_id || !item.product_id || !item.price || item.price < 0) {
      console.error('[useCart] Invalid cart item:', item);
      return;
    }
    if (!item.quantity || item.quantity <= 0) {
      console.error('[useCart] Invalid quantity:', item.quantity);
      return;
    }
    if (!storeId) {
      console.error('[useCart] Cannot add to cart: storeId is missing');
      return;
    }
    if (isAddingToCart) {
      console.log('[useCart] Already adding to cart, skipping');
      return;
    }

    setIsAddingToCart(true);

    try {
      // === READ DIRECTLY FROM LOCALSTORAGE (SOURCE OF TRUTH) ===
      const currentItems = getCartFromStorage(storeId);
      
      const existing = currentItems.find((i) => areItemsEqual(i, item));
      
      let newItems: CartItem[];
      if (existing) {
        // Update existing item quantity
        newItems = currentItems.map((i) =>
          areItemsEqual(i, item)
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      } else {
        // Add new item
        newItems = [...currentItems, item];
      }
      
      // === UPDATE BOTH LOCALSTORAGE AND STATE ===
      setCartToStorage(newItems, storeId);
      setCartItems(newItems);
      
      // Save to server (background, non-blocking)
      saveCartToServer(newItems);
    } finally {
      setIsAddingToCart(false);
    }
  }, [storeId, saveCartToServer, areItemsEqual, isAddingToCart]);

  const removeFromCart = useCallback((variantId: number) => {
    // === READ DIRECTLY FROM LOCALSTORAGE (SOURCE OF TRUTH) ===
    const currentItems = getCartFromStorage(storeId);
    
    // Filter out the item
    const newItems = currentItems.filter((i) => i.variant_id !== variantId);
    
    // === UPDATE BOTH LOCALSTORAGE AND STATE ===
    setCartToStorage(newItems, storeId);
    setCartItems(newItems);
    
    // Save to server (background, non-blocking)
    if (storeId) {
      saveCartToServer(newItems);
    }
  }, [storeId, saveCartToServer]);

  const updateQuantity = useCallback(async (variantId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(variantId);
      return;
    }
    
    // === READ DIRECTLY FROM LOCALSTORAGE (SOURCE OF TRUTH) ===
    const currentItems = getCartFromStorage(storeId);
    
    const newItems = currentItems.map((i) => 
      i.variant_id === variantId ? { ...i, quantity } : i
    );
    
    // === UPDATE BOTH LOCALSTORAGE AND STATE ===
    setCartToStorage(newItems, storeId);
    setCartItems(newItems);
    
    // Save to server (await to ensure sync)
    if (storeId) {
      await saveCartToServer(newItems);
      // רענון נוסף אחרי שמירה לשרת כדי לוודא שהכל מסונכרן
      await loadCartFromServer();
    }
  }, [storeId, removeFromCart, saveCartToServer, loadCartFromServer]);

  const clearCart = useCallback(() => {
    // === CLEAR BOTH LOCALSTORAGE AND STATE ===
    clearCartFromStorage(storeId);
    setCartItems([]);
    
    // Clear from server
    if (storeId) {
      fetch(`/api/cart?storeId=${storeId}`, {
        method: 'DELETE',
        credentials: 'include',
      }).catch(console.error);
    }
  }, [storeId]);

  const getCartCount = useCallback(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  return {
    cartItems,
    isLoading: isLoading || isLoadingFromServer,
    isAddingToCart,
    isLoadingFromServer,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartCount,
    refreshCart: loadCartFromServer,
  };
}
