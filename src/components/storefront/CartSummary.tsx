'use client';

import { useCartCalculator } from '@/hooks/useCartCalculator';
import { ShippingRate } from '@/lib/services/cartCalculator';
import { HiTag, HiX } from 'react-icons/hi';
import { useState } from 'react';

interface CartSummaryProps {
  storeId: number;
  shippingRate?: ShippingRate;
  onCheckout?: () => void;
}

/**
 * CartSummary - סיכום עגלה עם חישוב הנחות
 * 
 * קומפוננטה זו משתמשת במנוע החישוב המרכזי להצגת סיכום העגלה.
 * היא מציגה:
 * - Subtotal
 * - הנחות
 * - משלוח
 * - סה"כ סופי
 * - קופון
 */
export function CartSummary({ storeId, shippingRate, onCheckout }: CartSummaryProps) {
  const {
    calculation,
    discountCode,
    validatingCode,
    applyDiscountCode,
    removeDiscountCode,
    getSubtotal,
    getDiscount,
    getShipping,
    getTotal,
    getDiscounts,
    hasErrors,
    hasWarnings,
    getErrors,
    getWarnings,
  } = useCartCalculator({
    storeId,
    shippingRate,
    autoCalculate: true,
  });

  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');

  const handleApplyCode = async () => {
    if (!codeInput.trim()) return;

    setCodeError('');
    const result = await applyDiscountCode(codeInput.trim());
    
    if (result.valid) {
      setCodeInput('');
    } else {
      setCodeError(result.error || 'קופון לא תקין');
    }
  };

  if (!calculation) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      {/* Discount Code */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          קופון הנחה
        </label>
        {discountCode ? (
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <HiTag className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">{discountCode}</span>
            </div>
            <button
              onClick={removeDiscountCode}
              className="text-green-600 hover:text-green-800 transition-colors"
            >
              <HiX className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={codeInput}
              onChange={(e) => {
                setCodeInput(e.target.value);
                setCodeError('');
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleApplyCode()}
              placeholder="הכנס קוד קופון"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button
              onClick={handleApplyCode}
              disabled={validatingCode || !codeInput.trim()}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {validatingCode ? 'בודק...' : 'החל'}
            </button>
          </div>
        )}
        {codeError && (
          <p className="mt-2 text-sm text-red-600">{codeError}</p>
        )}
      </div>

      {/* Errors & Warnings */}
      {hasErrors() && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          {getErrors().map((error, index) => (
            <p key={index} className="text-sm text-red-600">{error}</p>
          ))}
        </div>
      )}
      {hasWarnings() && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          {getWarnings().map((warning, index) => (
            <p key={index} className="text-sm text-yellow-600">{warning}</p>
          ))}
        </div>
      )}

      {/* Applied Discounts */}
      {getDiscounts().length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">הנחות שהוחלו:</h3>
          {getDiscounts()
            .sort((a, b) => b.priority - a.priority) // Sort by priority
            .map((discount, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">{discount.description}</span>
                  {discount.source === 'automatic' && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      אוטומטי
                    </span>
                  )}
                  {discount.source === 'code' && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      קופון
                    </span>
                  )}
                </div>
                {discount.type === 'free_shipping' ? (
                  <span className="font-semibold text-green-600">חינם</span>
                ) : (
                  <span className="font-semibold text-green-600">-₪{discount.amount.toFixed(2)}</span>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Summary */}
      <div className="border-t border-gray-200 pt-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">סה"כ פריטים:</span>
          <span className="text-gray-900">₪{getSubtotal().toFixed(2)}</span>
        </div>

        {getDiscount() > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">הנחה:</span>
            <span className="font-semibold text-green-600">-₪{getDiscount().toFixed(2)}</span>
          </div>
        )}

        {shippingRate && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">משלוח:</span>
            <span className="text-gray-900">
              {getShipping() === 0 ? (
                <span className="text-green-600 font-semibold">חינם</span>
              ) : (
                `₪${getShipping().toFixed(2)}`
              )}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-lg font-bold border-t border-gray-200 pt-3">
          <span className="text-gray-900">סה"כ לתשלום:</span>
          <span className="text-gray-900">₪{getTotal().toFixed(2)}</span>
        </div>
      </div>

      {/* Checkout Button */}
      {onCheckout && (
        <button
          onClick={onCheckout}
          disabled={!calculation.isValid || calculation.total === 0}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          המשך לצ'ק אאוט
        </button>
      )}
    </div>
  );
}

