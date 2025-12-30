import { notFound } from 'next/navigation';
import { AdminEditBar } from '@/components/storefront/AdminEditBar';
import { PageContent } from '@/components/storefront/PageContent';
import { getStoreIdBySlug, getStoreBySlug } from '@/lib/utils/store';

// ============================================
// Products Page - Content from Customizer (SSR)
// ✅ הדר/פוטר ב-layout - לא נטענים מחדש בניווט
// ============================================

export const revalidate = 300; // ISR - revalidate כל 5 דקות

export default async function ProductsPage({
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

  // ✅ דף מוצרים - רק התוכן נטען כאן
  // הדר/פוטר נטענים פעם אחת ב-layout
  return (
    <PageContent
      storeSlug={storeSlug}
      storeId={storeId}
      pageType="products"
    >
      <AdminEditBar
        storeSlug={storeSlug}
        storeId={storeId}
        pageType="products"
      />
    </PageContent>
  );
}