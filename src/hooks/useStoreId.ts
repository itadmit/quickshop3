'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const CART_STORE_ID_KEY = 'quickshop_cart_store_id';
const CART_STORE_SLUG_KEY = 'quickshop_cart_store_slug';

/**
 * Hook לקבלת storeId מה-URL
 * Shopify-style: storeId נקבע לפי storeSlug מה-URL
 * משתמש ב-API endpoint במקום server function ישיר
 */
export function useStoreId(): number | null {
  const params = useParams();
  const storeSlug = params?.storeSlug as string | undefined;
  const [storeId, setStoreId] = useState<number | null>(null);

  useEffect(() => {
    if (!storeSlug) {
      // Fallback to localStorage
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(CART_STORE_ID_KEY);
        if (stored) {
          setStoreId(parseInt(stored));
        } else {
          // Default to 1
          setStoreId(1);
        }
      }
      return;
    }

    // Check if we already have the storeId for this slug
    if (typeof window !== 'undefined') {
      const storedSlug = localStorage.getItem(CART_STORE_SLUG_KEY);
      const storedId = localStorage.getItem(CART_STORE_ID_KEY);
      
      if (storedSlug === storeSlug && storedId) {
        setStoreId(parseInt(storedId));
        return;
      }
    }

    // Get store ID from API (client-side)
    fetch(`/api/stores/${storeSlug}/id`)
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        throw new Error('Failed to get store ID');
      })
      .then((data) => {
        if (data.storeId) {
          setStoreId(data.storeId);
          // Save to localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem(CART_STORE_ID_KEY, String(data.storeId));
            localStorage.setItem(CART_STORE_SLUG_KEY, storeSlug);
          }
        }
      })
      .catch(() => {
        // Fallback to localStorage
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem(CART_STORE_ID_KEY);
          if (stored) {
            setStoreId(parseInt(stored));
          } else {
            // Default to 1
            setStoreId(1);
          }
        }
      });
  }, [storeSlug]);

  return storeId;
}
