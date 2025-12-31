import { notFound } from 'next/navigation';
import { AdminEditBar } from '@/components/storefront/AdminEditBar';
import { getStoreIdBySlug, getStoreBySlug } from '@/lib/utils/store';
import { getCollectionByHandle } from '@/lib/storefront/queries';

// ============================================
// Category Page - Content from Customizer
// ============================================

export const revalidate = 300; // ISR - revalidate כל 5 דקות

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeSlug: string; handle: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { storeSlug, handle } = await params;
  const { page } = await searchParams;

  const storeId = await getStoreIdBySlug(storeSlug);
  
  if (!storeId) {
    notFound();
  }

  const store = await getStoreBySlug(storeSlug);
  if (!store) {
    notFound();
  }

  // Verify collection exists
  const { collection } = await getCollectionByHandle(
    handle,
    storeId,
    { limit: 1, offset: 0 }
  );

  if (!collection) {
    notFound();
  }

  // דף קטגוריה - התוכן מגיע מהקסטומייזר דרך CustomizerLayout
  // הסקשנים כמו Header, Collection Grid, Footer מוצגים דרך הקסטומייזר
  // AdminEditBar מוצג למנהלים בלבד
  return (
    <AdminEditBar
      storeSlug={storeSlug}
      storeId={storeId}
      collectionId={collection.id}
      collectionHandle={handle}
      pageType="category"
    />
  );
}
