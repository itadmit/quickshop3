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

const CART_STORAGE_KEY = 'quickshop_cart';

// === SINGLE SOURCE OF TRUTH: localStorage ===
function getCartFromStorage(): CartItem[] {
  if (typeof window === 'undefined') {
    return [];
  }
  
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
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

function setCartToStorage(items: CartItem[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('[useCart] Error saving to localStorage:', error);
  }
}

function clearCartFromStorage(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
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
  
  // Initialize from localStorage on mount
  useEffect(() => {
    if (!initialized.current && typeof window !== 'undefined') {
      initialized.current = true;
      const stored = getCartFromStorage();
      setCartItems(stored);
    }
  }, []);
  
  // Listen to localStorage changes (from other tabs or direct updates)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY) {
        const newItems = e.newValue ? JSON.parse(e.newValue) : [];
        setCartItems(Array.isArray(newItems) ? newItems : []);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Load cart from server
  const loadCartFromServer = useCallback(async () => {
    if (!storeId) {
      return;
    }

    setIsLoadingFromServer(true);
    
    try {
      const response = await fetch(`/api/cart?storeId=${storeId}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.items && Array.isArray(data.items)) {
          setCartToStorage(data.items);
          setCartItems(data.items);
        }
      }
    } catch (error) {
      console.error('[useCart] Error loading cart from server:', error);
    } finally {
      setIsLoadingFromServer(false);
    }
  }, [storeId]);

  // Save cart to server
  const saveCartToServer = useCallback(async (items: CartItem[]) => {
    if (!storeId) {
      console.warn('[useCart] Cannot save to server: storeId is missing');
      return;
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items,
          storeId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save cart: ${response.status}`);
      }
    } catch (error) {
      console.error('[useCart] Error saving cart to server:', error);
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
      const currentItems = getCartFromStorage();
      
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
      setCartToStorage(newItems);
      setCartItems(newItems);
      
      // Save to server (background, non-blocking)
      saveCartToServer(newItems);
    } finally {
      setIsAddingToCart(false);
    }
  }, [storeId, saveCartToServer, areItemsEqual, isAddingToCart]);

  const removeFromCart = useCallback((variantId: number) => {
    // === READ DIRECTLY FROM LOCALSTORAGE (SOURCE OF TRUTH) ===
    const currentItems = getCartFromStorage();
    
    // Filter out the item
    const newItems = currentItems.filter((i) => i.variant_id !== variantId);
    
    // === UPDATE BOTH LOCALSTORAGE AND STATE ===
    setCartToStorage(newItems);
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
    const currentItems = getCartFromStorage();
    
    const newItems = currentItems.map((i) => 
      i.variant_id === variantId ? { ...i, quantity } : i
    );
    
    // === UPDATE BOTH LOCALSTORAGE AND STATE ===
    setCartToStorage(newItems);
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
    clearCartFromStorage();
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
