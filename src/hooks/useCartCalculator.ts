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
 */
export function useCartCalculator(options: UseCartCalculatorOptions) {
  const { cartItems } = useCart();
  const [discountCode, setDiscountCode] = useState<string>('');
  const [calculation, setCalculation] = useState<CartCalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [validatingCode, setValidatingCode] = useState(false);

  // חישוב העגלה
  const recalculate = useCallback(async () => {
    if (cartItems.length === 0) {
      setCalculation({
        items: [],
        subtotal: 0,
        itemsDiscount: 0,
        subtotalAfterDiscount: 0,
        shipping: options.shippingRate?.price || 0,
        shippingDiscount: 0,
        shippingAfterDiscount: options.shippingRate?.price || 0,
        discounts: [],
        total: 0,
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
        })),
        discountCode: discountCode || undefined,
        shippingRate: options.shippingRate,
        storeId: options.storeId,
        customerId: options.customerId,
        customerSegment: options.customerSegment,
        customerOrdersCount: options.customerOrdersCount,
        customerLifetimeValue: options.customerLifetimeValue,
      };

      // Call API route instead of direct import
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
        throw new Error('Failed to calculate cart');
      }

      const result = await response.json();
      setCalculation(result);
    } catch (error) {
      console.error('Error calculating cart:', error);
      setCalculation(null);
    } finally {
      setLoading(false);
    }
  }, [cartItems, discountCode, options.shippingRate, options.storeId]);

  // חישוב אוטומטי כשהעגלה משתנה
  useEffect(() => {
    if (options.autoCalculate !== false) {
      recalculate();
    }
  }, [recalculate, options.autoCalculate]);

  // אימות קופון
  const validateCode = useCallback(async (code: string): Promise<{ valid: boolean; error?: string }> => {
    if (!code) {
      setDiscountCode('');
      await recalculate();
      return { valid: true };
    }

    setValidatingCode(true);
    try {
      const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      
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
        setDiscountCode(code.toUpperCase());
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
  const removeDiscountCode = useCallback(() => {
    setDiscountCode('');
    recalculate();
  }, [recalculate]);

  return {
    // State
    calculation,
    discountCode,
    loading,
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

