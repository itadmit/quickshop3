'use client';

import { useState, useCallback, useEffect, useSyncExternalStore } from 'react';
import { useStoreId } from './useStoreId';

export interface WishlistItem {
  id: number;
  product_id: number;
  variant_id?: number;
  product_title: string;
  product_handle: string;
  price: number;
  compare_price?: number;
  image?: string;
  created_at: string;
}

// Local storage item for guests
interface LocalWishlistItem {
  product_id: number;
  added_at: string;
}

/**
 * Wishlist Management Hook - Global State with Listeners
 * ניהול רשימת משאלות עם סנכרון לשרת (למחוברים) או localStorage (לאורחים)
 */

const WISHLIST_STORAGE_KEY_PREFIX = 'quickshop_wishlist_store_';
const WISHLIST_LOCAL_KEY_PREFIX = 'quickshop_wishlist_local_';

// ============================================
// GLOBAL STATE
// ============================================

const globalWishlistItems: { [storeId: number]: WishlistItem[] } = {};
const globalWishlistLoading: { [storeId: number]: boolean } = {};
const globalWishlistLoaded: { [storeId: number]: boolean } = {};
const globalIsLoggedIn: { [storeId: number]: boolean } = {};

let wishlistListeners: Array<() => void> = [];
let wishlistVersion = 0;

function subscribeToWishlist(callback: () => void) {
  wishlistListeners.push(callback);
  return () => {
    wishlistListeners = wishlistListeners.filter(l => l !== callback);
  };
}

function getWishlistSnapshot() {
  return wishlistVersion;
}

function notifyWishlistListeners() {
  wishlistVersion++;
  wishlistListeners.forEach(l => l());
}

// ============================================
// STORAGE HELPERS
// ============================================

function getLocalWishlist(storeId: number | null): LocalWishlistItem[] {
  if (typeof window === 'undefined' || !storeId) return [];
  
  try {
    const key = `${WISHLIST_LOCAL_KEY_PREFIX}${storeId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('[useWishlist] Failed to parse local wishlist from localStorage', e);
  }
  
  return [];
}

function setLocalWishlist(items: LocalWishlistItem[], storeId: number | null): void {
  if (typeof window === 'undefined' || !storeId) return;
  
  try {
    const key = `${WISHLIST_LOCAL_KEY_PREFIX}${storeId}`;
    localStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.error('[useWishlist] Error saving to localStorage:', error);
  }
}

function setWishlistToStorage(productIds: number[], storeId: number | null): void {
  if (typeof window === 'undefined' || !storeId) return;
  
  try {
    const key = `${WISHLIST_STORAGE_KEY_PREFIX}${storeId}`;
    localStorage.setItem(key, JSON.stringify(productIds));
  } catch (error) {
    console.error('[useWishlist] Error saving to localStorage:', error);
  }
}

// ============================================
// MAIN HOOK
// ============================================

export function useWishlist() {
  const storeId = useStoreId();
  
  // Subscribe to global wishlist changes
  useSyncExternalStore(subscribeToWishlist, getWishlistSnapshot, getWishlistSnapshot);
  
  // Get wishlist items from global state
  const wishlistItems = storeId ? (globalWishlistItems[storeId] || []) : [];
  const isLoading = storeId ? (globalWishlistLoading[storeId] || false) : false;
  const isLoggedIn = storeId ? (globalIsLoggedIn[storeId] || false) : false;
  
  // Initialize wishlist on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && storeId && !globalWishlistLoaded[storeId]) {
      loadWishlist();
    } else if (typeof window !== 'undefined' && storeId && globalWishlistLoaded[storeId]) {
      // ✅ גם אם כבר טענו, נוודא שיש סנכרון עם localStorage
      const localItems = getLocalWishlist(storeId);
      if (localItems.length > 0 && (!globalWishlistItems[storeId] || globalWishlistItems[storeId].length === 0)) {
        // יש פריטים ב-localStorage אבל לא ב-global state - צריך לטעון
        loadWishlist();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  // Load wishlist (from server for logged in, from localStorage for guests)
  const loadWishlist = useCallback(async () => {
    if (!storeId || globalWishlistLoading[storeId]) return;

    globalWishlistLoading[storeId] = true;
    notifyWishlistListeners();
    
    try {
      // Try to load from server (will return items if logged in, empty if guest)
      const response = await fetch(`/api/storefront/wishlist?storeId=${storeId}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.isLoggedIn && data.items && Array.isArray(data.items)) {
          // User is logged in - use server data
          globalIsLoggedIn[storeId] = true;
          globalWishlistItems[storeId] = data.items;
          setWishlistToStorage(data.items.map((i: WishlistItem) => i.product_id), storeId);
        } else {
          // Guest - load from localStorage and fetch product details
          globalIsLoggedIn[storeId] = false;
          const localItems = getLocalWishlist(storeId);
          
          if (localItems.length > 0) {
            // Fetch product details for local items
            const productIds = localItems.map(i => i.product_id);
            const detailsResponse = await fetch(`/api/storefront/wishlist/details?storeId=${storeId}&productIds=${productIds.join(',')}`);
            
            if (detailsResponse.ok) {
              const detailsData = await detailsResponse.json();
              globalWishlistItems[storeId] = detailsData.items || [];
            } else {
              globalWishlistItems[storeId] = [];
            }
          } else {
            globalWishlistItems[storeId] = [];
          }
        }
        globalWishlistLoaded[storeId] = true;
      }
    } catch (error) {
      console.error('[useWishlist] Error loading wishlist:', error);
      // Fallback to local storage for guests
      globalIsLoggedIn[storeId] = false;
      globalWishlistItems[storeId] = [];
    } finally {
      globalWishlistLoading[storeId] = false;
      notifyWishlistListeners();
    }
  }, [storeId]);

  // Check if product is in wishlist
  const isInWishlist = useCallback((productId: number): boolean => {
    if (!storeId) return false;
    
    // Check global state first
    if (wishlistItems.some(item => item.product_id === productId)) {
      return true;
    }
    
    // For guests, also check localStorage directly
    if (!globalIsLoggedIn[storeId]) {
      const localItems = getLocalWishlist(storeId);
      return localItems.some(item => item.product_id === productId);
    }
    
    return false;
  }, [storeId, wishlistItems]);

  // Toggle wishlist (add/remove)
  const toggleWishlist = useCallback(async (productId: number): Promise<boolean> => {
    if (!storeId) return false;

    const isCurrentlyInWishlist = isInWishlist(productId);
    
    try {
      if (globalIsLoggedIn[storeId]) {
        // Logged in user - sync with server
        if (isCurrentlyInWishlist) {
          const response = await fetch(`/api/storefront/wishlist/${productId}?storeId=${storeId}`, {
            method: 'DELETE',
            credentials: 'include',
          });

          if (response.ok) {
            globalWishlistItems[storeId] = wishlistItems.filter(i => i.product_id !== productId);
            setWishlistToStorage(globalWishlistItems[storeId].map(i => i.product_id), storeId);
            notifyWishlistListeners();
            return true;
          }
        } else {
          const response = await fetch('/api/storefront/wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ productId, storeId }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.item) {
              globalWishlistItems[storeId] = [...wishlistItems, data.item];
              setWishlistToStorage(globalWishlistItems[storeId].map(i => i.product_id), storeId);
              notifyWishlistListeners();
            }
            return true;
          }
        }
      } else {
        // Guest - use localStorage only
        const localItems = getLocalWishlist(storeId);
        
        if (isCurrentlyInWishlist) {
          // Remove from localStorage
          const newLocalItems = localItems.filter(i => i.product_id !== productId);
          setLocalWishlist(newLocalItems, storeId);
          globalWishlistItems[storeId] = wishlistItems.filter(i => i.product_id !== productId);
          notifyWishlistListeners();
          return true;
        } else {
          // Add to localStorage
          const newItem: LocalWishlistItem = {
            product_id: productId,
            added_at: new Date().toISOString(),
          };
          const newLocalItems = [...localItems, newItem];
          setLocalWishlist(newLocalItems, storeId);
          
          // ✅ עדכון מיידי של המונה (עם placeholder)
          const placeholderItem: WishlistItem = {
            id: Date.now(), // temporary ID
            product_id: productId,
            product_title: 'טוען...',
            product_handle: '',
            price: 0,
            created_at: new Date().toISOString(),
          };
          globalWishlistItems[storeId] = [...wishlistItems, placeholderItem];
          notifyWishlistListeners();
          
          // Fetch product details to update UI
          try {
            const detailsResponse = await fetch(`/api/storefront/wishlist/details?storeId=${storeId}&productIds=${productId}`);
            if (detailsResponse.ok) {
              const detailsData = await detailsResponse.json();
              if (detailsData.items && detailsData.items.length > 0) {
                // ✅ החלפת ה-placeholder בנתונים אמיתיים
                globalWishlistItems[storeId] = globalWishlistItems[storeId].map(item => 
                  item.product_id === productId ? detailsData.items[0] : item
                );
                notifyWishlistListeners();
              }
            }
          } catch (e) {
            console.error('[useWishlist] Error fetching product details:', e);
            // גם אם יש שגיאה, הפריט כבר נוסף ל-localStorage והמונה מתעדכן
          }
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('[useWishlist] Error toggling wishlist:', error);
      return false;
    }
  }, [storeId, wishlistItems, isInWishlist]);

  // Add to wishlist
  const addToWishlist = useCallback(async (productId: number): Promise<boolean> => {
    if (isInWishlist(productId)) return true;
    return toggleWishlist(productId);
  }, [isInWishlist, toggleWishlist]);

  // Remove from wishlist
  const removeFromWishlist = useCallback(async (productId: number): Promise<boolean> => {
    if (!isInWishlist(productId)) return true;
    return toggleWishlist(productId);
  }, [isInWishlist, toggleWishlist]);

  // Get wishlist count
  const getWishlistCount = useCallback(() => {
    if (!storeId) return 0;
    
    // For guests, count from localStorage
    if (!globalIsLoggedIn[storeId]) {
      const localItems = getLocalWishlist(storeId);
      return localItems.length;
    }
    
    return wishlistItems.length;
  }, [storeId, wishlistItems]);

  return {
    wishlistItems,
    isLoading,
    isLoggedIn,
    isInWishlist,
    toggleWishlist,
    addToWishlist,
    removeFromWishlist,
    getWishlistCount,
    refreshWishlist: loadWishlist,
  };
}

