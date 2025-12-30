/**
 * Home Page - Content comes from Customizer
 * דף הבית - התוכן מגיע מהקסטומייזר
 * ✅ SSR - כל התוכן נטען בשרת (מהיר כמו PHP)
 * ✅ הדר/פוטר ב-layout - לא נטענים מחדש בניווט
 */

import { notFound } from 'next/navigation';
import { getStoreIdBySlug, getStoreBySlug } from '@/lib/utils/store';
import { AdminEditBar } from '@/components/storefront/AdminEditBar';
import { PageContent } from '@/components/storefront/PageContent';

export const revalidate = 300; // ISR - revalidate כל 5 דקות

export default async function StorefrontHomePage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const startTime = Date.now();
  const { storeSlug } = await params;
  console.log(`🏠 [HomePage] Starting load for store: ${storeSlug}`);
  const storeId = await getStoreIdBySlug(storeSlug);
  
  if (!storeId) {
    console.error(`❌ [HomePage] Store not found: ${storeSlug}`);
    notFound();
  }

  const store = await getStoreBySlug(storeSlug);
  if (!store) {
    console.error(`❌ [HomePage] Store data not found: ${storeSlug}`);
    notFound();
  }

  console.log(`✅ [HomePage] Page ready in ${Date.now() - startTime}ms`);

  // ✅ דף הבית עם SSR - רק התוכן נטען כאן
  // הדר/פוטר נטענים פעם אחת ב-layout (לא נטענים מחדש בניווט!)
  return (
    <PageContent
      storeSlug={storeSlug}
      storeId={storeId}
      pageType="home"
    >
      <AdminEditBar
        storeSlug={storeSlug}
        storeId={storeId}
        pageType="home"
      />
    </PageContent>
  );
}
