import { notFound } from 'next/navigation';
import { AdminEditBar } from '@/components/storefront/AdminEditBar';
import { getStoreIdBySlug, getStoreBySlug } from '@/lib/utils/store';

// ============================================
// All Products Page - All content rendered via CustomizerLayout
// ============================================

export const revalidate = 300; // ISR - revalidate כל 5 דקות

export default async function AllProductsPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;

  const storeId = await getStoreIdBySlug(storeSlug);
  
  if (!storeId) {
    notFound();
  }

  const store = await getStoreBySlug(storeSlug);
  if (!store) {
    notFound();
  }

  // כל התוכן מוצג דרך CustomizerLayout - רק AdminEditBar כאן
  // עמוד "כל המוצרים" הוא collection עם handle="all"
  return (
    <AdminEditBar
      collectionHandle="all"
      storeSlug={storeSlug}
      storeId={storeId}
      pageType="collection"
    />
  );
}
