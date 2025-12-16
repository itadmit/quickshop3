'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { useCartOpen } from '@/hooks/useCartOpen';
import { HiShoppingCart, HiCheck } from 'react-icons/hi';
import { useTranslation } from '@/hooks/useTranslation';
import { emitTrackingEvent } from '@/lib/tracking/events';
import { TextSkeleton } from '@/components/ui/Skeleton';

interface AddToCartButtonProps {
  productId: number;
  variantId: number;
  productTitle: string;
  variantTitle: string;
  price: number;
  image?: string | null;
  available: boolean;
  onAddToCart?: () => void;
  properties?: Array<{
    name: string;
    value: string;
  }>;
}

export function AddToCartButton({
  productId,
  variantId,
  productTitle,
  variantTitle,
  price,
  image,
  available,
  properties,
}: AddToCartButtonProps) {
  const { addToCart, isAddingToCart } = useCart();
  const { openCart } = useCartOpen();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { t, loading: translationsLoading } = useTranslation('storefront');

  const handleAddToCart = async () => {
    if (!available || isAddingToCart || added) return;

    try {
      const success = await addToCart({
        variant_id: variantId,
        product_id: productId,
        product_title: productTitle,
        variant_title: variantTitle,
        price,
        quantity,
        image: image || undefined,
        properties,
      });

      if (success) {
        // Track event
        emitTrackingEvent({
          event: 'AddToCart',
          content_ids: [String(productId)],
          contents: [{
            id: String(productId),
            quantity,
            item_price: price,
          }],
          currency: 'ILS',
          value: price * quantity,
        });

        // Show success state
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);

        // Open cart
        setTimeout(() => openCart(), 300);
      }
    } catch (error) {
      console.error('[AddToCartButton] Error:', error);
    }
  };

  if (!available) {
    return (
      <button
        disabled
        className="w-full bg-gray-300 text-gray-500 font-semibold py-4 px-6 rounded-lg cursor-not-allowed"
      >
        {translationsLoading ? (
          <TextSkeleton width="w-20" height="h-5" className="mx-auto" />
        ) : (
          t('product.out_of_stock')
        )}
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">
          {translationsLoading ? (
            <TextSkeleton width="w-16" height="h-4" />
          ) : (
            `${t('product.quantity')}:`
          )}
        </label>
        <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-3 py-2 hover:bg-gray-100 transition-colors"
            aria-label={t('product.decrease_quantity')}
          >
            -
          </button>
          <span className="px-4 py-2 min-w-[3rem] text-center">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="px-3 py-2 hover:bg-gray-100 transition-colors"
            aria-label={t('product.increase_quantity')}
          >
            +
          </button>
        </div>
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={isAddingToCart || added}
        className={`w-full font-semibold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2 ${
          added
            ? 'bg-green-500 text-white'
            : isAddingToCart
            ? 'bg-green-400 text-white cursor-wait'
            : 'bg-green-600 hover:bg-green-700 text-white'
        } disabled:cursor-not-allowed`}
      >
        {isAddingToCart ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {translationsLoading ? (
              <TextSkeleton width="w-24" height="h-5" />
            ) : (
              t('product.adding_to_cart')
            )}
          </>
        ) : added ? (
          <>
            <HiCheck className="w-5 h-5" />
            {translationsLoading ? (
              <TextSkeleton width="w-24" height="h-5" />
            ) : (
              t('product.added_to_cart')
            )}
          </>
        ) : (
          <>
            <HiShoppingCart className="w-5 h-5" />
            {translationsLoading ? (
              <TextSkeleton width="w-24" height="h-5" />
            ) : (
              t('product.add_to_cart')
            )}
          </>
        )}
      </button>
    </div>
  );
}
