'use client';

import { useCart } from '@/hooks/useCart';
import { useCartCalculator } from '@/hooks/useCartCalculator';
import { useStoreId } from '@/hooks/useStoreId';
import { CartSummary } from '@/components/storefront/CartSummary';
import { FreeShippingProgress } from '@/components/storefront/FreeShippingProgress';
import Link from 'next/link';
import { HiTrash, HiPlus, HiMinus } from 'react-icons/hi';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { emitTrackingEvent } from '@/lib/tracking/events';
import { useEffect } from 'react';
import { TextSkeleton } from '@/components/ui/Skeleton';

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity } = useCart();
  const router = useRouter();
  const params = useParams();
  const storeSlug = params.storeSlug as string;
  const { t, loading: translationsLoading } = useTranslation('storefront');
  const storeId = useStoreId();

  // Use cart calculator for accurate totals (including discounts)
  // SINGLE SOURCE OF TRUTH: מעביר את cartItems
  const { getTotal, calculation } = useCartCalculator({
    storeId: storeId || 1, // Fallback to 1 if storeId not loaded yet
    cartItems, // ✅ מעביר את cartItems
    autoCalculate: true,
  });

  // Track InitiateCheckout event
  useEffect(() => {
    if (cartItems.length > 0) {
      // שימוש במנוע החישוב לקבלת המחיר המדויק (כולל הנחות)
      const total = getTotal();
      emitTrackingEvent({
        event: 'InitiateCheckout',
        content_ids: cartItems.map(item => String(item.product_id)),
        contents: cartItems.map(item => ({
          id: String(item.product_id),
          quantity: item.quantity,
          item_price: item.price,
        })),
        currency: 'ILS',
        value: total,
        num_items: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      });
    }
  }, [cartItems, getTotal]); // עדכון כשהעגלה או החישוב משתנים

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16" dir="rtl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {translationsLoading ? (
              <TextSkeleton width="w-32" height="h-8" className="mx-auto" />
            ) : (
              t('cart.empty')
            )}
          </h1>
          <p className="text-gray-600 mb-8">
            {translationsLoading ? (
              <TextSkeleton width="w-48" height="h-4" className="mx-auto" />
            ) : (
              t('cart.continue_shopping')
            )}
          </p>
          <Link
            href={`/shops/${storeSlug}/products`}
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            {translationsLoading ? (
              <TextSkeleton width="w-32" height="h-5" className="bg-green-500" />
            ) : (
              t('cart.continue_shopping')
            )}
          </Link>
        </div>
      </div>
    );
  }

  const handleRemove = (variantId: number) => {
    removeFromCart(variantId);
  };

  const handleQuantityChange = (variantId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(variantId);
    } else {
      updateQuantity(variantId, newQuantity);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12" dir="rtl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {translationsLoading ? (
          <TextSkeleton width="w-32" height="h-8" />
        ) : (
          t('cart.title')
        )}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          {/* Free Shipping Progress */}
          {storeId && <FreeShippingProgress threshold={125} storeId={storeId} />}
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="divide-y divide-gray-200">
              {calculation && calculation.items.length > 0 ? (
                calculation.items.map((calculatedItem) => {
                  const item = calculatedItem.item;
                  const hasDiscount = calculatedItem.lineDiscount > 0;
                  
                  return (
                    <div key={item.variant_id} className="p-6 flex items-center gap-6">
                      {/* Product Image */}
                      <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.product_title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{item.product_title}</h3>
                        {item.variant_title !== 'Default Title' && (
                          <p className="text-sm text-gray-500 mb-2">{item.variant_title}</p>
                        )}
                        <div className="flex items-center gap-2">
                          {hasDiscount ? (
                            <>
                              <p className="text-sm text-gray-400 line-through">₪{calculatedItem.lineTotal.toFixed(2)}</p>
                              <p className="text-lg font-bold text-gray-900">₪{calculatedItem.lineTotalAfterDiscount.toFixed(2)}</p>
                            </>
                          ) : (
                            <p className="text-lg font-bold text-gray-900">₪{calculatedItem.lineTotal.toFixed(2)}</p>
                          )}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleQuantityChange(item.variant_id, item.quantity - 1)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          aria-label="הפחת כמות"
                        >
                          <HiMinus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.variant_id, item.quantity + 1)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          aria-label="הוסף כמות"
                        >
                          <HiPlus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Item Total - SINGLE SOURCE OF TRUTH */}
                      <div className="text-left min-w-[100px]">
                        {hasDiscount ? (
                          <div>
                            <p className="text-sm text-gray-400 line-through">₪{calculatedItem.lineTotal.toFixed(2)}</p>
                            <p className="text-lg font-bold text-gray-900">₪{calculatedItem.lineTotalAfterDiscount.toFixed(2)}</p>
                          </div>
                        ) : (
                          <p className="text-lg font-bold text-gray-900">
                            ₪{calculatedItem.lineTotalAfterDiscount.toFixed(2)}
                          </p>
                        )}
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemove(item.variant_id)}
                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                        aria-label={translationsLoading ? 'מחק' : t('cart.remove')}
                      >
                        <HiTrash className="w-5 h-5" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-gray-500">
                  {translationsLoading ? (
                    <TextSkeleton width="w-24" height="h-4" className="mx-auto" />
                  ) : (
                    t('cart.empty')
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cart Summary with Calculator */}
        <div className="lg:col-span-1">
          {storeId && (
            <CartSummary
              storeId={storeId}
              onCheckout={() => router.push(`/shops/${storeSlug}/checkout`)}
            />
          )}
          <Link
            href={`/shops/${storeSlug}/products`}
            className="block text-center mt-4 text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← {translationsLoading ? (
              <TextSkeleton width="w-32" height="h-4" className="inline-block" />
            ) : (
              t('cart.continue_shopping')
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}
