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
  properties?: Array<{
    name: string;
    value: string;
  }>;
}

/**
 * Cart Management Hook - Shopify-like Implementation
 * פשוט כמו Shopify:
 * - localStorage לתצוגה מיידית
 * - Server sync לאמינות
 * - לא over-engineering
 */

const CART_STORAGE_KEY_PREFIX = 'quickshop_cart_store_';

// Global: prevent multiple instances from loading at once
const globalCartLoading: { [storeId: number]: boolean } = {};
const globalCartLoaded: { [storeId: number]: boolean } = {};

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

export function useCart() {
  const storeId = useStoreId();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isLoadingFromServer, setIsLoadingFromServer] = useState(false);
  const initialized = useRef(false);
  const loadingRef = useRef(false);

  // Load cart from localStorage immediately when storeId is available
  useEffect(() => {
    if (typeof window !== 'undefined' && storeId && !initialized.current) {
      // Load from localStorage immediately
      const cached = getCartFromStorage(storeId);
      setCartItems(cached);
      initialized.current = true;
      
      // Only load from server if no other instance is loading AND not already loaded
      if (!globalCartLoading[storeId] && !globalCartLoaded[storeId]) {
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
        setCartItems(Array.isArray(newItems) ? newItems : []);
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
          setCartToStorage(data.items, storeId);
          setCartItems(data.items);
        } else {
          setCartToStorage([], storeId);
          setCartItems([]);
        }
        globalCartLoaded[storeId] = true;
      }
    } catch (error) {
      console.error('[useCart] Error loading cart from server:', error);
    } finally {
      setIsLoadingFromServer(false);
      loadingRef.current = false;
      globalCartLoading[storeId] = false;
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
          setCartToStorage(data.items, storeId);
          setCartItems(data.items);
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

  // ADD TO CART - Simple and reliable
  const addToCart = useCallback(async (item: CartItem): Promise<boolean> => {
    // Validations
    if (!item.variant_id || !item.product_id || !item.price || item.price < 0) {
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
    if (isAddingToCart) {
      return false;
    }

    setIsAddingToCart(true);

    try {
      // Read from localStorage (source of truth for client)
      const currentItems = getCartFromStorage(storeId);
      const existing = currentItems.find((i) => areItemsEqual(i, item));
      
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
      
      // Update localStorage and state immediately
      setCartToStorage(newItems, storeId);
      setCartItems(newItems);
      
      // Save to server
      await saveCartToServer(newItems);
      
      return true;
    } catch (error) {
      console.error('[useCart] Error adding to cart:', error);
      return false;
    } finally {
      setIsAddingToCart(false);
    }
  }, [storeId, saveCartToServer, areItemsEqual, isAddingToCart]);

  // REMOVE FROM CART
  const removeFromCart = useCallback((variantId: number) => {
    const currentItems = getCartFromStorage(storeId);
    
    // Don't remove gift products
    const itemToRemove = currentItems.find((i) => i.variant_id === variantId);
    const isGiftProduct = itemToRemove?.properties?.some(prop => prop.name === 'מתנה');
    
    if (isGiftProduct) {
      console.warn('[useCart] Cannot remove gift product');
      return;
    }
    
    const newItems = currentItems.filter((i) => i.variant_id !== variantId);
    setCartToStorage(newItems, storeId);
    setCartItems(newItems);
    
    if (storeId) {
      saveCartToServer(newItems);
    }
  }, [storeId, saveCartToServer]);

  // UPDATE QUANTITY
  const updateQuantity = useCallback(async (variantId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(variantId);
      return;
    }
    
    const currentItems = getCartFromStorage(storeId);
    const newItems = currentItems.map((i) => 
      i.variant_id === variantId ? { ...i, quantity } : i
    );
    
    setCartToStorage(newItems, storeId);
    setCartItems(newItems);
    
    if (storeId) {
      await saveCartToServer(newItems);
    }
  }, [storeId, saveCartToServer, removeFromCart]);

  // CLEAR CART
  const clearCart = useCallback(async () => {
    if (typeof window === 'undefined' || !storeId) return;
    
    const key = `${CART_STORAGE_KEY_PREFIX}${storeId}`;
    localStorage.removeItem(key);
    setCartItems([]);
    
    if (storeId) {
      await saveCartToServer([]);
    }
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
    updateQuantity,
    clearCart,
    getCartCount,
    getCartTotal,
    isLoading,
    isAddingToCart,
    isLoadingFromServer,
    refreshCart: loadCartFromServer,
  };
}
