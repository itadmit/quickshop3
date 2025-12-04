import { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { StorefrontHeader } from '@/components/storefront/StorefrontHeader';
import { StorefrontFooter } from '@/components/storefront/StorefrontFooter';
import { getStoreBySlug } from '@/lib/utils/store';

export default async function StoreSlugLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  
  // טעינת פרטי החנות לפי slug
  const store = await getStoreBySlug(storeSlug);

  if (!store) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <StorefrontHeader storeName={store.name} />
      <main className="flex-1">{children}</main>
      <StorefrontFooter />
    </div>
  );
}

