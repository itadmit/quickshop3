'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const CART_STORE_ID_KEY = 'quickshop_cart_store_id';
const CART_STORE_SLUG_KEY = 'quickshop_cart_store_slug';

/**
 * Hook לקבלת storeId מה-URL
 * פשוט כמו Shopify: מיידי מ-localStorage, אסינכרוני מ-API
 */
export function useStoreId(): number | null {
  const params = useParams();
  const storeSlug = params?.storeSlug as string | undefined;
  
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
    
    // Fallback to stored ID or default
    const stored = localStorage.getItem(CART_STORE_ID_KEY);
    return stored ? parseInt(stored) : 1;
  });

  useEffect(() => {
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
      .catch(() => {
        // Fallback to default
        setStoreId(1);
      });
  }, [storeSlug]);

  return storeId;
}
