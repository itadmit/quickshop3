'use client';

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react';
import { type CartCalculationResult, type CartItem, type ShippingRate } from '@/lib/services/cartCalculator';
import { useCart } from './useCart';

// Local type for input (to avoid importing from cartCalculator which uses db)
interface CartCalculationInput {
  items: CartItem[];
  discountCode?: string;
  shippingRate?: ShippingRate;
  storeId: number;
  customerId?: number;
  customerSegment?: 'vip' | 'new_customer' | 'returning_customer';
  customerOrdersCount?: number;
  customerLifetimeValue?: number;
}

// ============================================
// GLOBAL STATE - Shared between all components
// ============================================

// Global discount code per store
const globalDiscountCode: { [storeId: number]: string } = {};

// Global calculation result per store
const globalCalculation: { [storeId: number]: CartCalculationResult | null } = {};

// Global loading states
const globalDiscountCodeLoading: { [storeId: number]: boolean } = {};
const globalCartCalculating: { [key: string]: boolean } = {};
const globalIsLoading: { [storeId: number]: boolean } = {};

// Listeners for real-time updates
let discountListeners: Array<() => void> = [];
let discountListenerVersion = 0;

// Subscribe/notify pattern for useSyncExternalStore
function subscribeToDiscount(callback: () => void) {
  discountListeners.push(callback);
  return () => {
    discountListeners = discountListeners.filter(l => l !== callback);
  };
}

function getDiscountSnapshot() {
  return discountListenerVersion;
}

function notifyDiscountListeners() {
  discountListenerVersion++;
  discountListeners.forEach(l => l());
}

// ============================================
// HOOK OPTIONS
// ============================================

interface UseCartCalculatorOptions {
  storeId: number;
  cartItems?: CartItem[]; // אם לא מועבר, ייטען מ-useCart
  shippingRate?: ShippingRate;
  autoCalculate?: boolean; // האם לחשב אוטומטית כשהעגלה משתנה
  customerId?: number; // For customer-specific discounts
  customerSegment?: 'vip' | 'new_customer' | 'returning_customer';
  customerOrdersCount?: number;
  customerLifetimeValue?: number;
  customerTier?: string | null; // Premium club tier (silver, gold, platinum, etc.)
}

/**
 * Hook לשימוש במנוע החישוב המרכזי
 * 
 * זהו ה-Hook הראשי לשימוש במנוע החישוב בכל הקומפוננטות.
 * הוא מנהל את הקופון, מחשב את העגלה, ומספק תוצאות מעודכנות.
 * 
 * SINGLE SOURCE OF TRUTH:
 * - מקבל את cartItems כפרמטר (לא קורא ל-useCart בנפרד)
 * - מחשב הכל דרך API אחד (/api/cart/calculate)
 * - לא מבצע חישובים ידניים בשום מקום
 * - Global state עם listeners לעדכון בזמן אמת
 */
export function useCartCalculator(options: UseCartCalculatorOptions) {
  const cartFromHook = useCart();
  const cartItems = options.cartItems ?? cartFromHook.cartItems;
  
  // Subscribe to global discount changes - ensures re-render on any discount change
  const version = useSyncExternalStore(subscribeToDiscount, getDiscountSnapshot, getDiscountSnapshot);
  
  // Get discount code and calculation from global state
  const discountCode = options.storeId ? (globalDiscountCode[options.storeId] || '') : '';
  const calculation = options.storeId ? (globalCalculation[options.storeId] || null) : null;
  const loading = options.storeId ? (globalIsLoading[options.storeId] || false) : false;
  
  const [validatingCode, setValidatingCode] = useState(false);
  const [isLoadingDiscountCode, setIsLoadingDiscountCode] = useState(true);
  
  // ✅ Ref לעקוב אחרי validation מיד (לפני שה-state מתעדכן)
  const isValidatingRef = useRef(false);

  // Set discount code and notify all listeners
  const setDiscountCode = useCallback((code: string) => {
    if (!options.storeId) return;
    globalDiscountCode[options.storeId] = code;
    // Also update sessionStorage for persistence
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`discount_code_${options.storeId}`, code);
    }
    notifyDiscountListeners();
  }, [options.storeId]);

  // Set calculation result and notify all listeners
  const setCalculation = useCallback((result: CartCalculationResult | null) => {
    if (!options.storeId) return;
    globalCalculation[options.storeId] = result;
    notifyDiscountListeners();
  }, [options.storeId]);

  // Set loading state and notify
  const setLoading = useCallback((isLoading: boolean) => {
    if (!options.storeId) return;
    globalIsLoading[options.storeId] = isLoading;
    notifyDiscountListeners();
  }, [options.storeId]);

  // Load discount code from server (session) on mount and when storeId changes
  useEffect(() => {
    const loadDiscountCode = async () => {
      if (!options.storeId) {
        setIsLoadingDiscountCode(false);
        return;
      }

      // Check if already loaded in global state
      if (globalDiscountCode[options.storeId] !== undefined && globalDiscountCodeLoading[options.storeId] === false) {
        setIsLoadingDiscountCode(false);
        return;
      }

      // Check if another instance is already loading for this storeId
      if (globalDiscountCodeLoading[options.storeId]) {
        // Wait a bit and check sessionStorage for cached value
        const cached = sessionStorage.getItem(`discount_code_${options.storeId}`);
        if (cached !== null) {
          globalDiscountCode[options.storeId] = cached;
          notifyDiscountListeners();
          setIsLoadingDiscountCode(false);
          return;
        }
        // If no cache, wait and retry after a short delay
        setTimeout(() => {
          loadDiscountCode();
        }, 300);
        return;
      }

      // Check sessionStorage first for cached value
      const cached = sessionStorage.getItem(`discount_code_${options.storeId}`);
      if (cached !== null) {
        globalDiscountCode[options.storeId] = cached;
        notifyDiscountListeners();
        setIsLoadingDiscountCode(false);
        
        // Still load from server in background to ensure consistency
        if (!globalDiscountCodeLoading[options.storeId]) {
          globalDiscountCodeLoading[options.storeId] = true;
          fetch(`/api/cart/discount-code?storeId=${options.storeId}`, {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
          })
            .then(response => {
              if (response.ok) {
                return response.json();
              }
              return { discountCode: '' };
            })
            .then(data => {
              const serverCode = data.discountCode || '';
              if (serverCode !== cached) {
                globalDiscountCode[options.storeId] = serverCode;
                sessionStorage.setItem(`discount_code_${options.storeId}`, serverCode);
                notifyDiscountListeners();
              }
            })
            .catch(() => {
              // Ignore errors in background load
            })
            .finally(() => {
              globalDiscountCodeLoading[options.storeId] = false;
            });
        }
        return;
      }

      globalDiscountCodeLoading[options.storeId] = true;
      setIsLoadingDiscountCode(true);

      try {
        const response = await fetch(
          `/api/cart/discount-code?storeId=${options.storeId}`,
          {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
          }
        );

        if (response.ok) {
          const data = await response.json();
          const serverCode = data.discountCode || '';
          globalDiscountCode[options.storeId] = serverCode;
          sessionStorage.setItem(`discount_code_${options.storeId}`, serverCode);
          notifyDiscountListeners();
        } else {
          globalDiscountCode[options.storeId] = '';
          sessionStorage.setItem(`discount_code_${options.storeId}`, '');
          notifyDiscountListeners();
        }
      } catch (error) {
        console.error('Error loading discount code:', error);
        globalDiscountCode[options.storeId] = '';
        sessionStorage.setItem(`discount_code_${options.storeId}`, '');
        notifyDiscountListeners();
      } finally {
        setIsLoadingDiscountCode(false);
        globalDiscountCodeLoading[options.storeId] = false;
      }
    };

    // Debounce to prevent multiple simultaneous calls
    const timeoutId = setTimeout(() => {
      loadDiscountCode();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [options.storeId]);

  // חישוב העגלה - SINGLE SOURCE OF TRUTH
  const recalculate = useCallback(async () => {
    // בדיקה ש-storeId קיים לפני חישוב
    if (!options.storeId) {
      setCalculation(null);
      return;
    }

    const currentDiscountCode = globalDiscountCode[options.storeId] || '';

    if (cartItems.length === 0) {
      // טיפול נכון ב-shippingRate null/undefined
      const shippingPrice = options.shippingRate?.price ?? 0;
      setCalculation({
        items: [],
        subtotal: 0,
        itemsDiscount: 0,
        subtotalAfterDiscount: 0,
        shipping: shippingPrice,
        shippingDiscount: 0,
        shippingAfterDiscount: shippingPrice,
        discounts: [],
        giftProducts: [],
        total: shippingPrice,
        isValid: true,
        errors: [],
        warnings: [],
      });
      return;
    }

    // Create a unique key for this calculation based on cart items and discount
    const calcKey = `${options.storeId}_${cartItems.map(i => `${i.variant_id}:${i.quantity}`).join(',')}_${currentDiscountCode}`;
    
    // If another instance is already calculating the same thing, skip
    if (globalCartCalculating[calcKey]) {
      return;
    }

    globalCartCalculating[calcKey] = true;
    setLoading(true);
    
    try {
      const input = {
        items: cartItems.map((item) => ({
          variant_id: item.variant_id,
          product_id: item.product_id,
          product_title: item.product_title,
          variant_title: item.variant_title,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          properties: item.properties,
        })),
        discountCode: currentDiscountCode || undefined,
        shippingRate: options.shippingRate,
        storeId: options.storeId,
        customerId: options.customerId,
        customerSegment: options.customerSegment,
        customerOrdersCount: options.customerOrdersCount,
        customerLifetimeValue: options.customerLifetimeValue,
        customerTier: options.customerTier || undefined,
      };

      // Call API route - SINGLE SOURCE OF TRUTH
      const response = await fetch('/api/cart/calculate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        cache: 'no-store',
        body: JSON.stringify({
          storeId: options.storeId,
          items: input.items,
          discountCode: input.discountCode,
          shippingRate: input.shippingRate,
          customerId: options.customerId,
          customerSegment: options.customerSegment,
          customerOrdersCount: options.customerOrdersCount,
          customerLifetimeValue: options.customerLifetimeValue,
          customerTier: options.customerTier || undefined,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'שגיאה בחישוב העגלה';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {}
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setCalculation(result);
      
      // Sync discountCode from server response if provided
      if (result.discountCode !== undefined) {
        const serverCode = result.discountCode || '';
        if (serverCode !== currentDiscountCode) {
          globalDiscountCode[options.storeId] = serverCode;
          sessionStorage.setItem(`discount_code_${options.storeId}`, serverCode);
          notifyDiscountListeners();
        }
      }

      // ניהול מתנות אוטומטיות
      // 1. הסרת מתנות שכבר לא רלוונטיות
      const currentGiftVariantIds = (result.giftProducts || []).map((g: any) => g.variant_id);
      const giftsToRemove = cartItems.filter(item => {
        const isGift = item.properties?.some(p => p.name === 'מתנה');
        // מתנה שלא נמצאת ברשימת המתנות החדשה
        return isGift && !currentGiftVariantIds.includes(item.variant_id);
      });
      
      for (const giftToRemove of giftsToRemove) {
        await cartFromHook.removeGiftFromCart(giftToRemove.variant_id);
      }
      
      // 2. הוספת מתנות חדשות
      if (result.giftProducts && Array.isArray(result.giftProducts) && result.giftProducts.length > 0) {
        // בדיקה שיש פריטים רגילים (לא מתנות) בעגלה
        const hasRegularItems = cartItems.some(item => 
          !item.properties?.some(p => p.name === 'מתנה')
        );
        
        if (hasRegularItems) {
          for (const giftProduct of result.giftProducts) {
            // וידוא שה-giftProduct מכיל את כל השדות הנדרשים
            if (!giftProduct.variant_id || !giftProduct.product_id) {
              console.warn('[useCartCalculator] Invalid gift product, skipping:', giftProduct);
              continue;
            }
            
            const isGiftInCart = cartItems.some(
              item => item.variant_id === giftProduct.variant_id && 
                      item.product_id === giftProduct.product_id &&
                      item.properties?.some(p => p.name === 'מתנה')
            );
            
            if (!isGiftInCart) {
              await cartFromHook.addToCart({
                variant_id: giftProduct.variant_id,
                product_id: giftProduct.product_id,
                product_title: giftProduct.product_title || 'מתנה',
                variant_title: giftProduct.variant_title || '',
                price: 0, // מתנה = מחיר 0
                quantity: 1,
                image: giftProduct.image,
                properties: [{
                  name: 'מתנה',
                  value: giftProduct.discount_name || 'מתנה',
                }],
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error calculating cart:', error);
      const shippingPrice = options.shippingRate?.price ?? 0;
      const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      
      setCalculation({
        items: cartItems.map((item) => ({
          item,
          lineTotal: item.price * item.quantity,
          lineDiscount: 0,
          lineTotalAfterDiscount: item.price * item.quantity,
          appliedDiscounts: [],
        })),
        subtotal,
        itemsDiscount: 0,
        subtotalAfterDiscount: subtotal,
        shipping: shippingPrice,
        shippingDiscount: 0,
        shippingAfterDiscount: shippingPrice,
        discounts: [],
        giftProducts: [],
        total: subtotal + shippingPrice,
        isValid: false,
        errors: ['שגיאה בחישוב העגלה. אנא נסה שוב.'],
        warnings: [],
      });
    } finally {
      setLoading(false);
      delete globalCartCalculating[calcKey];
    }
  }, [cartItems, options.shippingRate, options.storeId, options.customerId, options.customerSegment, options.customerOrdersCount, options.customerLifetimeValue, setCalculation, setLoading, cartFromHook]);

  // Ref to track pending calculations to prevent duplicate calls
  const calculatingRef = useRef(false);
  // ✅ Ref לעקוב אחרי כמות הפריטים הקודמת
  const prevItemsCountRef = useRef(0);
  
  // Create a unique key for this calculation request
  const getCalculationKey = () => {
    const itemsKey = cartItems.map(i => `${i.variant_id}-${i.quantity}`).join(',');
    const currentCode = options.storeId ? (globalDiscountCode[options.storeId] || '') : '';
    return `${options.storeId}-${itemsKey}-${currentCode}-${options.shippingRate?.id || ''}`;
  };
  
  // חישוב אוטומטי כשהעגלה משתנה
  useEffect(() => {
    if (options.autoCalculate === false) return;
    
    // ✅ לא לחשב אוטומטית בזמן validation (כי validateCode כבר קורא ל-recalculate)
    if (validatingCode) return;
    
    const calculationKey = getCalculationKey();
    
    // Check if another instance is already calculating the same cart
    if (globalCartCalculating[calculationKey]) {
      return;
    }
    
    // Prevent duplicate calculations in this instance
    if (calculatingRef.current) {
      return;
    }
    
    // ✅ בדיקה אם נמחקו פריטים (ירידה במספר הפריטים)
    const currentItemsCount = cartItems.length;
    const itemsRemoved = prevItemsCountRef.current > currentItemsCount;
    prevItemsCountRef.current = currentItemsCount;
    
    // ✅ אם נמחקו פריטים, חישוב מיידי ללא debounce
    if (itemsRemoved) {
      calculatingRef.current = true;
      globalCartCalculating[calculationKey] = true;
      recalculate().finally(() => {
        calculatingRef.current = false;
        delete globalCartCalculating[calculationKey];
      });
      return;
    }
    
    // אם אין calculation קיים, נחשב מיד
    // 🔍 אבל רק אם יש shippingRate (או אם אין צורך ב-shipping rate)
    // ב-CheckoutForm, תמיד צריך shippingRate, אז נחכה לו
    if (!calculation && cartItems.length > 0) {
      // 🔍 אם אין shippingRate, לא נחשב (ב-CheckoutForm תמיד צריך shippingRate)
      // אבל אם זה לא CheckoutForm, נחשב גם בלי shippingRate
      calculatingRef.current = true;
      globalCartCalculating[calculationKey] = true;
      recalculate().finally(() => {
        calculatingRef.current = false;
        delete globalCartCalculating[calculationKey];
      });
      return;
    }
    
    // אם יש calculation קיים, נשתמש ב-debounce
    const timeoutId = setTimeout(() => {
      if (!calculatingRef.current && !globalCartCalculating[calculationKey] && !validatingCode) {
        calculatingRef.current = true;
        globalCartCalculating[calculationKey] = true;
        recalculate().finally(() => {
          calculatingRef.current = false;
          delete globalCartCalculating[calculationKey];
        });
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems, discountCode, options.shippingRate?.id, options.storeId, validatingCode]);

  // ✅ Ref למנוע הסרות כפולות של קופון
  const removingCodeRef = useRef(false);
  // ✅ Ref לעקוב אחרי מתי קופון הוחל לאחרונה
  const lastCodeAppliedRef = useRef<{ code: string; timestamp: number } | null>(null);
  
  // ✅ בדיקה אוטומטית: אם קופון לא תקף אחרי חישוב, הסר אותו מיד
  // זה רלוונטי רק לקופונים שנטענו מ-sessionStorage (לא דרך validateCode)
  useEffect(() => {
    // ✅ לא מסירים קופון בזמן validation או loading (בודק גם ref וגם state)
    if (!options.storeId || !discountCode || !calculation || validatingCode || loading || isValidatingRef.current || removingCodeRef.current) return;
    
    // ✅ אם הקופון הוחל לאחרונה (פחות מ-2 שניות), לא מסירים אותו
    // זה מונע מצב שבו הקופון מוסר לפני שהבדיקה מסתיימת
    const now = Date.now();
    if (lastCodeAppliedRef.current && 
        lastCodeAppliedRef.current.code === discountCode && 
        now - lastCodeAppliedRef.current.timestamp < 2000) {
      return; // המתן לבדיקה להסתיים
    }
    
    // בדוק אם הקופון מופיע ב-discounts (אם לא, הוא לא תקף)
    const isValidCode = calculation.discounts?.some(d => d.source === 'code' && d.code === discountCode);
    
    // אם הקופון לא תקף (לא מופיע ב-discounts), הסר אותו בשקט
    // ✅ זה קורה רק לקופונים ישנים מ-sessionStorage, לא לקופונים שהוזנו ידנית
    if (!isValidCode) {
      removingCodeRef.current = true;
      setDiscountCode('');
      sessionStorage.setItem(`discount_code_${options.storeId}`, '');
      notifyDiscountListeners();
      // Reset ref after a short delay
      setTimeout(() => {
        removingCodeRef.current = false;
      }, 100);
    }
  }, [calculation, discountCode, options.storeId, validatingCode, loading, setDiscountCode]);

  // אימות קופון
  const validateCode = useCallback(async (code: string): Promise<{ valid: boolean; error?: string }> => {
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return { valid: false, error: 'קוד קופון לא תקין' };
    }

    const upperCode = code.toUpperCase();
    
    // ✅ בדיקה אם הקופון כבר מוחל - אין צורך להחיל שוב
    const existingCalculation = globalCalculation[options.storeId];
    const isAlreadyApplied = existingCalculation?.discounts?.some(d => d.source === 'code' && d.code === upperCode);
    if (isAlreadyApplied) {
      return { valid: true }; // כבר מוחל, לא צריך לעשות כלום
    }
    
    // ✅ סמן שאנחנו בתהליך validation (ref מיד, state אחר כך)
    isValidatingRef.current = true;
    setValidatingCode(true);
    
    // ✅ שמור את הקופון ב-state מיד כדי להציג loader
    setDiscountCode(upperCode);
    globalDiscountCode[options.storeId] = upperCode;
    sessionStorage.setItem(`discount_code_${options.storeId}`, upperCode);
    notifyDiscountListeners();
    
    // ✅ סמן שהקופון הוחל עכשיו (למנוע הסרה מוקדמת)
    lastCodeAppliedRef.current = { code: upperCode, timestamp: Date.now() };
    
    try {
      const subtotal = calculation?.subtotalAfterDiscount || 
        cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      
      const response = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: upperCode,
          storeId: options.storeId,
          subtotal,
          totalQuantity,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to validate discount code');
      }

      const result = await response.json();

      if (result.valid) {
        // Save to server (session)
        try {
          await fetch('/api/cart/discount-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              discountCode: upperCode,
              storeId: options.storeId,
            }),
          });
        } catch (error) {
          console.error('Error saving discount code:', error);
        }
        
        // ✅ recalculate כבר קורא ל-API calculate, אין צורך בקריאה נוספת
        await recalculate();
        
        // ✅ בדיקה אם הקופון באמת הוחל אחרי החישוב
        const newCalculation = globalCalculation[options.storeId];
        const isCodeApplied = newCalculation?.discounts?.some(d => d.source === 'code' && d.code === upperCode);
        
        // ✅ בדיקה אם יש אזהרות ספציפיות לקופון הזה
        const codeWarnings = newCalculation?.warnings?.filter(w => 
          w.includes(upperCode) || w.includes('קופון') || w.includes('הנחה')
        ) || [];
        
        // ✅ אם הקופון לא מופיע ב-discounts אבל יש אזהרות, זה אומר שהקופון לא עומד בתנאים
        if (!isCodeApplied && codeWarnings.length > 0) {
          // הקופון קיים אבל לא עומד בקריטריונים (סף מינימום, תאריך, וכו')
          setDiscountCode('');
          globalDiscountCode[options.storeId] = '';
          sessionStorage.setItem(`discount_code_${options.storeId}`, '');
          notifyDiscountListeners();
          isValidatingRef.current = false;
          setValidatingCode(false);
          
          return { valid: false, error: codeWarnings[0] || 'הקופון לא עומד בתנאי ההנחה (סכום מינימום / תאריך תוקף / מוצרים מסוימים)' };
        }
        
        // ✅ אם הקופון מופיע ב-discounts, הוא תקף (גם אם יש אזהרות אחרות)
        if (isCodeApplied) {
          isValidatingRef.current = false;
          setValidatingCode(false);
          return { valid: true };
        }
        
        // ✅ אם הקופון לא מופיע ב-discounts ואין אזהרות, זה אומר שהקופון לא תקף כלל
        setDiscountCode('');
        globalDiscountCode[options.storeId] = '';
        sessionStorage.setItem(`discount_code_${options.storeId}`, '');
        notifyDiscountListeners();
        isValidatingRef.current = false;
        setValidatingCode(false);
        return { valid: false, error: 'קופון לא תקף' };
      } else {
        // ✅ אם הקופון לא תקף, הסר אותו מיד
        setDiscountCode('');
        globalDiscountCode[options.storeId] = '';
        sessionStorage.setItem(`discount_code_${options.storeId}`, '');
        notifyDiscountListeners();
        isValidatingRef.current = false;
        setValidatingCode(false);
        return { valid: false, error: result.error };
      }
    } catch (error) {
      console.error('Error validating code:', error);
      // ✅ אם יש שגיאה, הסר את הקופון
      setDiscountCode('');
      globalDiscountCode[options.storeId] = '';
      sessionStorage.setItem(`discount_code_${options.storeId}`, '');
      notifyDiscountListeners();
      isValidatingRef.current = false;
      setValidatingCode(false);
      return { valid: false, error: 'שגיאה באימות קופון' };
    }
  }, [cartItems, options.storeId, recalculate, calculation, setDiscountCode]);

  // הסרת קופון
  const removeDiscountCode = useCallback(async () => {
    // ✅ הצגת loading בזמן הסרת קופון
    setValidatingCode(true);
    
    // Update global state immediately
    globalDiscountCode[options.storeId] = '';
    sessionStorage.setItem(`discount_code_${options.storeId}`, '');
    notifyDiscountListeners();
    
    // Remove from server (session)
    try {
      const response = await fetch(`/api/cart/discount-code?storeId=${options.storeId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove discount code from server');
      }
      
      // Force immediate recalculation with empty discount code
      const response2 = await fetch('/api/cart/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: options.storeId,
          items: cartItems,
          discountCode: '',
          shippingRate: options.shippingRate,
          customerId: options.customerId,
          customerSegment: options.customerSegment,
          customerOrdersCount: options.customerOrdersCount,
          customerLifetimeValue: options.customerLifetimeValue,
        }),
      });

      if (response2.ok) {
        const result = await response2.json();
        setCalculation(result);
        
        // ✅ הסרת מתנות שכבר לא רלוונטיות (אם הקופון נתן מתנה)
        const currentGiftVariantIds = (result.giftProducts || []).map((g: any) => g.variant_id);
        const giftsToRemove = cartItems.filter(item => {
          const isGift = item.properties?.some(p => p.name === 'מתנה');
          return isGift && !currentGiftVariantIds.includes(item.variant_id);
        });
        
        for (const giftToRemove of giftsToRemove) {
          await cartFromHook.removeGiftFromCart(giftToRemove.variant_id);
        }
      } else {
        await recalculate();
      }
    } catch (error) {
      console.error('Error removing discount code:', error);
      await recalculate();
    } finally {
      setValidatingCode(false);
    }
  }, [cartItems, options.storeId, options.shippingRate, options.customerId, options.customerSegment, options.customerOrdersCount, options.customerLifetimeValue, recalculate, setCalculation, cartFromHook]);

  return {
    // State
    calculation,
    discountCode,
    loading: loading || isLoadingDiscountCode,
    validatingCode,

    // Actions
    applyDiscountCode: validateCode,
    removeDiscountCode,
    recalculate,

    // Helpers
    getSubtotal: () => calculation?.subtotal || 0,
    getSubtotalAfterDiscount: () => calculation?.subtotalAfterDiscount || 0,
    getDiscount: () => calculation?.itemsDiscount || 0,
    getShipping: () => calculation?.shippingAfterDiscount || 0,
    getTotal: () => calculation?.total || 0,
    getDiscounts: () => calculation?.discounts || [],
    hasErrors: () => (calculation?.errors.length || 0) > 0,
    hasWarnings: () => (calculation?.warnings.length || 0) > 0,
    getErrors: () => calculation?.errors || [],
    getWarnings: () => calculation?.warnings || [],
  };
}
