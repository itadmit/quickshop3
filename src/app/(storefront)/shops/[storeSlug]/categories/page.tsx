import { notFound } from 'next/navigation';
import { AdminEditBar } from '@/components/storefront/AdminEditBar';
import { getStoreIdBySlug, getStoreBySlug } from '@/lib/utils/store';

// ============================================
// Categories Page - Content from Customizer
// ============================================

export const revalidate = 300; // ISR - revalidate כל 5 דקות

export default async function CategoriesPage({
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

  // דף קטגוריות - התוכן מגיע מהקסטומייזר דרך CustomizerLayout
  // AdminEditBar מוצג למנהלים בלבד
  return (
    <AdminEditBar
      storeSlug={storeSlug}
      storeId={storeId}
      pageType="categories"
    />
  );
}
