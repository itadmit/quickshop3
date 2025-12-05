'use client';

import { useState, useEffect, useCallback } from 'react';
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

// Shopify-style cart: Server-side storage with localStorage fallback
// Shopify behavior:
// 1. Cart loads from localStorage on mount (fast, no server call)
// 2. Cart loads from server only when opened (lazy loading)
// 3. All operations sync to server immediately
// 4. Optimistic updates for instant UI feedback
// Helper function to load cart from localStorage synchronously
function loadCartFromLocalStorage(): CartItem[] {
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
    console.error('Failed to parse cart from localStorage', e);
  }
  
  return [];
}

export function useCart() {
  // טעינה מיידית מ-localStorage בטעינה ראשונית (synchronous)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => loadCartFromLocalStorage());
  const [isLoading, setIsLoading] = useState(false); // לא טוען מהשרת בטעינה ראשונית
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isLoadingFromServer, setIsLoadingFromServer] = useState(false);
  const storeId = useStoreId(); // Get from URL (Shopify-style)

  // Load cart from server (Shopify-style - only when needed, e.g., when cart opens)
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
          setCartItems(data.items);
          // Sync to localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(data.items));
          }
        }
      }
    } catch (error) {
      console.error('[useCart] Error loading cart from server:', error);
    } finally {
      setIsLoadingFromServer(false);
    }
  }, [storeId]);

  // Save cart to server (Shopify-style - immediate sync)
  const saveCartToServer = useCallback(async (items: CartItem[]) => {
    if (!storeId) {
      throw new Error('storeId is missing');
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
      throw error;
    }
  }, [storeId]);

  // Save to localStorage on every cart change (Shopify-style - immediate sync)
  useEffect(() => {
    if (typeof window !== 'undefined' && cartItems.length >= 0) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    }
  }, [cartItems]);

  const addToCart = useCallback(async (item: CartItem) => {
    // בדיקת תקינות פריט לפני הוספה
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

    // מניעת duplicate calls
    if (isAddingToCart) {
      return;
    }

    setIsAddingToCart(true);

    // Shopify-style: Optimistic update - עדכון מיד ב-UI
    setCartItems((prev) => {
      const existing = prev.find((i) => i.variant_id === item.variant_id);
      
      let newItems: CartItem[];
      if (existing) {
        newItems = prev.map((i) =>
          i.variant_id === item.variant_id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      } else {
        newItems = [...prev, item];
      }
      
      // שמירה מיד ל-localStorage (Shopify-style)
      if (typeof window !== 'undefined') {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));
      }
      
      // שמירה לשרת ברקע (Shopify-style - לא חוסם את ה-UI)
      if (newItems.length > 0) {
        saveCartToServer(newItems)
          .catch((error) => {
            console.error('[useCart] Error saving cart to server:', error);
            // במקרה של שגיאה, נסה לטעון מהשרת
            loadCartFromServer();
          })
          .finally(() => {
            setIsAddingToCart(false);
          });
      } else {
        setIsAddingToCart(false);
      }
      
      return newItems;
    });
  }, [storeId, saveCartToServer, loadCartFromServer, isAddingToCart]);

  const removeFromCart = useCallback((variantId: number) => {
    // Shopify-style: Optimistic update
    setCartItems((prev) => {
      const newItems = prev.filter((i) => i.variant_id !== variantId);
      
      // שמירה מיד ל-localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));
      }
      
      // שמירה לשרת ברקע
      saveCartToServer(newItems).catch((error) => {
        console.error('Error saving cart to server:', error);
        loadCartFromServer();
      });
      
      return newItems;
    });
  }, [saveCartToServer, loadCartFromServer]);

  const updateQuantity = useCallback((variantId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(variantId);
      return;
    }
    
    // Shopify-style: Optimistic update
    setCartItems((prev) => {
      const newItems = prev.map((i) => 
        i.variant_id === variantId ? { ...i, quantity } : i
      );
      
      // שמירה מיד ל-localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));
      }
      
      // שמירה לשרת ברקע
      saveCartToServer(newItems).catch((error) => {
        console.error('Error saving cart to server:', error);
        loadCartFromServer();
      });
      
      return newItems;
    });
  }, [removeFromCart, saveCartToServer, loadCartFromServer]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    // Clear from server
    if (storeId) {
      fetch(`/api/cart?storeId=${storeId}`, {
        method: 'DELETE',
        credentials: 'include',
      }).catch(console.error);
    }
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, [storeId]);

  const getCartCount = useCallback(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  // הסרת getCartTotal - חישוב ידני אסור!
  // במקום זה, השתמש ב-useCartCalculator.getTotal()
  // SINGLE SOURCE OF TRUTH - כל החישובים דרך המנוע המרכזי

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
    refreshCart: loadCartFromServer, // Shopify-style: טעינה מהשרת רק כשצריך
  };
}
