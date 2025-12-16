'use client';

import { useState, useEffect, useRef } from 'react';

// Global state לפתיחת העגלה (Quickshop)
let cartOpenListeners: Array<() => void> = [];
let isCartOpen = false;
let lastOpenTime = 0;
const OPEN_DEBOUNCE_MS = 500; // מניעת פתיחות כפולות תוך 500ms

export function useCartOpen() {
  const [open, setOpen] = useState(isCartOpen);
  const openingRef = useRef(false);

  useEffect(() => {
    const listener = () => setOpen(isCartOpen);
    cartOpenListeners.push(listener);
    
    return () => {
      cartOpenListeners = cartOpenListeners.filter(l => l !== listener);
    };
  }, []);

  const openCart = () => {
    const now = Date.now();
    
    // מניעת פתיחות כפולות תוך זמן קצר
    if (openingRef.current || (now - lastOpenTime < OPEN_DEBOUNCE_MS)) {
      return;
    }
    
    openingRef.current = true;
    lastOpenTime = now;
    isCartOpen = true;
    cartOpenListeners.forEach(l => l());
    
    // Reset after debounce period
    setTimeout(() => {
      openingRef.current = false;
    }, OPEN_DEBOUNCE_MS);
  };

  const closeCart = () => {
    isCartOpen = false;
    cartOpenListeners.forEach(l => l());
    openingRef.current = false;
  };

  return { isOpen: open, openCart, closeCart };
}

