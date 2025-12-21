'use client';

import { useState, useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { useStoreId } from './useStoreId';
import { emitTrackingEvent } from '@/lib/tracking/events';

export interface CartItem {
  variant_id: number;
  product_id: number;
  product_title: string;
  variant_title: string;
  price: number;
  quantity: number;
  image?: string;
  properties?: Array<{
    name: string;
    value: string;
  }>;
}

/**
 * Cart Management Hook - Global State with Listeners
 * שיתוף state גלובלי בין כל הקומפוננטות
 * - localStorage לתצוגה מיידית
 * - Server sync לאמינות
 * - Real-time updates בין קומפוננטות
 */

const CART_STORAGE_KEY_PREFIX = 'quickshop_cart_store_';

// ============================================
// GLOBAL STATE - Shared between all components
// ============================================

// Global cart items per store
const globalCartItems: { [storeId: number]: CartItem[] } = {};

// Global loading states
const globalCartLoading: { [storeId: number]: boolean } = {};
const globalCartLoaded: { [storeId: number]: boolean } = {};
const globalIsAddingToCart: { [storeId: number]: boolean } = {};

// Listeners for real-time updates
let cartListeners: Array<() => void> = [];
let listenerVersion = 0;

// Subscribe/notify pattern for useSyncExternalStore
function subscribeToCart(callback: () => void) {
  cartListeners.push(callback);
  return () => {
    cartListeners = cartListeners.filter(l => l !== callback);
  };
}

function getCartSnapshot() {
  return listenerVersion;
}

function notifyCartListeners() {
  listenerVersion++;
  cartListeners.forEach(l => l());
}

// ============================================
// STORAGE HELPERS
// ============================================

function getCartFromStorage(storeId: number | null): CartItem[] {
  if (typeof window === 'undefined' || !storeId) return [];
  
  try {
    const key = `${CART_STORAGE_KEY_PREFIX}${storeId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('[useCart] Failed to parse cart from localStorage', e);
  }
  
  return [];
}

function setCartToStorage(items: CartItem[], storeId: number | null): void {
  if (typeof window === 'undefined' || !storeId) return;
  
  try {
    const key = `${CART_STORAGE_KEY_PREFIX}${storeId}`;
    localStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.error('[useCart] Error saving to localStorage:', error);
  }
}

// ============================================
// MAIN HOOK
// ============================================

export function useCart() {
  const storeId = useStoreId();
  
  // Subscribe to global cart changes - this ensures re-render on any cart change
  const version = useSyncExternalStore(subscribeToCart, getCartSnapshot, getCartSnapshot);
  
  // Get cart items from global state
  const cartItems = storeId ? (globalCartItems[storeId] || []) : [];
  const isAddingToCart = storeId ? (globalIsAddingToCart[storeId] || false) : false;
  const isLoading = storeId ? (globalCartLoading[storeId] || false) : false;
  
  const loadingRef = useRef(false);

  // Set cart items and notify all listeners
  const setCartItems = useCallback((items: CartItem[]) => {
    if (!storeId) return;
    globalCartItems[storeId] = items;
    setCartToStorage(items, storeId);
    notifyCartListeners();
  }, [storeId]);

  // Set adding state
  const setIsAddingToCart = useCallback((adding: boolean) => {
    if (!storeId) return;
    globalIsAddingToCart[storeId] = adding;
    notifyCartListeners();
  }, [storeId]);

  // Initialize cart from localStorage on first mount
  useEffect(() => {
    if (typeof window !== 'undefined' && storeId && !globalCartLoaded[storeId]) {
      // Load from localStorage immediately
      const cached = getCartFromStorage(storeId);
      globalCartItems[storeId] = cached;
      notifyCartListeners();
      
      // Load from server once
      if (!globalCartLoading[storeId]) {
        loadCartFromServer();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  // Listen to localStorage changes (from other tabs)
  useEffect(() => {
    if (typeof window === 'undefined' || !storeId) return;
    
    const cartKey = `${CART_STORAGE_KEY_PREFIX}${storeId}`;
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === cartKey) {
        const newItems = e.newValue ? JSON.parse(e.newValue) : [];
        globalCartItems[storeId] = Array.isArray(newItems) ? newItems : [];
        notifyCartListeners();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storeId]);

  // Load cart from server
  const loadCartFromServer = useCallback(async () => {
    if (!storeId || loadingRef.current || globalCartLoading[storeId]) return;

    loadingRef.current = true;
    globalCartLoading[storeId] = true;
    notifyCartListeners();
    
    try {
      const response = await fetch(`/api/cart?storeId=${storeId}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.items && Array.isArray(data.items)) {
          globalCartItems[storeId] = data.items;
          setCartToStorage(data.items, storeId);
        } else {
          globalCartItems[storeId] = [];
          setCartToStorage([], storeId);
        }
        globalCartLoaded[storeId] = true;
        notifyCartListeners();
      }
    } catch (error) {
      console.error('[useCart] Error loading cart from server:', error);
    } finally {
      globalCartLoading[storeId] = false;
      loadingRef.current = false;
      notifyCartListeners();
    }
  }, [storeId]);

  // Save cart to server
  const saveCartToServer = useCallback(async (items: CartItem[]): Promise<boolean> => {
    if (!storeId) return false;

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items, storeId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.items && Array.isArray(data.items)) {
          globalCartItems[storeId] = data.items;
          setCartToStorage(data.items, storeId);
          notifyCartListeners();
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('[useCart] Error saving cart to server:', error);
      return false;
    }
  }, [storeId]);

  // Compare cart items (including properties)
  const areItemsEqual = useCallback((a: CartItem, b: CartItem): boolean => {
    if (a.variant_id !== b.variant_id) return false;
    
    const aProps = a.properties || [];
    const bProps = b.properties || [];
    if (aProps.length !== bProps.length) return false;
    
    const sortProps = (props: Array<{ name: string; value: string }>) =>
      [...props].sort((x, y) => x.name.localeCompare(y.name));
    const sortedA = sortProps(aProps);
    const sortedB = sortProps(bProps);
    return sortedA.every((prop, idx) => 
      prop.name === sortedB[idx].name && prop.value === sortedB[idx].value
    );
  }, []);

  // ADD TO CART - Updates global state immediately
  const addToCart = useCallback(async (item: CartItem): Promise<boolean> => {
    // Validations - שים לב: price יכול להיות 0 למוצרי מתנה
    if (!item.variant_id || !item.product_id || item.price === undefined || item.price === null || item.price < 0) {
      console.error('[useCart] Invalid cart item:', item);
      return false;
    }
    if (!item.quantity || item.quantity <= 0) {
      console.error('[useCart] Invalid quantity:', item.quantity);
      return false;
    }
    if (!storeId) {
      console.error('[useCart] Cannot add to cart: storeId is missing');
      return false;
    }
    if (globalIsAddingToCart[storeId]) {
      return false;
    }

    // Set adding state
    globalIsAddingToCart[storeId] = true;
    notifyCartListeners();

    try {
      // Read current items from global state
      const currentItems = globalCartItems[storeId] || [];
      const existing = currentItems.find((i) => areItemsEqual(i, item));
      
      // חישוב כמות סופית (קיימת + חדשה)
      const currentQuantity = existing ? existing.quantity : 0;
      const totalQuantity = currentQuantity + item.quantity;
      
      // ✅ בדיקת מלאי לפני הוספה (רק למוצרים רגילים, לא למתנות)
      const isGiftProduct = item.properties?.some(prop => prop.name === 'מתנה');
      if (!isGiftProduct) {
        try {
          const inventoryResponse = await fetch(`/api/variants/${item.variant_id}/inventory`);
          if (inventoryResponse.ok) {
            const inventoryData = await inventoryResponse.json();
            const available = inventoryData.available || 0;
            
            if (totalQuantity > available) {
              const canAdd = available - currentQuantity;
              if (canAdd <= 0) {
                alert(`המוצר "${item.product_title}" אזל מהמלאי`);
              } else {
                alert(`רק ${available} יחידות זמינות במלאי. ניתן להוסיף עוד ${canAdd} יחידות.`);
              }
              globalIsAddingToCart[storeId] = false;
              notifyCartListeners();
              return false;
            }
          }
        } catch (inventoryError) {
          console.warn('[useCart] Could not check inventory, proceeding:', inventoryError);
          // ממשיכים גם אם לא הצלחנו לבדוק מלאי
        }
      }
      
      let newItems: CartItem[];
      if (existing) {
        newItems = currentItems.map((i) =>
          areItemsEqual(i, item)
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      } else {
        newItems = [...currentItems, item];
      }
      
      // Update global state and localStorage immediately
      globalCartItems[storeId] = newItems;
      setCartToStorage(newItems, storeId);
      notifyCartListeners();
      
      // Save to server (async, don't block)
      saveCartToServer(newItems);
      
      return true;
    } catch (error) {
      console.error('[useCart] Error adding to cart:', error);
      return false;
    } finally {
      globalIsAddingToCart[storeId] = false;
      notifyCartListeners();
    }
  }, [storeId, saveCartToServer, areItemsEqual]);

  // REMOVE FROM CART (user action - cannot remove gifts)
  const removeFromCart = useCallback((variantId: number) => {
    if (!storeId) return;
    
    const currentItems = globalCartItems[storeId] || [];
    
    // Don't remove gift products (user cannot remove gifts manually)
    const itemToRemove = currentItems.find((i) => i.variant_id === variantId);
    const isGiftProduct = itemToRemove?.properties?.some(prop => prop.name === 'מתנה');
    
    if (isGiftProduct) {
      console.warn('[useCart] Cannot remove gift product manually');
      return;
    }
    
    // Track RemoveFromCart event
    if (itemToRemove) {
      emitTrackingEvent({
        event: 'RemoveFromCart',
        content_ids: [String(itemToRemove.product_id)],
        contents: [{
          id: String(itemToRemove.product_id),
          quantity: itemToRemove.quantity,
          item_price: itemToRemove.price,
          item_name: itemToRemove.product_title,
        }],
        currency: 'ILS',
        value: itemToRemove.price * itemToRemove.quantity,
      });
    }
    
    const newItems = currentItems.filter((i) => i.variant_id !== variantId);
    
    // Also remove any orphaned gifts if no regular items left
    const hasRegularItems = newItems.some(item => 
      !item.properties?.some(p => p.name === 'מתנה')
    );
    
    const finalItems = hasRegularItems 
      ? newItems 
      : newItems.filter(item => !item.properties?.some(p => p.name === 'מתנה'));
    
    globalCartItems[storeId] = finalItems;
    setCartToStorage(finalItems, storeId);
    notifyCartListeners();
    
    saveCartToServer(finalItems);
  }, [storeId, saveCartToServer]);

  // REMOVE GIFT FROM CART (system action - for discount management)
  const removeGiftFromCart = useCallback((variantId: number) => {
    if (!storeId) return;
    
    const currentItems = globalCartItems[storeId] || [];
    const newItems = currentItems.filter((i) => i.variant_id !== variantId);
    
    globalCartItems[storeId] = newItems;
    setCartToStorage(newItems, storeId);
    notifyCartListeners();
    
    saveCartToServer(newItems);
  }, [storeId, saveCartToServer]);

  // UPDATE QUANTITY
  const updateQuantity = useCallback(async (variantId: number, quantity: number) => {
    if (!storeId) return;
    
    if (quantity <= 0) {
      removeFromCart(variantId);
      return;
    }
    
    const currentItems = globalCartItems[storeId] || [];
    const itemToUpdate = currentItems.find((i) => i.variant_id === variantId);
    
    const newItems = currentItems.map((i) => 
      i.variant_id === variantId ? { ...i, quantity } : i
    );
    
    // Track UpdateCart event
    if (itemToUpdate) {
      emitTrackingEvent({
        event: 'UpdateCart',
        content_ids: newItems.map(i => String(i.product_id)),
        contents: newItems.map(i => ({
          id: String(i.product_id),
          quantity: i.quantity,
          item_price: i.price,
          item_name: i.product_title,
        })),
        currency: 'ILS',
        value: newItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
        num_items: newItems.reduce((sum, i) => sum + i.quantity, 0),
      });
    }
    
    globalCartItems[storeId] = newItems;
    setCartToStorage(newItems, storeId);
    notifyCartListeners();
    
    await saveCartToServer(newItems);
  }, [storeId, saveCartToServer, removeFromCart]);

  // CLEAR CART
  const clearCart = useCallback(async () => {
    if (typeof window === 'undefined' || !storeId) return;
    
    const key = `${CART_STORAGE_KEY_PREFIX}${storeId}`;
    localStorage.removeItem(key);
    globalCartItems[storeId] = [];
    notifyCartListeners();
    
    await saveCartToServer([]);
  }, [storeId, saveCartToServer]);

  // GET CART COUNT
  const getCartCount = useCallback(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  // GET CART TOTAL (for display only - real calculation is server-side)
  const getCartTotal = useCallback(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  return {
    cartItems,
    addToCart,
    removeFromCart,
    removeGiftFromCart,
    updateQuantity,
    clearCart,
    getCartCount,
    getCartTotal,
    isLoading,
    isAddingToCart,
    isLoadingFromServer: isLoading,
    refreshCart: loadCartFromServer,
  };
}
