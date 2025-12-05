'use client';

import { useState, useEffect } from 'react';

// Global state לפתיחת העגלה (Shopify-style)
let cartOpenListeners: Array<() => void> = [];
let isCartOpen = false;

export function useCartOpen() {
  const [open, setOpen] = useState(isCartOpen);

  useEffect(() => {
    const listener = () => setOpen(isCartOpen);
    cartOpenListeners.push(listener);
    
    return () => {
      cartOpenListeners = cartOpenListeners.filter(l => l !== listener);
    };
  }, []);

  const openCart = () => {
    isCartOpen = true;
    cartOpenListeners.forEach(l => l());
  };

  const closeCart = () => {
    isCartOpen = false;
    cartOpenListeners.forEach(l => l());
  };

  return { isOpen: open, openCart, closeCart };
}

