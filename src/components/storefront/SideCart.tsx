'use client';

import { useEffect, useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { useCartOpen } from '@/hooks/useCartOpen';
import { useCartCalculator } from '@/hooks/useCartCalculator';
import { CartSummary } from '@/components/storefront/CartSummary';
import { HiShoppingCart, HiX, HiTrash, HiPlus, HiMinus } from 'react-icons/hi';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

interface SideCartProps {
  storeId: number;
  shippingRate?: {
    id: number;
    name: string;
    price: number;
    free_shipping_threshold: number | null;
  };
}

/**
 * SideCart - עגלת צד (Drawer)
 * 
 * קומפוננטה זו מציגה עגלת קניות בצד המסך.
 * היא משתמשת במנוע החישוב המרכזי להצגת מחירים והנחות.
 * כל החישובים עוברים דרך המנוע המרכזי - Single Source of Truth.
 */
export function SideCart({ storeId, shippingRate }: SideCartProps) {
  const { cartItems, getCartCount, removeFromCart, updateQuantity, isAddingToCart, isLoading: cartLoading, refreshCart, isLoadingFromServer } = useCart();
  const { isOpen, openCart, closeCart } = useCartOpen();
  const router = useRouter();
  const params = useParams();
  const storeSlug = params?.storeSlug as string || '';
  const [isAnimating, setIsAnimating] = useState(false);
  
  // State לניהול מלאי לכל variant
  const [inventoryMap, setInventoryMap] = useState<Map<number, number>>(new Map());
  const [loadingInventory, setLoadingInventory] = useState<Set<number>>(new Set());
  
  // State לניהול אפשרויות (properties) לכל variant
  const [propertiesMap, setPropertiesMap] = useState<Map<number, Array<{ name: string; value: string }>>>(new Map());

  // שימוש במנוע החישוב המרכזי
  // SINGLE SOURCE OF TRUTH: מעביר את cartItems מ-useCart ל-useCartCalculator
  const {
    calculation,
    loading: calcLoading,
    getSubtotal,
    getDiscount,
    getTotal,
    getDiscounts,
    recalculate,
    removeDiscountCode,
  } = useCartCalculator({
    storeId,
    cartItems, // ✅ מעביר את cartItems מ-useCart
    shippingRate,
    autoCalculate: true,
  });

  const cartCount = getCartCount();
  const [isMounted, setIsMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isNavigatingToCheckout, setIsNavigatingToCheckout] = useState(false);

  // פתרון לבעיית Hydration - מתעדכן רק אחרי mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ניהול אנימציה - פתיחה וסגירה
  useEffect(() => {
    if (isOpen) {
      // פתיחה: מוסיף ל-DOM ואז מפעיל אנימציה
      setShouldRender(true);
      // delay קטן כדי שהאנימציה תרוץ (הקומפוננטה תהיה ב-DOM לפני האנימציה)
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      // סגירה: מפעיל אנימציה ואז מסיר מה-DOM
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300); // אותו זמן כמו האנימציה
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Quickshop: טעינת עגלה מהשרת כשפותחים אותה
  // תמיד טוענים מהשרת כדי לסנכרן עם השרת (גם אם יש פריטים ב-localStorage)
  useEffect(() => {
    if (isOpen && storeId && !isAddingToCart) {
      // טוענים מהשרת כדי לסנכרן - השרת הוא המקור האמת
      refreshCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, storeId]); // לא כולל isAddingToCart כדי לא ליצור לולאה

  // טעינת מלאי ואפשרויות לכל variant בעגלה
  useEffect(() => {
    const loadVariantData = async () => {
      const variantIds = cartItems.map(item => item.variant_id);
      const newInventoryMap = new Map<number, number>();
      const newPropertiesMap = new Map<number, Array<{ name: string; value: string }>>();
      
      await Promise.all(
        variantIds.map(async (variantId) => {
          try {
            // טעינת מלאי
            const inventoryResponse = await fetch(`/api/variants/${variantId}/inventory`);
            if (inventoryResponse.ok) {
              const inventoryData = await inventoryResponse.json();
              newInventoryMap.set(variantId, inventoryData.available || 0);
            }
            
            // טעינת אפשרויות
            const optionsResponse = await fetch(`/api/variants/${variantId}/options`);
            if (optionsResponse.ok) {
              const optionsData = await optionsResponse.json();
              if (optionsData.properties && optionsData.properties.length > 0) {
                newPropertiesMap.set(variantId, optionsData.properties);
              }
            }
          } catch (error) {
            console.error(`Error loading data for variant ${variantId}:`, error);
          }
        })
      );
      
      setInventoryMap(newInventoryMap);
      setPropertiesMap(newPropertiesMap);
    };

    if (cartItems.length > 0) {
      loadVariantData();
    }
  }, [cartItems]);

  // פונקציה לבדיקת מלאי לפני עדכון כמות
  const handleQuantityChange = async (variantId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(variantId);
      return;
    }

    // בדיקת מלאי
    const available = inventoryMap.get(variantId);
    if (available !== undefined && newQuantity > available) {
      alert(`רק ${available} יחידות זמינות במלאי`);
      return;
    }

    // אם אין מידע מלאי, נסה לטעון אותו
    if (available === undefined && !loadingInventory.has(variantId)) {
      setLoadingInventory(prev => new Set(prev).add(variantId));
      try {
        const response = await fetch(`/api/variants/${variantId}/inventory`);
        if (response.ok) {
          const data = await response.json();
          const stockAvailable = data.available || 0;
          setInventoryMap(prev => new Map(prev).set(variantId, stockAvailable));
          
          if (newQuantity > stockAvailable) {
            alert(`רק ${stockAvailable} יחידות זמינות במלאי`);
            setLoadingInventory(prev => {
              const next = new Set(prev);
              next.delete(variantId);
              return next;
            });
            return;
          }
        }
      } catch (error) {
        console.error('Error checking inventory:', error);
      } finally {
        setLoadingInventory(prev => {
          const next = new Set(prev);
          next.delete(variantId);
          return next;
        });
      }
    }

    updateQuantity(variantId, newQuantity);
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeCart]);

  return (
    <>
      {/* Cart Button */}
      <button
        onClick={openCart}
        className="relative flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <HiShoppingCart className="w-5 h-5 text-gray-600" />
        {isMounted && cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {cartCount}
          </span>
        )}
      </button>

      {/* Side Cart Drawer */}
      {shouldRender && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ease-in-out ${
              isAnimating ? 'opacity-50' : 'opacity-0'
            }`}
            onClick={closeCart}
          />

          {/* Drawer - אנימציה מ-left ל-right (RTL) */}
          <div 
            className={`fixed top-0 left-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
              isAnimating ? 'translate-x-0' : '-translate-x-full'
            }`}
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">עגלת קניות</h2>
              <button
                onClick={closeCart}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <HiX className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {cartItems.length === 0 && !isAddingToCart && !isLoadingFromServer && !calcLoading ? (
                <div className="text-center py-12">
                  <HiShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">העגלה שלך ריקה</p>
                  <Link
                    href="/products"
                    onClick={closeCart}
                    className="inline-block text-green-600 hover:text-green-700 font-medium"
                  >
                    המשך לקניות
                  </Link>
                </div>
              ) : (isLoadingFromServer && cartItems.length === 0) ? (
                <div className="space-y-4">
                  {/* סקלטון לטעינה ראשונית */}
                  <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg animate-pulse">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ) : (calcLoading || isAddingToCart) ? (
                <div className="space-y-4">
                  {/* סקלטון לפריטים קיימים */}
                  {cartItems.map((item) => (
                    <div key={item.variant_id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg animate-pulse">
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                  {/* סקלטון לפריט חדש שנוסף */}
                  {isAddingToCart && (
                    <div className="flex items-center gap-4 p-4 border-2 border-green-300 border-dashed rounded-lg animate-pulse bg-green-50">
                      <div className="w-20 h-20 bg-green-200 rounded-lg flex-shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-green-200 rounded w-3/4"></div>
                        <div className="h-4 bg-green-200 rounded w-1/2"></div>
                        <div className="h-4 bg-green-200 rounded w-1/4"></div>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-green-200 rounded"></div>
                      </div>
                    </div>
                  )}
                </div>
              ) : !calculation || (calculation.items.length === 0 && cartItems.length > 0) ? (
                // אם אין calculation אבל יש cartItems - מציגים skeleton עד שהחישוב מוכן
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.variant_id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg animate-pulse">
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {calculation.items.map((calculatedItem, index) => {
                    const item = calculatedItem.item;
                    const hasDiscount = calculatedItem.lineDiscount > 0;
                    
                    return (
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
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">{item.product_title}</h3>
                              {/* הצגת אפשרויות שנבחרו (מידה, צבע וכו') */}
                              {(() => {
                                const properties = propertiesMap.get(item.variant_id) || item.properties;
                                if (properties && properties.length > 0) {
                                  return (
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {properties.map((prop, idx) => (
                                        <span key={idx} className="text-xs text-gray-600">
                                          <span className="font-medium">{prop.name}:</span> {prop.value}
                                        </span>
                                      ))}
                                    </div>
                                  );
                                } else if (item.variant_title && item.variant_title !== 'Default Title') {
                                  return (
                                    <p className="text-sm text-gray-500 mt-1">{item.variant_title}</p>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                            {/* כפתור מחיקה */}
                            <button
                              onClick={() => removeFromCart(item.variant_id)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                              aria-label="מחק פריט"
                            >
                              <HiTrash className="w-4 h-4 text-gray-500 hover:text-red-600" />
                            </button>
                          </div>

                          {/* כמות ומחיר */}
                          <div className="flex items-center justify-between mt-3">
                            {/* שינוי כמות */}
                            <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
                              <button
                                onClick={() => handleQuantityChange(item.variant_id, item.quantity - 1)}
                                disabled={loadingInventory.has(item.variant_id)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                                aria-label="הפחת כמות"
                              >
                                <HiMinus className="w-4 h-4 text-gray-600" />
                              </button>
                              <span className="text-sm font-medium text-gray-900 min-w-[2rem] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(item.variant_id, item.quantity + 1)}
                                disabled={
                                  loadingInventory.has(item.variant_id) ||
                                  (inventoryMap.get(item.variant_id) !== undefined && 
                                   item.quantity >= (inventoryMap.get(item.variant_id) || 0))
                                }
                                className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="הוסף כמות"
                              >
                                <HiPlus className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>

                            {/* מחיר */}
                            <div className="flex flex-col items-end gap-1">
                              {hasDiscount ? (
                                <>
                                  <p className="text-xs text-gray-400 line-through">
                                    ₪{calculatedItem.lineTotal.toFixed(2)}
                                  </p>
                                  <p className="text-sm font-semibold text-gray-900">
                                    ₪{calculatedItem.lineTotalAfterDiscount.toFixed(2)}
                                  </p>
                                </>
                              ) : (
                                <p className="text-sm font-semibold text-gray-900">
                                  ₪{calculatedItem.lineTotal.toFixed(2)}
                                </p>
                              )}
                              {hasDiscount && (
                                <p className="text-xs font-semibold text-green-600">
                                  -₪{calculatedItem.lineDiscount.toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Applied Discounts Badge */}
                          {hasDiscount && calculatedItem.appliedDiscounts && calculatedItem.appliedDiscounts.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {calculatedItem.appliedDiscounts.map((discount, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded"
                                >
                                  {discount.source === 'automatic' ? 'אוטומטי' : discount.code || 'הנחה'}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cart Summary */}
            {cartItems.length > 0 && (
              <div className="border-t border-gray-200 p-4">
                <CartSummary
                  storeId={storeId}
                  shippingRate={shippingRate}
                  isNavigatingToCheckout={isNavigatingToCheckout}
                  onCheckout={async () => {
                    setIsNavigatingToCheckout(true);
                    // רענון אחרון של החישוב לפני מעבר לצ'ק אאוט
                    await recalculate();
                    // המתין קצת כדי שהמשתמש יראה את החיווי לפני סגירת העגלה
                    setTimeout(() => {
                      closeCart();
                      // אם יש storeSlug, נפנה ל-/shops/[storeSlug]/checkout
                      // אחרת נפנה ל-/checkout (דומיין מותאם אישית)
                      if (storeSlug) {
                        router.push(`/shops/${storeSlug}/checkout`);
                      } else {
                        router.push('/checkout');
                      }
                    }, 600); // 600ms כדי שהמשתמש יראה את החיווי לפני סגירת העגלה
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

