'use client';

import { useEffect, useState, useRef } from 'react';
import { useCart } from '@/hooks/useCart';
import { useCartOpen } from '@/hooks/useCartOpen';
import { useCartCalculator } from '@/hooks/useCartCalculator';
import { CartSummary } from '@/components/storefront/CartSummary';
import { HiShoppingCart, HiX, HiTrash, HiPlus, HiMinus } from 'react-icons/hi';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';

// Global state to track variant data loading across all SideCart instances
const globalVariantLoading: { [variantId: number]: boolean } = {};
const globalVariantDataCache: {
  inventory: Map<number, number>;
  properties: Map<number, Array<{ name: string; value: string }>>;
  lastUpdate: number;
} = {
  inventory: new Map(),
  properties: new Map(),
  lastUpdate: 0,
};
const CACHE_TTL_MS = 5000; // 5 seconds cache

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
  const { t } = useTranslation('storefront');
  
  // State לניהול מלאי לכל variant
  const [inventoryMap, setInventoryMap] = useState<Map<number, number>>(new Map());
  const [loadingInventory, setLoadingInventory] = useState<Set<number>>(new Set());
  
  // State לניהול אפשרויות (properties) לכל variant
  const [propertiesMap, setPropertiesMap] = useState<Map<number, Array<{ name: string; value: string }>>>(new Map());

  // שימוש במנוע החישוב המרכזי
  // SINGLE SOURCE OF TRUTH: מעביר את cartItems מ-useCart ל-useCartCalculator
  const {
    calculation,
    discountCode,
    loading: calcLoading,
    getSubtotal,
    getDiscount,
    getTotal,
    getDiscounts,
    applyDiscountCode,
    removeDiscountCode,
    recalculate,
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

  // Force update cart count when cartItems change (even before mount)
  // This ensures the badge shows immediately when cart is loaded
  useEffect(() => {
    // Force re-render when cartItems change
  }, [cartItems]);

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
  // ✅ תיקון: לא טוענים מהשרת כשפותחים - משתמשים רק במה שיש ב-localStorage
  // הטעינה מהשרת כבר קרתה ב-useCart בטעינת העמוד, אז אין צורך בטעינה נוספת
  // זה מונע את העיכוב של 3-6 שניות ואת ה"קפיצה"
  
  // אם בעתיד נרצה לטעון מהשרת כשפותחים, אפשר להחזיר את הקוד הזה:
  // const refreshingRef = useRef(false);
  // useEffect(() => {
  //   if (isOpen && storeId && !isAddingToCart && !refreshingRef.current) {
  //     refreshingRef.current = true;
  //     setTimeout(() => {
  //       refreshCart().finally(() => { refreshingRef.current = false; });
  //     }, 500);
  //   }
  // }, [isOpen, storeId]);

  // טעינת מלאי ואפשרויות לכל variant בעגלה
  // ✅ תיקון: מונע קריאות כפולות עם global state ו-cache
  const loadingVariantDataRef = useRef(false);
  
  useEffect(() => {
    // מונע קריאות כפולות
    if (loadingVariantDataRef.current) {
      return;
    }

    const loadVariantData = async () => {
      if (cartItems.length === 0) {
        setInventoryMap(new Map());
        setPropertiesMap(new Map());
        return;
      }

      loadingVariantDataRef.current = true;
      
      const variantIds = [...new Set(cartItems.map(item => item.variant_id))]; // ✅ מונע כפילויות
      const now = Date.now();
      
      // בדיקה אם ה-cache עדיין תקף
      const isCacheValid = (now - globalVariantDataCache.lastUpdate) < CACHE_TTL_MS;
      
      // רק variants שלא נטענו לאחרונה או שאין להם cache
      const variantsToLoad = variantIds.filter(id => {
        if (isCacheValid && globalVariantDataCache.inventory.has(id)) {
          return false; // יש cache תקף
        }
        if (globalVariantLoading[id]) {
          return false; // כבר נטען על ידי instance אחר
        }
        return true;
      });
      
      // טעינה מ-cache אם יש
      if (isCacheValid) {
        const cachedInventory = new Map<number, number>();
        const cachedProperties = new Map<number, Array<{ name: string; value: string }>>();
        
        variantIds.forEach(id => {
          if (globalVariantDataCache.inventory.has(id)) {
            cachedInventory.set(id, globalVariantDataCache.inventory.get(id)!);
          }
          if (globalVariantDataCache.properties.has(id)) {
            cachedProperties.set(id, globalVariantDataCache.properties.get(id)!);
          }
        });
        
        setInventoryMap(cachedInventory);
        setPropertiesMap(cachedProperties);
      }
      
      if (variantsToLoad.length === 0) {
        loadingVariantDataRef.current = false;
        return;
      }

      // סמן שטוענים
      variantsToLoad.forEach(id => {
        globalVariantLoading[id] = true;
      });

      const newInventoryMap = new Map(inventoryMap);
      const newPropertiesMap = new Map(propertiesMap);
      
      await Promise.all(
        variantsToLoad.map(async (variantId) => {
          try {
            // טעינת מלאי
            const inventoryResponse = await fetch(`/api/variants/${variantId}/inventory`, {
              cache: 'no-store',
            });
            if (inventoryResponse.ok) {
              const inventoryData = await inventoryResponse.json();
              const available = inventoryData.available || 0;
              newInventoryMap.set(variantId, available);
              globalVariantDataCache.inventory.set(variantId, available);
            }
            
            // טעינת אפשרויות
            const optionsResponse = await fetch(`/api/variants/${variantId}/options`, {
              cache: 'no-store',
            });
            if (optionsResponse.ok) {
              const optionsData = await optionsResponse.json();
              if (optionsData.properties && optionsData.properties.length > 0) {
                newPropertiesMap.set(variantId, optionsData.properties);
                globalVariantDataCache.properties.set(variantId, optionsData.properties);
              }
            }
          } catch (error) {
            console.error(`Error loading data for variant ${variantId}:`, error);
            // ✅ במקרה של שגיאה, לא נכשל - פשוט לא נציג מלאי
          } finally {
            delete globalVariantLoading[variantId];
          }
        })
      );
      
      globalVariantDataCache.lastUpdate = Date.now();
      setInventoryMap(newInventoryMap);
      setPropertiesMap(newPropertiesMap);
      loadingVariantDataRef.current = false;
    };

    // Debounce - לא לטעון אם טענו לאחרונה
    const timeoutId = setTimeout(() => {
      loadVariantData();
    }, 300);
    
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems.length, cartItems.map(item => item.variant_id).join(',')]); // ✅ תלוי רק ב-variant IDs, לא ב-cartItems עצמו

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
        {cartCount > 0 && (
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
              {cartItems.length === 0 && !calcLoading ? (
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
              ) : (cartItems.length === 0 && calcLoading) ? (
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
                    
                    // בדיקה אם זה מוצר מתנה (gift product)
                    const isGiftProduct = item.properties?.some(prop => prop.name === 'מתנה');
                    const giftDiscountName = item.properties?.find(prop => prop.name === 'מתנה')?.value;
                    
                    return (
                      <div key={item.variant_id} className={`flex items-center gap-4 p-4 border rounded-lg ${isGiftProduct ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
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
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900 truncate">{item.product_title}</h3>
                                {isGiftProduct && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-600 text-white rounded-full flex-shrink-0">
                                    {t('cart.gift')}
                                  </span>
                                )}
                              </div>
                              
                              {/* חיווי למוצר מתנה */}
                              {isGiftProduct && giftDiscountName && (
                                <p className="text-xs text-green-700 font-medium mt-1">
                                  {t('cart.gift_from_discount', { discount: giftDiscountName })}
                                </p>
                              )}
                              
                              {/* מטא-דאטה מתחת לכותרת: אפשרויות, variant title, וכו' */}
                              <div className="mt-1 space-y-1">
                                {/* הצגת אפשרויות שנבחרו (מידה, צבע וכו') - ללא המאפיין "מתנה" */}
                                {(() => {
                                  const properties = propertiesMap.get(item.variant_id) || item.properties;
                                  const filteredProperties = properties?.filter(prop => prop.name !== 'מתנה');
                                  if (filteredProperties && filteredProperties.length > 0) {
                                    return (
                                      <div className="flex flex-wrap gap-2">
                                        {filteredProperties.map((prop, idx) => (
                                          <span key={idx} className="text-xs text-gray-600">
                                            <span className="font-medium">{prop.name}:</span> {prop.value}
                                          </span>
                                        ))}
                                      </div>
                                    );
                                  } else if (item.variant_title && item.variant_title !== 'Default Title') {
                                    return (
                                      <p className="text-xs text-gray-500">{item.variant_title}</p>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </div>
                            {/* כפתור מחיקה - מוסתר למוצרי מתנה */}
                            {!isGiftProduct && (
                              <button
                                onClick={() => removeFromCart(item.variant_id)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                                aria-label={t('cart.remove_item')}
                              >
                                <HiTrash className="w-4 h-4 text-gray-500 hover:text-red-600" />
                              </button>
                            )}
                          </div>

                          {/* כמות ומחיר - המחיר מופיע רק כאן, ליד הכמות */}
                          <div className="flex items-center justify-between mt-3">
                            {/* שינוי כמות - מוצרי מתנה קבועים בכמות 1 */}
                            {isGiftProduct ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900 min-w-[2rem] text-center">
                                  {item.quantity}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
                                <button
                                  onClick={async () => {
                                    const newQuantity = item.quantity - 1;
                                    await handleQuantityChange(item.variant_id, newQuantity);
                                    // ✅ החישוב יתעדכן אוטומטית דרך useEffect ב-useCartCalculator
                                    // כי cartItems משתנה, אז לא צריך recalculate() ידני
                                  }}
                                  disabled={loadingInventory.has(item.variant_id)}
                                  className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                                  aria-label={t('cart.decrease_quantity')}
                                >
                                  <HiMinus className="w-4 h-4 text-gray-600" />
                                </button>
                                <span className="text-sm font-medium text-gray-900 min-w-[2rem] text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={async () => {
                                    const newQuantity = item.quantity + 1;
                                    await handleQuantityChange(item.variant_id, newQuantity);
                                  // ✅ החישוב יתעדכן אוטומטית דרך useEffect ב-useCartCalculator
                                  // כי cartItems משתנה, אז לא צריך recalculate() ידני
                                }}
                                disabled={
                                  loadingInventory.has(item.variant_id) ||
                                  (inventoryMap.get(item.variant_id) !== undefined && 
                                   item.quantity >= (inventoryMap.get(item.variant_id) || 0))
                                }
                                className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label={t('cart.increase_quantity')}
                              >
                                <HiPlus className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>
                            )}

                            {/* מחיר - מופיע רק כאן, ליד הכמות */}
                            {/* מציג מחיר מקורי מחוק אם יש הנחה, ואת המחיר הסופי */}
                            <div className="flex flex-col items-end gap-1">
                              {calculatedItem.lineDiscount > 0 ? (
                                <>
                                  <p className="text-xs text-gray-400 line-through">
                                    ₪{calculatedItem.lineTotal.toFixed(2)}
                                  </p>
                                  <p className="text-sm font-semibold text-gray-900">
                                    ₪{calculatedItem.lineTotalAfterDiscount.toFixed(2)}
                                  </p>
                                  {/* תווית הנחות אוטומטיות */}
                                  {calculatedItem.appliedDiscounts && calculatedItem.appliedDiscounts.length > 0 && (
                                    <div className="flex flex-col gap-1 items-end">
                                      {calculatedItem.appliedDiscounts
                                        .filter(discount => discount.source === 'automatic')
                                        .map((discount, idx) => (
                                          <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-purple-100 text-purple-700 rounded-full whitespace-nowrap">
                                            {discount.name}
                                          </span>
                                        ))
                                      }
                                    </div>
                                  )}
                                </>
                              ) : (
                                <p className="text-sm font-semibold text-gray-900">
                                  ₪{calculatedItem.lineTotalAfterDiscount.toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cart Summary & Actions */}
            {cartItems.length > 0 && (
              <div className="border-t border-gray-200 p-4 space-y-3 bg-gray-50">
                <CartSummary
                  storeId={storeId}
                  shippingRate={shippingRate}
                  isNavigatingToCheckout={isNavigatingToCheckout}
                  cartItems={cartItems}
                  calculation={calculation}
                  // לא מעבירים onCheckout כדי שהכפתור לא יופיע בתוך הסיכום
                />
                
                <div className="space-y-3 pt-2">
                  {/* כפתור מעבר לעגלה מלאה */}
                  <Link
                    href={storeSlug ? `/shops/${storeSlug}/cart` : '/cart'}
                    onClick={closeCart}
                    className="block w-full text-center bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    צפה בעגלה המלאה
                  </Link>

                  {/* כפתור צ'ק אאוט */}
                  <button
                    onClick={async () => {
                      setIsNavigatingToCheckout(true);
                      await recalculate();
                      closeCart();
                      if (storeSlug) {
                        router.push(`/shops/${storeSlug}/checkout`);
                      } else {
                        router.push('/checkout');
                      }
                    }}
                    disabled={!calculation?.isValid || calculation?.total === 0 || isNavigatingToCheckout}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isNavigatingToCheckout ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        עובר לצ'ק אאוט...
                      </>
                    ) : (
                      'המשך לצ\'ק אאוט'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

