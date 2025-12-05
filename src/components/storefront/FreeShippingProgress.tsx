'use client';

import { useCart } from '@/hooks/useCart';
import { useCartCalculator } from '@/hooks/useCartCalculator';
import { useTranslation } from '@/hooks/useTranslation';
import { TextSkeleton } from '@/components/ui/Skeleton';

interface FreeShippingProgressProps {
  threshold?: number;
  currency?: string;
  storeId: number;
}

export function FreeShippingProgress({ 
  threshold = 125, 
  currency = 'ILS',
  storeId
}: FreeShippingProgressProps) {
  const { cartItems } = useCart();
  const { getSubtotal } = useCartCalculator({
    storeId,
    cartItems,
    autoCalculate: true,
  });
  const { t, loading: translationsLoading } = useTranslation('storefront');
  const subtotal = getSubtotal();
  
  const remaining = Math.max(0, threshold - subtotal);
  const progress = Math.min(100, (subtotal / threshold) * 100);

  if (subtotal >= threshold) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 text-green-700">
          <span className="text-xl">🎉</span>
          <p className="font-medium">
            {translationsLoading ? (
              <TextSkeleton width="w-32" height="h-4" className="bg-green-200" />
            ) : (
              t('cart.free_shipping_achieved') || 'קיבלת משלוח חינם!'
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
      <p className="text-sm text-gray-700 mb-2">
        {translationsLoading ? (
          <TextSkeleton width="w-48" height="h-4" />
        ) : (
          t('cart.free_shipping_progress', { 
            amount: remaining.toFixed(2),
            currency: currency === 'ILS' ? '₪' : '$'
          }) || `נותרו ${remaining.toFixed(2)} ₪ למשלוח חינם`
        )}
      </p>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-green-500 h-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${progress.toFixed(0)}% מהדרך למשלוח חינם`}
        />
      </div>
    </div>
  );
}

