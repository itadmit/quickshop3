'use client';

import { useState, useEffect, useCallback } from 'react';
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

  // Load discount code from server (session) on mount
  useEffect(() => {
    const loadDiscountCode = async () => {
      if (!options.storeId) {
        setIsLoadingDiscountCode(false);
        return;
      }

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
          if (data.discountCode) {
            setDiscountCode(data.discountCode);
          }
        }
      } catch (error) {
        console.error('Error loading discount code:', error);
      } finally {
        setIsLoadingDiscountCode(false);
      }
    };

    loadDiscountCode();
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
        total: shippingPrice,
        isValid: true,
        errors: [],
        warnings: [],
      });
      return;
    }

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
      const response = await fetch('/api/cart/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        total: subtotal + shippingPrice,
        isValid: false,
        errors: ['שגיאה בחישוב העגלה. אנא נסה שוב.'],
        warnings: [],
      });
    } finally {
      setLoading(false);
    }
  }, [cartItems, discountCode, options.shippingRate, options.storeId, options.customerId, options.customerSegment, options.customerOrdersCount, options.customerLifetimeValue]);

  // חישוב אוטומטי כשהעגלה משתנה
  // ✅ תיקון: תלוי ב-cartItems עצמו ולא רק ב-length כדי לזהות שינויים בכמויות
  useEffect(() => {
    if (options.autoCalculate !== false) {
      recalculate();
    }
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
    setDiscountCode('');
    
    // Remove from server (session)
    try {
      await fetch(`/api/cart/discount-code?storeId=${options.storeId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error removing discount code:', error);
    }
    
    // רענון מיידי של החישוב
    await recalculate();
  }, [recalculate, options.storeId]);

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

