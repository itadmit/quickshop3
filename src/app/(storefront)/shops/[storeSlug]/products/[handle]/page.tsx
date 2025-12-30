import { notFound } from 'next/navigation';
import { ProductViewTracker } from '@/components/storefront/ProductViewTracker';
import { AdminEditBar } from '@/components/storefront/AdminEditBar';
import { PageContent } from '@/components/storefront/PageContent';
import { getStoreIdBySlug, getStoreBySlug } from '@/lib/utils/store';
import { getProductByHandle } from '@/lib/storefront/queries';

// ============================================
// Product Page - Content rendered via PageContent
// ✅ הדר/פוטר ב-layout - לא נטענים מחדש בניווט
// ============================================

export const revalidate = 3600; // ISR - revalidate כל שעה

export default async function ProductPage({
  params,
}: {
  params: Promise<{ storeSlug: string; handle: string }>;
}) {
  const startTime = Date.now();
  const { storeSlug, handle } = await params;
  console.log(`📄 [ProductPage] Starting load for ${storeSlug}/products/${handle}`);
  const storeId = await getStoreIdBySlug(storeSlug);
  
  if (!storeId) {
    notFound();
  }

  const store = await getStoreBySlug(storeSlug);
  if (!store) {
    notFound();
  }

  // טעינת מוצר לצורך ProductViewTracker
  const productLoadStart = Date.now();
  const product = await getProductByHandle(handle, storeId);
  console.log(`🛍️ [ProductPage] Product loaded in ${Date.now() - productLoadStart}ms: ${product?.title || 'N/A'}`);

  if (!product) {
    console.error(`❌ [ProductPage] Product not found: ${handle}`);
    notFound();
  }

  const defaultVariant = product.variants[0];
  console.log(`✅ [ProductPage] Page ready in ${Date.now() - startTime}ms`);

  // ✅ דף מוצר - רק התוכן נטען כאן
  // הדר/פוטר נטענים פעם אחת ב-layout (לא נטענים מחדש בניווט!)
  return (
    <>
      <ProductViewTracker
        productId={product.id}
        productTitle={product.title}
        price={defaultVariant.price}
      />
      <PageContent
        storeSlug={storeSlug}
        storeId={storeId}
        pageType="product"
        pageHandle={handle}
      >
        <AdminEditBar
          productId={product.id}
          productHandle={handle}
          storeSlug={storeSlug}
          storeId={storeId}
          pageType="product"
        />
      </PageContent>
    </>
  );
}

