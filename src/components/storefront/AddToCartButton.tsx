'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { HiShoppingCart, HiCheck } from 'react-icons/hi';

interface AddToCartButtonProps {
  productId: number;
  variantId: number;
  productTitle: string;
  variantTitle: string;
  price: number;
  image?: string | null;
  available: boolean;
}

export function AddToCartButton({
  productId,
  variantId,
  productTitle,
  variantTitle,
  price,
  image,
  available,
}: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    if (!available) return;

    addToCart({
      variant_id: variantId,
      product_id: productId,
      product_title: productTitle,
      variant_title: variantTitle,
      price,
      quantity,
      image: image || undefined,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (!available) {
    return (
      <button
        disabled
        className="w-full bg-gray-300 text-gray-500 font-semibold py-4 px-6 rounded-lg cursor-not-allowed"
      >
        אזל מהמלאי
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">כמות:</label>
        <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-3 py-2 hover:bg-gray-100 transition-colors"
          >
            -
          </button>
          <span className="px-4 py-2 min-w-[3rem] text-center">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="px-3 py-2 hover:bg-gray-100 transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        className={`w-full font-semibold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2 ${
          added
            ? 'bg-green-500 text-white'
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
      >
        {added ? (
          <>
            <HiCheck className="w-5 h-5" />
            נוסף לעגלה!
          </>
        ) : (
          <>
            <HiShoppingCart className="w-5 h-5" />
            הוסף לעגלה
          </>
        )}
      </button>
    </div>
  );
}

