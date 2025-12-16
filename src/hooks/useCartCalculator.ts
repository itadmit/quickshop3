'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { type CartCalculationResult, type CartItem, type ShippingRate } from '@/lib/services/cartCalculator';

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
import { useCart } from './useCart';

// Global state to track pending discount code loads across all instances
// This prevents multiple instances from making duplicate API calls
const globalDiscountCodeLoading: { [storeId: number]: boolean } = {};

// Global state to track pending cart calculations across all instances
// This prevents multiple instances from making duplicate calculation requests
const globalCartCalculating: { [key: string]: boolean } = {};

interface UseCartCalculatorOptions {
  storeId: number;
  cartItems?: CartItem[]; // אם לא מועבר, ייטען מ-useCart
  shippingRate?: ShippingRate;
  autoCalculate?: boolean; // האם לחשב אוטומטית כשהעגלה משתנה
  customerId?: number; // For customer-specific discounts
  customerSegment?: 'vip' | 'new_customer' | 'returning_customer';
  customerOrdersCount?: number;
  customerLifetimeValue?: number;
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
 */
export function useCartCalculator(options: UseCartCalculatorOptions) {
  const cartFromHook = useCart();
  const cartItems = options.cartItems ?? cartFromHook.cartItems;
  const [discountCode, setDiscountCode] = useState<string>('');
  const [calculation, setCalculation] = useState<CartCalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [validatingCode, setValidatingCode] = useState(false);
  const [isLoadingDiscountCode, setIsLoadingDiscountCode] = useState(true);

  // Load discount code from server (session) on mount and when storeId changes
  useEffect(() => {
    const loadDiscountCode = async () => {
      if (!options.storeId) {
        setIsLoadingDiscountCode(false);
        return;
      }

      // Check if another instance is already loading for this storeId
      if (globalDiscountCodeLoading[options.storeId]) {
        // Wait a bit and check sessionStorage for cached value
        const cached = sessionStorage.getItem(`discount_code_${options.storeId}`);
        if (cached !== null) {
          setDiscountCode(cached);
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
        setDiscountCode(cached);
        setIsLoadingDiscountCode(false);
        // Still load from server in background to ensure consistency, but don't block
        // Only one instance should load from server
        if (!globalDiscountCodeLoading[options.storeId]) {
          globalDiscountCodeLoading[options.storeId] = true;
          // Load from server in background without blocking UI
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
                setDiscountCode(serverCode);
                sessionStorage.setItem(`discount_code_${options.storeId}`, serverCode);
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
          // Always sync with server - this ensures consistency after refresh
          setDiscountCode(serverCode);
          // Cache in sessionStorage for other instances
          sessionStorage.setItem(`discount_code_${options.storeId}`, serverCode);
        } else {
          setDiscountCode('');
          sessionStorage.setItem(`discount_code_${options.storeId}`, '');
        }
      } catch (error) {
        console.error('Error loading discount code:', error);
        setDiscountCode('');
        sessionStorage.setItem(`discount_code_${options.storeId}`, '');
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

    if (cartItems.length === 0) {
      // טיפול נכון ב-shippingRate null/undefined
      // אם אין shippingRate, משלוח הוא 0 (לא צריך משלוח)
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
    const calcKey = `${options.storeId}_${cartItems.map(i => `${i.variant_id}:${i.quantity}`).join(',')}_${discountCode || ''}`;
    
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
        discountCode: discountCode || undefined,
        shippingRate: options.shippingRate,
        storeId: options.storeId,
        customerId: options.customerId,
        customerSegment: options.customerSegment,
        customerOrdersCount: options.customerOrdersCount,
        customerLifetimeValue: options.customerLifetimeValue,
      };

      // Call API route - SINGLE SOURCE OF TRUTH
      // כל החישובים נעשים ב-/api/cart/calculate
      // IMPORTANT: No cache - always get fresh prices for discounts and promotions
      const response = await fetch('/api/cart/calculate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        cache: 'no-store', // Prevent any caching
        body: JSON.stringify({
          storeId: options.storeId,
          items: input.items,
          discountCode: input.discountCode,
          shippingRate: input.shippingRate,
          customerId: options.customerId,
          customerSegment: options.customerSegment,
          customerOrdersCount: options.customerOrdersCount,
          customerLifetimeValue: options.customerLifetimeValue,
        }),
      });

      if (!response.ok) {
        // נסה לקרוא את הודעת השגיאה מהשרת
        let errorMessage = 'שגיאה בחישוב העגלה';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // אם לא ניתן לקרוא את ה-JSON, השתמש בהודעת ברירת מחדל
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setCalculation(result);
      
      // Sync discountCode from server response if provided
      // This ensures consistency after operations like remove/add
      if (result.discountCode !== undefined) {
        const serverCode = result.discountCode || '';
        if (serverCode !== discountCode) {
          setDiscountCode(serverCode);
        }
      }

      // הוספת מתנות אוטומטיות לעגלה
      if (result.giftProducts && Array.isArray(result.giftProducts) && result.giftProducts.length > 0) {
        for (const giftProduct of result.giftProducts) {
          // בדיקה אם המתנה כבר נמצאת בעגלה
          const isGiftInCart = cartItems.some(
            item => item.variant_id === giftProduct.variant_id && 
                    item.product_id === giftProduct.product_id
          );
          
          if (!isGiftInCart) {
            // הוספת המתנה לעגלה
            await cartFromHook.addToCart({
              variant_id: giftProduct.variant_id,
              product_id: giftProduct.product_id,
              product_title: giftProduct.product_title,
              variant_title: giftProduct.variant_title,
              price: giftProduct.price,
              quantity: 1,
              image: giftProduct.image,
              properties: [{
                name: 'מתנה',
                value: giftProduct.discount_name,
              }],
            });
          }
        }
      }
    } catch (error) {
      console.error('Error calculating cart:', error);
      // טיפול נכון ב-shippingRate null/undefined
      const shippingPrice = options.shippingRate?.price ?? 0;
      const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      
      // במקום null, מחזיר תוצאה עם שגיאה
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
  }, [cartItems, discountCode, options.shippingRate, options.storeId, options.customerId, options.customerSegment, options.customerOrdersCount, options.customerLifetimeValue]);

  // Ref to track pending calculations to prevent duplicate calls
  const calculatingRef = useRef(false);
  
  // Create a unique key for this calculation request to prevent duplicates across instances
  const getCalculationKey = () => {
    const itemsKey = cartItems.map(i => `${i.variant_id}-${i.quantity}`).join(',');
    return `${options.storeId}-${itemsKey}-${discountCode || ''}-${options.shippingRate?.id || ''}`;
  };
  
  // חישוב אוטומטי כשהעגלה משתנה - עם debounce חכם למניעת קריאות כפולות
  // ✅ תיקון: תלוי ב-cartItems עצמו ולא רק ב-length כדי לזהות שינויים בכמויות
  // ✅ שיפור: אם אין calculation קיים, נחשב מיד (ללא debounce) כדי לא לפגוע ב-UX
  // ⚠️ IMPORTANT: Always recalculate from server - no cache for prices due to discounts and promotions
  useEffect(() => {
    if (options.autoCalculate === false) return;
    
    const calculationKey = getCalculationKey();
    
    // Check if another instance is already calculating the same cart
    if (globalCartCalculating[calculationKey]) {
      return; // Don't retry, just skip completely
    }
    
    // Prevent duplicate calculations in this instance
    if (calculatingRef.current) {
      return;
    }
    
    // אם אין calculation קיים, נחשב מיד (ללא debounce) כדי לא לפגוע ב-UX
    // Always calculate from server - never use cached prices
    if (!calculation && cartItems.length > 0) {
      calculatingRef.current = true;
      globalCartCalculating[calculationKey] = true;
      recalculate().finally(() => {
        calculatingRef.current = false;
        delete globalCartCalculating[calculationKey];
      });
      return;
    }
    
    // אם יש calculation קיים, נשתמש ב-debounce כדי למנוע קריאות כפולות
    // ⚠️ IMPORTANT: Always recalculate from server - never use cached calculation
    // Debounce only prevents multiple simultaneous requests, but always fetches fresh data
    const timeoutId = setTimeout(() => {
      if (!calculatingRef.current && !globalCartCalculating[calculationKey]) {
        calculatingRef.current = true;
        globalCartCalculating[calculationKey] = true;
        recalculate().finally(() => {
          calculatingRef.current = false;
          delete globalCartCalculating[calculationKey];
        });
      }
    }, 500); // Increased debounce to 500ms to reduce requests
    
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems, discountCode, options.shippingRate?.id, options.storeId]);

  // אימות קופון
  const validateCode = useCallback(async (code: string): Promise<{ valid: boolean; error?: string }> => {
    // בדיקת תקינות קוד
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return { valid: false, error: 'קוד קופון לא תקין' };
    }

    if (!code) {
      setDiscountCode('');
      await recalculate();
      return { valid: true };
    }

    setValidatingCode(true);
    try {
      // שימוש ב-calculation קיים אם יש, אחרת חישוב בסיסי
      // חשוב: להשתמש ב-subtotal אחרי הנחות אוטומטיות אם יש
      const subtotal = calculation?.subtotalAfterDiscount || 
        cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      
      // Call API route instead of direct import
      const response = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          storeId: options.storeId,
          subtotal,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to validate discount code');
      }

      const result = await response.json();

      if (result.valid) {
        const upperCode = code.toUpperCase();
        setDiscountCode(upperCode);
        // Cache in sessionStorage for other instances
        sessionStorage.setItem(`discount_code_${options.storeId}`, upperCode);
        
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
        
        await recalculate();
        return { valid: true };
      } else {
        return { valid: false, error: result.error };
      }
    } catch (error) {
      console.error('Error validating code:', error);
      return { valid: false, error: 'שגיאה באימות קופון' };
    } finally {
      setValidatingCode(false);
    }
  }, [cartItems, options.storeId, recalculate]);

  // הסרת קופון
  const removeDiscountCode = useCallback(async () => {
    // Remove from server (session) FIRST - wait for completion
    try {
      const response = await fetch(`/api/cart/discount-code?storeId=${options.storeId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove discount code from server');
      }
      
      // Update state immediately after successful server removal
      setDiscountCode('');
      // Clear from sessionStorage for other instances
      sessionStorage.setItem(`discount_code_${options.storeId}`, '');
      
      // Force immediate recalculation with empty discount code
      // This ensures UI updates immediately without waiting for useEffect
      const response2 = await fetch('/api/cart/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: options.storeId,
          items: cartItems,
          discountCode: '', // Explicitly pass empty string to override server value
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
        // Ensure discountCode is empty in state - force update
        setDiscountCode('');
        // Force a re-render by updating calculation again
        setCalculation({ ...result, discountCode: null });
      } else {
        // If calculation fails, still update state and recalculate normally
        setDiscountCode('');
        await recalculate();
      }
    } catch (error) {
      console.error('Error removing discount code:', error);
      // Even if server call fails, update UI optimistically
      setDiscountCode('');
      await recalculate();
    }
  }, [cartItems, options.storeId, options.shippingRate, options.customerId, options.customerSegment, options.customerOrdersCount, options.customerLifetimeValue, recalculate]);

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

