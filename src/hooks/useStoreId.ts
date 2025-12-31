'use client';

import { useParams, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const CART_STORE_ID_KEY = 'quickshop_cart_store_id';
const CART_STORE_SLUG_KEY = 'quickshop_cart_store_slug';

/**
 * Hook לקבלת storeId מה-URL או מה-session
 * בקסטומייזר: טוען מה-session של המשתמש
 * בפרונט: טוען מה-URL/localStorage
 */
export function useStoreId(): number | null {
  const params = useParams();
  const pathname = usePathname();
  const storeSlug = params?.storeSlug as string | undefined;
  const isCustomizer = pathname?.startsWith('/customize');
  
  // Initialize from localStorage immediately (synchronous)
  const [storeId, setStoreId] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    
    // If we have a slug, check if it matches localStorage
    if (storeSlug) {
      const storedSlug = localStorage.getItem(CART_STORE_SLUG_KEY);
      const storedId = localStorage.getItem(CART_STORE_ID_KEY);
      if (storedSlug === storeSlug && storedId) {
        return parseInt(storedId);
      }
    }
    
    // Don't use fallback - return null and load from API
    return null;
  });

  useEffect(() => {
    // ✅ בקסטומייזר או בדשבורד: תמיד טוען מה-session של המשתמש
    const isDashboard = pathname && (
      pathname.startsWith('/categories') || 
      pathname.startsWith('/products') || 
      pathname.startsWith('/orders') ||
      pathname.startsWith('/analytics') ||
      pathname.startsWith('/settings') ||
      pathname.startsWith('/customize') ||
      pathname.startsWith('/collections')
    );
    
    if (isCustomizer || isDashboard) {
      // בדוק אם כבר יש storeId ב-localStorage (טעינה מיידית)
      if (typeof window !== 'undefined') {
        const storedId = localStorage.getItem(CART_STORE_ID_KEY);
        if (storedId) {
          const parsedId = parseInt(storedId);
          if (!isNaN(parsedId)) {
            setStoreId(parsedId);
          }
        }
      }
      
      // טעינה מה-session (עדכון אם שונה)
      fetch('/api/auth/me', {
        credentials: 'include',
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Failed to get user');
        })
        .then((data) => {
          if (data.store?.id) {
            setStoreId(data.store.id);
            if (typeof window !== 'undefined') {
              localStorage.setItem(CART_STORE_ID_KEY, String(data.store.id));
            }
          }
        })
        .catch((error) => {
          console.error('Error loading storeId from session:', error);
          // Don't set to null if we already have a storedId
          if (typeof window === 'undefined' || !localStorage.getItem(CART_STORE_ID_KEY)) {
            setStoreId(null);
          }
        });
      return;
    }

    // בפרונט: טוען מה-URL/localStorage
    if (!storeSlug) return;

    // Check if we already have the correct storeId
    if (typeof window !== 'undefined') {
      const storedSlug = localStorage.getItem(CART_STORE_SLUG_KEY);
      const storedId = localStorage.getItem(CART_STORE_ID_KEY);
      
      if (storedSlug === storeSlug && storedId) {
        setStoreId(parseInt(storedId));
        return;
      }
    }

    // Get store ID from API
    fetch(`/api/stores/${storeSlug}/id`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Failed to get store ID');
      })
      .then((data) => {
        if (data.storeId) {
          setStoreId(data.storeId);
          if (typeof window !== 'undefined') {
            localStorage.setItem(CART_STORE_ID_KEY, String(data.storeId));
            localStorage.setItem(CART_STORE_SLUG_KEY, storeSlug);
          }
        }
      })
      .catch((error) => {
        console.error('Error loading storeId from slug:', error);
        setStoreId(null);
      });
  }, [storeSlug, isCustomizer, pathname]);

  return storeId;
}
