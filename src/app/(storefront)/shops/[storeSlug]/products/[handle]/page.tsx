import { notFound } from 'next/navigation';
import { ProductViewTracker } from '@/components/storefront/ProductViewTracker';
import { AdminEditBar } from '@/components/storefront/AdminEditBar';
import { getStoreIdBySlug, getStoreBySlug } from '@/lib/utils/store';
import { getProductByHandle } from '@/lib/storefront/queries';

// ============================================
// Product Page - All content rendered via CustomizerLayout
// ============================================

export const revalidate = 3600; // ISR - revalidate כל שעה

export default async function ProductPage({
  params,
}: {
  params: Promise<{ storeSlug: string; handle: string }>;
}) {
  const { storeSlug, handle } = await params;
  const storeId = await getStoreIdBySlug(storeSlug);
  
  if (!storeId) {
    notFound();
  }

  const store = await getStoreBySlug(storeSlug);
  if (!store) {
    notFound();
  }

  // טעינת מוצר לצורך ProductViewTracker
  const product = await getProductByHandle(handle, storeId);

  if (!product) {
    notFound();
  }

  const defaultVariant = product.variants[0];

  // כל התוכן מוצג דרך CustomizerLayout - רק ProductViewTracker כאן
  return (
    <>
      <ProductViewTracker
        productId={product.id}
        productTitle={product.title}
        price={defaultVariant.price}
      />
      <AdminEditBar
        productId={product.id}
        productHandle={handle}
        storeSlug={storeSlug}
        storeId={storeId}
        pageType="product"
      />
    </>
  );
}

