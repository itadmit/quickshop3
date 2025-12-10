/**
 * Customizer Layout Wrapper
 * מזהה את pageType מה-URL ומעביר אותו ל-CustomizerLayout
 */

import { headers } from 'next/headers';
import { CustomizerLayout } from './CustomizerLayout';

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
      return { pageType: 'product', pageHandle: match[1] };
    }
    return { pageType: 'products' };
  }
  
  // דף קטגוריה
  if (pathWithoutStore.startsWith('/categories/')) {
    const match = pathWithoutStore.match(/^\/categories\/([^/]+)/);
    if (match) {
      return { pageType: 'category', pageHandle: match[1] };
    }
    return { pageType: 'categories' };
  }
  
  // דף תוכן
  if (pathWithoutStore.startsWith('/p/')) {
    const match = pathWithoutStore.match(/^\/p\/([^/]+)/);
    if (match) {
      return { pageType: 'page', pageHandle: match[1] };
    }
  }
  
  // דף בלוג
  if (pathWithoutStore.startsWith('/blog/')) {
    const match = pathWithoutStore.match(/^\/blog\/([^/]+)/);
    if (match) {
      return { pageType: 'blog_post', pageHandle: match[1] };
    }
    return { pageType: 'blog' };
  }
  
  // דפים אחרים - לא מציגים content sections מהקסטומייזר
  return { pageType: 'other' };
}

export async function CustomizerLayoutWrapper({
  storeSlug,
  children,
}: CustomizerLayoutWrapperProps) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  
  // זיהוי pageType מה-pathname
  const { pageType, pageHandle } = getPageTypeFromPath(pathname);
  
  // Debug log (רק בפיתוח)
  if (process.env.NODE_ENV === 'development') {
    console.log('[CustomizerLayoutWrapper] Pathname:', pathname, 'PageType:', pageType, 'PageHandle:', pageHandle);
  }
  
  return (
    <CustomizerLayout 
      storeSlug={storeSlug}
      pageType={pageType}
      pageHandle={pageHandle}
    >
      {children}
    </CustomizerLayout>
  );
}

