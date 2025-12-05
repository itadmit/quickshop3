import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getStoreBySlug } from '@/lib/utils/store';
import { CheckoutForm } from '@/components/storefront/CheckoutForm';
import { CheckoutHeader } from '@/components/storefront/CheckoutHeader';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Skeleton component למניעת hydration mismatch
function CheckoutSkeleton({ storeName, storeLogo, storeSlug }: { storeName: string; storeLogo?: string | null; storeSlug: string }) {
  return (
    <div 
      className="min-h-screen" 
      dir="rtl"
      style={{ 
        backgroundColor: '#ffffff',
      }}
    >
      {/* CheckoutHeader */}
      <div className="max-w-7xl mx-auto">
        <CheckoutHeader shopName={storeName} shopLogo={storeLogo} shopSlug={storeSlug} />
      </div>
      
      {/* Skeleton שמשקף את המבנה האמיתי */}
      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
          {/* Left Side - Form Skeleton */}
          <div 
            className="lg:col-span-3 min-h-screen flex justify-end"
            style={{
              backgroundColor: '#ffffff',
            }}
          >
            <div className="w-full max-w-3xl pl-8 pr-4 py-8 space-y-6">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
              </div>
              <div className="pb-6 border-b border-gray-200">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Side - Order Summary Skeleton */}
          <div 
            className="lg:col-span-2 min-h-screen flex justify-start"
            style={{
              backgroundColor: '#fafafa',
            }}
          >
            <div className="w-full max-w-md px-8 py-8">
              <div className="p-6 sticky top-24 bg-gray-50 rounded-lg">
                <div className="animate-pulse space-y-6">
                  <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="space-y-2 pt-4 border-t border-gray-200">
                    <div className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  
  // טעינת פרטי החנות
  const store = await getStoreBySlug(storeSlug);

  if (!store) {
    redirect('/');
  }

  // טעינת checkoutSettings מה-settings
  // אם settings הוא null, נשתמש בערך ברירת מחדל
  const settings = store.settings ? (store.settings as any) : {};
  const checkoutSettings = settings.checkoutPage || {};
  const customFields = checkoutSettings.customFields || [];

  // לא נשתמש ב-Suspense כאן כי זה גורם ל-hydration mismatch
  // במקום זה, ה-CheckoutForm עצמו יטפל ב-skeleton
  return (
    <CheckoutForm
      storeId={store.id}
      storeName={store.name}
      storeLogo={store.logo}
      storeSlug={storeSlug}
      customFields={customFields}
    />
  );
}
