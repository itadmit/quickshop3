import { notFound } from 'next/navigation';
import { AdminEditBar } from '@/components/storefront/AdminEditBar';
import { getStoreIdBySlug, getStoreBySlug } from '@/lib/utils/store';
import { getCollectionByHandle } from '@/lib/storefront/queries';

// ============================================
// Category Page - All content rendered via CustomizerLayout
// ============================================

export const revalidate = 300; // ISR - revalidate כל 5 דקות

export default async function CategoryPage({
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

  // טעינת קטגוריה לוידוא שהיא קיימת
  const { collection } = await getCollectionByHandle(handle, storeId, { limit: 1, offset: 0 });

  if (!collection) {
    notFound();
  }

  // כל התוכן מוצג דרך CustomizerLayout - רק AdminEditBar כאן
  return (
    <AdminEditBar
      collectionId={collection.id}
      collectionHandle={handle}
      storeSlug={storeSlug}
      storeId={storeId}
      pageType="collection"
    />
  );
}
