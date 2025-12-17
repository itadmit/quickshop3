/**
 * Customizer Layout Wrapper - Client-Side Version
 * מזהה את pageType מה-URL בצד הלקוח לעדכון בזמן אמת בניווט
 */

'use client';

import { usePathname } from 'next/navigation';
import { CustomizerLayoutClient } from './CustomizerLayoutClient';

interface CustomizerLayoutWrapperProps {
  storeSlug: string;
  children: React.ReactNode;
}

function getPageTypeFromPath(pathname: string): { pageType: string; pageHandle?: string } {
  // הסרת storeSlug מה-path
  const pathWithoutStore = pathname.replace(/^\/shops\/[^/]+/, '');
  
  // דף בית
  if (pathWithoutStore === '' || pathWithoutStore === '/') {
    return { pageType: 'home' };
  }
  
  // דף מוצר
  if (pathWithoutStore.startsWith('/products/')) {
    const match = pathWithoutStore.match(/^\/products\/([^/]+)/);
    if (match) {
      return { pageType: 'product', pageHandle: decodeURIComponent(match[1]) };
    }
    return { pageType: 'products' };
  }
  
  // דף קטגוריה
  if (pathWithoutStore.startsWith('/categories/')) {
    const match = pathWithoutStore.match(/^\/categories\/([^/]+)/);
    if (match) {
      return { pageType: 'collection', pageHandle: decodeURIComponent(match[1]) };
    }
    return { pageType: 'collections' };
  }
  
  // דף תוכן
  if (pathWithoutStore.startsWith('/p/')) {
    const match = pathWithoutStore.match(/^\/p\/([^/]+)/);
    if (match) {
      return { pageType: 'page', pageHandle: decodeURIComponent(match[1]) };
    }
  }
  
  // דף בלוג
  if (pathWithoutStore.startsWith('/blog/')) {
    const match = pathWithoutStore.match(/^\/blog\/([^/]+)/);
    if (match) {
      return { pageType: 'blog_post', pageHandle: decodeURIComponent(match[1]) };
    }
    return { pageType: 'blog' };
  }
  
  // דפים אחרים - לא מציגים content sections מהקסטומייזר
  return { pageType: 'other' };
}

export function CustomizerLayoutWrapper({
  storeSlug,
  children,
}: CustomizerLayoutWrapperProps) {
  // שימוש ב-usePathname לזיהוי ה-URL בצד הלקוח
  // זה מתעדכן אוטומטית בניווט client-side
  const pathname = usePathname();
  
  // זיהוי pageType מה-pathname
  const { pageType, pageHandle } = getPageTypeFromPath(pathname || '');
  
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
