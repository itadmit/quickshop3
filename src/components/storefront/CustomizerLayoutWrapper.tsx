/**
 * Customizer Layout Wrapper
 * מזהה את pageType מה-URL ומעביר אותו ל-CustomizerLayoutClient
 * Client Component שמתעדכן בזמן client-side navigation
 */

'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { CustomizerLayoutClient } from './CustomizerLayoutClient';

interface CustomizerLayoutWrapperProps {
  storeSlug: string;
  children: React.ReactNode;
}

function getPageTypeFromPath(pathname: string, storeSlug: string): { pageType: string; pageHandle?: string } {
  // הסרת storeSlug מה-path
  const pathWithoutStore = pathname.replace(`/shops/${storeSlug}`, '');
  
  // דף בית
  if (pathWithoutStore === '' || pathWithoutStore === '/') {
    return { pageType: 'home' };
  }
  
  // דף קטגוריה
  if (pathWithoutStore.startsWith('/categories/')) {
    const match = pathWithoutStore.match(/^\/categories\/([^/?]+)/);
    if (match) {
      return { pageType: 'category', pageHandle: match[1] };
    }
    return { pageType: 'categories' };
  }
  
  // דף מוצרים
  if (pathWithoutStore.startsWith('/products')) {
    const match = pathWithoutStore.match(/^\/products\/([^/?]+)/);
    if (match) {
      return { pageType: 'product', pageHandle: match[1] };
    }
    return { pageType: 'products' };
  }
  
  // דף תוכן
  if (pathWithoutStore.startsWith('/p/')) {
    const match = pathWithoutStore.match(/^\/p\/([^/]+)/);
    if (match) {
      return { pageType: 'page', pageHandle: match[1] };
    }
  }
  
  // דף בלוג
  if (pathWithoutStore.startsWith('/blog')) {
    const match = pathWithoutStore.match(/^\/blog\/([^/]+)/);
    if (match) {
      return { pageType: 'blog_post', pageHandle: match[1] };
    }
    return { pageType: 'blog' };
  }
  
  // דף wishlist
  if (pathWithoutStore === '/wishlist' || pathWithoutStore.startsWith('/wishlist/')) {
    return { pageType: 'other' };
  }
  
  // דף account
  if (pathWithoutStore === '/account' || pathWithoutStore.startsWith('/account')) {
    return { pageType: 'other' };
  }
  
  // דף cart
  if (pathWithoutStore === '/cart' || pathWithoutStore.startsWith('/cart/')) {
    return { pageType: 'other' };
  }
  
  // דפים אחרים - לא מציגים content sections מהקסטומייזר
  return { pageType: 'other' };
}

export function CustomizerLayoutWrapper({
  storeSlug,
  children,
}: CustomizerLayoutWrapperProps) {
  const pathname = usePathname();
  
  // זיהוי pageType מה-pathname (מתעדכן בזמן client-side navigation)
  const { pageType, pageHandle } = getPageTypeFromPath(pathname, storeSlug);
  
  // דפי צ'ק אאוט ותודה - לא מציגים הדר ופוטר
  const pathWithoutStore = pathname.replace(`/shops/${storeSlug}`, '');
  const isCheckoutPage = pathWithoutStore.startsWith('/checkout');
  
  if (isCheckoutPage) {
    // בצ'ק אאוט - להחזיר רק את התוכן ללא הדר ופוטר
    return <>{children}</>;
  }
  
  return (
    <CustomizerLayoutClient 
      storeSlug={storeSlug}
      pageType={pageType}
      pageHandle={pageHandle}
    >
      {children}
    </CustomizerLayoutClient>
  );
}
