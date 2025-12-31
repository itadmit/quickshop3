'use client';

import { useCart, type CartItem } from '@/hooks/useCart';
import { useCartCalculator } from '@/hooks/useCartCalculator';
import { CartSummary } from '@/components/storefront/CartSummary';
import { FreeShippingProgress } from '@/components/storefront/FreeShippingProgress';
import Link from 'next/link';
import { HiTrash, HiPlus, HiMinus } from 'react-icons/hi';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { emitTrackingEvent } from '@/lib/tracking/events';
import React, { useEffect } from 'react';
import { TextSkeleton } from '@/components/ui/Skeleton';
import { type ShippingRate, type CartCalculationResult } from '@/lib/services/cartCalculator';

interface CartPageContentProps {
  storeId: number;
  storeSlug?: string;
  shippingRate?: ShippingRate;
  freeShippingThreshold?: number;
}

/**
 * CartPageContent - תוכן עמוד עגלה
 * 
 * קומפוננטה משותפת לכל עמודי העגלה.
 * משתמשת ב-useCartCalculator לחישובים ו-CartSummary להצגת סיכום.
 * 
 * Single Source of Truth - כל החישובים עוברים דרך useCartCalculator
 */
export function CartPageContent({ 
  storeId, 
  storeSlug = '', 
  shippingRate,
  freeShippingThreshold = 125,
}: CartPageContentProps) {
  const { cartItems, removeFromCart, updateQuantity, isLoading: cartLoading, isUpdatingQuantity } = useCart();
  const router = useRouter();
  const { t, loading: translationsLoading } = useTranslation('storefront');

  // Use cart calculator for accurate totals (including discounts)
  // SINGLE SOURCE OF TRUTH: מעביר את cartItems
  const { 
    calculation, 
    discountCode,
    validatingCode,
    loading: calcLoading,
    getTotal,
    applyDiscountCode,
    removeDiscountCode,
    recalculate,
  } = useCartCalculator({
    storeId,
    cartItems,
    shippingRate,
    autoCalculate: true,
  });

  // Track ViewCart event on page load
  useEffect(() => {
    if (cartItems.length > 0) {
      const total = getTotal();
      emitTrackingEvent({
        event: 'ViewCart',
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const basePath = storeSlug ? `/shops/${storeSlug}` : '';

  // Empty cart state - בודק שהעגלה באמת ריקה ולא בזמן טעינה/חישוב
  const isCartEmpty = cartItems.length === 0 && !cartLoading && !calcLoading && !validatingCode;
  
  if (isCartEmpty) {
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
          <div className="text-gray-600 mb-8">
            {translationsLoading ? (
              <TextSkeleton width="w-48" height="h-4" className="mx-auto" />
            ) : (
              <p>{t('cart.continue_shopping')}</p>
            )}
          </div>
          <Link
            href={`${basePath}/products`}
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

  const handleRemove = async (variantId: number) => {
    await removeFromCart(variantId);
  };

  const handleQuantityChange = async (variantId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeFromCart(variantId);
    } else {
      // ✅ עדכון מיידי - ה-UI ישתנה מיד!
      updateQuantity(variantId, newQuantity);
    }
  };

  const handleCheckout = () => {
    router.push(`${basePath}/checkout`);
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
          <FreeShippingProgress threshold={freeShippingThreshold} storeId={storeId} />
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="divide-y divide-gray-200">
              {calcLoading && !calculation ? (
                // Skeleton loading
                <div className="p-6 animate-pulse space-y-4">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ) : calculation && calculation.items.length > 0 ? (
                calculation.items.map((calculatedItem, index) => {
                  const item = calculatedItem.item;
                  const hasDiscount = calculatedItem.lineDiscount > 0;
                  
                  // בדיקה אם זה מוצר מתנה (gift product)
                  const isGiftProduct = item.properties?.some(prop => prop.name === 'מתנה');
                  const giftDiscountName = item.properties?.find(prop => prop.name === 'מתנה')?.value;
                  
                  return (
                    <div key={`${item.variant_id}-${isGiftProduct ? 'gift' : 'regular'}-${index}`} className={`p-6 flex items-center gap-6 ${isGiftProduct ? 'bg-green-50 border-l-4 border-green-500' : ''}`}>
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
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{item.product_title}</h3>
                          {isGiftProduct && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-600 text-white rounded-full">
                              {t('cart.gift')}
                            </span>
                          )}
                        </div>
                        
                        {/* חיווי למוצר מתנה */}
                        {isGiftProduct && giftDiscountName && (
                          <p className="text-sm text-green-700 font-medium mb-1">
                            {t('cart.gift_from_discount', { discount: giftDiscountName })}
                          </p>
                        )}
                        
                        {/* מטא-דאטה */}
                        <div className="mt-1 space-y-1">
                          {item.properties && item.properties.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {item.properties.filter(prop => prop.name !== 'מתנה').map((prop, idx) => (
                                <span key={idx} className="text-xs text-gray-600">
                                  <span className="font-medium">{prop.name}:</span> {prop.value}
                                </span>
                              ))}
                            </div>
                          ) : item.variant_title !== 'Default Title' && (
                            <p className="text-xs text-gray-500">{item.variant_title}</p>
                          )}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      {isGiftProduct ? (
                        <div className="flex items-center gap-3">
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleQuantityChange(item.variant_id, item.quantity - 1)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label={t('cart.decrease_quantity')}
                            disabled={item.quantity <= 1 || calcLoading}
                          >
                            <HiMinus className="w-4 h-4" />
                          </button>
                          <span className="w-12 text-center font-medium relative">
                            <span className="inline-flex items-center gap-1.5 justify-center">
                              {item.quantity}
                              {isUpdatingQuantity(item.variant_id) && (
                                <svg className="animate-spin h-3.5 w-3.5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              )}
                            </span>
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.variant_id, item.quantity + 1)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label={t('cart.increase_quantity')}
                            disabled={calcLoading}
                          >
                            <HiPlus className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* Item Total */}
                      <div className="text-left min-w-[120px] flex flex-col items-end gap-1">
                        {hasDiscount ? (
                          <>
                            <p className="text-sm text-gray-400 line-through">₪{calculatedItem.lineTotal.toFixed(2)}</p>
                            <p className="text-lg font-bold text-gray-900">₪{calculatedItem.lineTotalAfterDiscount.toFixed(2)}</p>
                            {calculatedItem.appliedDiscounts && calculatedItem.appliedDiscounts.length > 0 && (
                              <div className="flex flex-col gap-1 items-end">
                                {calculatedItem.appliedDiscounts
                                  .filter(discount => discount.source === 'automatic')
                                  .map((discount, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full whitespace-nowrap">
                                      {discount.name}
                                    </span>
                                  ))
                                }
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-lg font-bold text-gray-900">₪{calculatedItem.lineTotal.toFixed(2)}</p>
                        )}
                      </div>

                      {/* Remove Button */}
                      {!isGiftProduct && (
                        <button
                          onClick={() => handleRemove(item.variant_id)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          aria-label={t('cart.remove')}
                          disabled={calcLoading}
                        >
                          <HiTrash className="w-5 h-5" />
                        </button>
                      )}
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

        {/* Cart Summary */}
        <div className="lg:col-span-1">
          <CartSummary
            storeId={storeId}
            shippingRate={shippingRate}
            cartItems={cartItems}
            calculation={calculation}
            discountCode={discountCode}
            validatingCode={validatingCode}
            applyDiscountCode={applyDiscountCode}
            removeDiscountCode={removeDiscountCode}
            recalculate={recalculate}
            onCheckout={handleCheckout}
          />
          <Link
            href={`${basePath}/products`}
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

