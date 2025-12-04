'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/hooks/useCart';
import { CartSummary } from '@/components/storefront/CartSummary';
import { HiShoppingCart, HiX } from 'react-icons/hi';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SideCartProps {
  storeId: number;
}

/**
 * SideCart - עגלת צד (Drawer)
 * 
 * קומפוננטה זו מציגה עגלת קניות בצד המסך.
 * היא משתמשת במנוע החישוב המרכזי להצגת מחירים והנחות.
 */
export function SideCart({ storeId }: SideCartProps) {
  const { cartItems, getCartCount } = useCart();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const cartCount = getCartCount();

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (cartCount === 0 && !isOpen) {
    return null;
  }

  return (
    <>
      {/* Cart Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <HiShoppingCart className="w-5 h-5 text-gray-600" />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {cartCount}
          </span>
        )}
      </button>

      {/* Side Cart Drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed top-0 left-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">עגלת קניות</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <HiX className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {cartItems.length === 0 ? (
                <div className="text-center py-12">
                  <HiShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">העגלה שלך ריקה</p>
                  <Link
                    href="/products"
                    onClick={() => setIsOpen(false)}
                    className="inline-block text-green-600 hover:text-green-700 font-medium"
                  >
                    המשך לקניות
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.variant_id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                      {/* Image */}
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.product_title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{item.product_title}</h3>
                        {item.variant_title !== 'Default Title' && (
                          <p className="text-sm text-gray-500 truncate">{item.variant_title}</p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-sm font-semibold text-gray-900">
                            ₪{item.price.toFixed(2)} × {item.quantity}
                          </p>
                          <p className="text-sm font-bold text-gray-900">
                            ₪{(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Summary */}
            {cartItems.length > 0 && (
              <div className="border-t border-gray-200 p-4">
                <CartSummary
                  storeId={storeId}
                  onCheckout={() => {
                    setIsOpen(false);
                    router.push('/checkout');
                  }}
                />
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

