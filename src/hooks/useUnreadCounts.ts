'use client';

import { useState, useEffect, useCallback } from 'react';

// Global cache to prevent duplicate API calls
let globalCache = {
  notifications: 0,
  orders: 0,
  returns: 0, // ✅ הוספת ספירת החזרות ממתינות
  lastFetched: 0,
  isFetching: false,
  subscribers: new Set<() => void>(),
};

const CACHE_DURATION = 30000; // 30 seconds

export function useUnreadCounts() {
  const [notificationsCount, setNotificationsCount] = useState(globalCache.notifications);
  const [ordersCount, setOrdersCount] = useState(globalCache.orders);
  const [returnsCount, setReturnsCount] = useState(globalCache.returns); // ✅ הוספת state לספירת החזרות

  const updateFromCache = useCallback(() => {
    setNotificationsCount(globalCache.notifications);
    setOrdersCount(globalCache.orders);
    setReturnsCount(globalCache.returns); // ✅ עדכון state
  }, []);

  const fetchCounts = useCallback(async (force = false) => {
    const now = Date.now();
    
    // Don't fetch if already fetching
    if (globalCache.isFetching) return;
    
    // Don't fetch if cached and not forced
    if (!force && globalCache.lastFetched > 0 && now - globalCache.lastFetched < CACHE_DURATION) {
      updateFromCache();
      return;
    }

    globalCache.isFetching = true;

    try {
      const [notifRes, ordersRes, returnsRes] = await Promise.all([
        fetch('/api/notifications/unread-count', { credentials: 'include' }),
        fetch('/api/orders/unread-count', { credentials: 'include' }),
        fetch('/api/returns/pending-count', { credentials: 'include' }), // ✅ הוספת קריאה לספירת החזרות
      ]);

      if (notifRes.ok) {
        const data = await notifRes.json();
        globalCache.notifications = data.count || 0;
      }

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        globalCache.orders = data.count || 0;
      }

      if (returnsRes.ok) {
        const data = await returnsRes.json();
        globalCache.returns = data.count || 0; // ✅ עדכון cache
      }

      globalCache.lastFetched = Date.now();
      
      // Notify all subscribers
      globalCache.subscribers.forEach(cb => cb());
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    } finally {
      globalCache.isFetching = false;
    }
  }, [updateFromCache]);

  useEffect(() => {
    // Subscribe to updates
    globalCache.subscribers.add(updateFromCache);
    
    // Initial fetch only - no automatic refresh interval
    fetchCounts();
    
    return () => {
      globalCache.subscribers.delete(updateFromCache);
    };
  }, [fetchCounts, updateFromCache]);

  const refreshCounts = useCallback(() => {
    fetchCounts(true);
  }, [fetchCounts]);

  return {
    notificationsCount,
    ordersCount,
    returnsCount, // ✅ הוספת returnsCount ל-return
    refreshCounts,
  };
}
