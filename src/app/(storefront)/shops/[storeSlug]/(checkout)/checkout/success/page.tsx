import React, { Suspense } from 'react';
import { CheckoutSuccess } from '@/components/storefront/CheckoutSuccess';
import { getStoreBySlug } from '@/lib/utils/store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Checkout Success Page
 * 
 * This page is reached after a successful payment through the unified callback.
 * All payment providers (PayPlus, Pelecard, PayMe, Meshulam) redirect through
 * /api/payments/callback which processes the payment and then redirects here
 * with a clean orderId parameter.
 */
export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeSlug: string }>;
  searchParams: Promise<{ 
    handle?: string; 
    orderId?: string;
    order_id?: string; // Alternative format
  }>;
}) {
  const { storeSlug } = await params;
  const { handle, orderId, order_id } = await searchParams;
  
  // Support multiple orderId formats
  const finalOrderId = orderId || order_id;
  
  // Support both handle (recommended) and orderId (legacy)
  const orderIdentifier = handle || finalOrderId;

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
      <CheckoutSuccess 
        orderHandle={handle || undefined} 
        orderId={finalOrderId ? parseInt(finalOrderId, 10) : undefined} 
        storeSlug={storeSlug} 
        storeName={storeName} 
        storeLogo={storeLogo} 
      />
    </Suspense>
  );
}
