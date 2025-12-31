/**
 * Home Page - Content comes from Customizer
 * דף הבית - התוכן מגיע מהקסטומייזר
 * ✅ SSR - כל התוכן נטען בשרת (מהיר כמו PHP)
 */

import { notFound } from 'next/navigation';
import { getStoreIdBySlug, getStoreBySlug } from '@/lib/utils/store';
import { AdminEditBar } from '@/components/storefront/AdminEditBar';
import { CustomizerLayout } from '@/components/storefront/CustomizerLayout';

export const revalidate = 300; // ISR - revalidate כל 5 דקות

export default async function StorefrontHomePage({
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

  // ✅ דף הבית עם SSR - כל התוכן נטען בשרת
  // CustomizerLayout טוען את כל הסקשנים בשרת (מהיר!)
  // AdminEditBar מוצג למנהלים בלבד (client component קטן)
  return (
    <CustomizerLayout
      storeSlug={storeSlug}
      pageType="home"
    >
      <AdminEditBar
        storeSlug={storeSlug}
        storeId={storeId}
        pageType="home"
      />
    </CustomizerLayout>
  );
}
