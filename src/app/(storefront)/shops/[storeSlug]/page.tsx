/**
 * Home Page - Content comes from Customizer
 * דף הבית - התוכן מגיע מהקסטומייזר
 */

import { notFound } from 'next/navigation';
import { getStoreIdBySlug } from '@/lib/utils/store';

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

  // דף הבית ריק - כל התוכן מגיע מהקסטומייזר דרך CustomizerLayout
  // הסקשנים כמו Hero, Featured Products, Collections מוצגים דרך הקסטומייזר
  return null;
}
