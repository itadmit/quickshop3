/**
 * Home Page - Content comes from Customizer
 * דף הבית - התוכן מגיע מהקסטומייזר
 */

import { notFound } from 'next/navigation';
import { getStoreIdBySlug, getStoreBySlug } from '@/lib/utils/store';
import { AdminEditBar } from '@/components/storefront/AdminEditBar';

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

  // דף הבית - התוכן מגיע מהקסטומייזר דרך CustomizerLayout
  // הסקשנים כמו Hero, Featured Products, Collections מוצגים דרך הקסטומייזר
  // AdminEditBar מוצג למנהלים בלבד
  return (
    <AdminEditBar
      storeSlug={storeSlug}
      storeId={storeId}
      pageType="home"
    />
  );
}
