import { notFound } from 'next/navigation';
import { AdminEditBar } from '@/components/storefront/AdminEditBar';
import { PageContent } from '@/components/storefront/PageContent';
import { getStoreIdBySlug, getStoreBySlug } from '@/lib/utils/store';
import { getCollectionByHandle } from '@/lib/storefront/queries';

// ============================================
// Category Page - Content from Customizer (SSR)
// ✅ הדר/פוטר ב-layout - לא נטענים מחדש בניווט
// ============================================

export const revalidate = 300; // ISR - revalidate כל 5 דקות

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeSlug: string; handle: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const startTime = Date.now();
  const { storeSlug, handle } = await params;
  const { page } = await searchParams;
  console.log(`📄 [CategoryPage] Starting load for ${storeSlug}/categories/${handle}`);
  const storeId = await getStoreIdBySlug(storeSlug);
  
  if (!storeId) {
    notFound();
  }

  const store = await getStoreBySlug(storeSlug);
  if (!store) {
    notFound();
  }

  // Verify collection exists
  const collectionLoadStart = Date.now();
  const { collection } = await getCollectionByHandle(
    handle,
    storeId,
    { limit: 1, offset: 0 }
  );
  console.log(`📂 [CategoryPage] Collection loaded in ${Date.now() - collectionLoadStart}ms: ${collection?.title || 'N/A'}`);

  if (!collection) {
    console.error(`❌ [CategoryPage] Collection not found: ${handle}`);
    notFound();
  }

  console.log(`✅ [CategoryPage] Page ready in ${Date.now() - startTime}ms`);

  // ✅ דף קטגוריה - רק התוכן נטען כאן
  // הדר/פוטר נטענים פעם אחת ב-layout (לא נטענים מחדש בניווט!)
  return (
    <PageContent
      storeSlug={storeSlug}
      storeId={storeId}
      pageType="collection"
      pageHandle={handle}
    >
      <AdminEditBar
        storeSlug={storeSlug}
        storeId={storeId}
        collectionId={collection.id}
        collectionHandle={handle}
        pageType="category"
      />
    </PageContent>
  );
}
