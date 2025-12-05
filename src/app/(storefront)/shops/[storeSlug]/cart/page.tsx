'use client';

import { useCart } from '@/hooks/useCart';
import { CartSummary } from '@/components/storefront/CartSummary';
import Link from 'next/link';
import { HiTrash, HiPlus, HiMinus } from 'react-icons/hi';
import { useRouter, useParams } from 'next/navigation';

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity } = useCart();
  const router = useRouter();
  const params = useParams();
  const storeSlug = params.storeSlug as string;

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">העגלה שלך ריקה</h1>
          <p className="text-gray-600 mb-8">הוסף מוצרים לעגלה כדי להתחיל לקנות</p>
          <Link
            href={`/shops/${storeSlug}/products`}
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            המשך לקניות
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">עגלת קניות</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="divide-y divide-gray-200">
              {cartItems.map((item) => (
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
                <p className="text-lg font-bold text-gray-900">₪{item.price.toFixed(2)}</p>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateQuantity(item.variant_id, item.quantity - 1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <HiMinus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-medium">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <HiPlus className="w-4 h-4" />
                </button>
              </div>

              {/* Item Total */}
              <div className="text-left min-w-[100px]">
                <p className="text-lg font-bold text-gray-900">
                  ₪{(item.price * item.quantity).toFixed(2)}
                </p>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => removeFromCart(item.variant_id)}
                className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
              >
                <HiTrash className="w-5 h-5" />
              </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Summary with Calculator */}
        <div className="lg:col-span-1">
          <CartSummary
            storeId={1} // TODO: Get from storeSlug
            onCheckout={() => router.push(`/shops/${storeSlug}/checkout`)}
          />
          <Link
            href={`/shops/${storeSlug}/products`}
            className="block text-center mt-4 text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← המשך לקניות
          </Link>
        </div>
      </div>
    </div>
  );
}
