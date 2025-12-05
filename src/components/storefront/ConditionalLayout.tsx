'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { StorefrontHeader } from './StorefrontHeader';
import { StorefrontFooter } from './StorefrontFooter';

interface ConditionalLayoutProps {
  children: ReactNode;
  storeName: string;
  collections: Array<{
    id: number;
    title: string;
    handle: string;
  }>;
}

/**
 * Layout מותנה - מציג Header ו-Footer רק אם לא בצ'ק אאוט
 */
export function ConditionalLayout({ children, storeName, collections }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isCheckout = pathname?.includes('/checkout');

  if (isCheckout) {
    // בצ'ק אאוט - רק התוכן
    return <>{children}</>;
  }

  // בשאר הדפים - Header + Content + Footer
  return (
    <>
      <StorefrontHeader 
        storeName={storeName} 
        collections={collections.map(c => ({ id: c.id, name: c.title, handle: c.handle }))} 
      />
      <main className="flex-1">{children}</main>
      <StorefrontFooter />
    </>
  );
}

