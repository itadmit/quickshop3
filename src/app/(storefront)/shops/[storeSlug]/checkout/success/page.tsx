import React, { Suspense } from 'react';
import { CheckoutSuccess } from '@/components/storefront/CheckoutSuccess';
import { getStoreBySlug } from '@/lib/utils/store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function CheckoutSuccessContent({
  orderId,
  storeSlug,
}: {
  orderId: string;
  storeSlug: string;
}) {
  return <CheckoutSuccess orderId={parseInt(orderId, 10)} storeSlug={storeSlug} storeName="" />;
}

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeSlug: string }>;
  searchParams: Promise<{ handle?: string; orderId?: string }>;
}) {
  const { storeSlug } = await params;
  const { handle, orderId } = await searchParams;

  // תמיכה ב-handle (מומלץ) או orderId (legacy)
  const orderIdentifier = handle || orderId;

  if (!orderIdentifier) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">שגיאה</h1>
          <p>מספר הזמנה לא נמצא</p>
        </div>
      </div>
    );
  }

  // Load store name and logo
  const store = await getStoreBySlug(storeSlug);
  const storeName = store?.name || 'Quick Shop';
  const storeLogo = store?.logo || null;

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">טוען פרטי הזמנה...</p>
        </div>
      </div>
    }>
      <CheckoutSuccess orderHandle={handle || undefined} orderId={orderId ? parseInt(orderId, 10) : undefined} storeSlug={storeSlug} storeName={storeName} storeLogo={storeLogo} />
    </Suspense>
  );
}
