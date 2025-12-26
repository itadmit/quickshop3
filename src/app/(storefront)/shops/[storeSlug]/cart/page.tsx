'use client';

import { useStoreId } from '@/hooks/useStoreId';
import { useParams } from 'next/navigation';
import { CartPageContent } from '@/components/storefront/CartPageContent';

export default function CartPage() {
  const params = useParams();
  const storeSlug = params.storeSlug as string;
  const storeId = useStoreId();

  if (!storeId) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <CartPageContent
      storeId={storeId}
      storeSlug={storeSlug}
      freeShippingThreshold={125}
    />
  );
}
