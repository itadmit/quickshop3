'use client';

import { useCartCalculator } from '@/hooks/useCartCalculator';
import { useCart, type CartItem } from '@/hooks/useCart';
import { ShippingRate, type CartCalculationResult } from '@/lib/services/cartCalculator';
import { HiTag, HiX } from 'react-icons/hi';
import { useState } from 'react';

interface CartSummaryProps {
  storeId: number;
  shippingRate?: ShippingRate;
  isNavigatingToCheckout?: boolean;
  onCheckout?: () => void;
  cartItems?: CartItem[]; // ✅ Optional: אם מועבר מ-SideCart, משתמש בו
  calculation?: CartCalculationResult | null; // ✅ Optional: אם מועבר מ-SideCart, משתמש בו
  discountCode?: string; // ✅ Optional: אם מועבר מ-SideCart, משתמש בו
  applyDiscountCode?: (code: string) => Promise<{ valid: boolean; error?: string }>; // ✅ Optional: אם מועבר מ-SideCart
  removeDiscountCode?: () => Promise<void>; // ✅ Optional: אם מועבר מ-SideCart
  recalculate?: () => Promise<void>; // ✅ Optional: אם מועבר מ-SideCart
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
export function CartSummary({ 
  storeId, 
  shippingRate, 
  isNavigatingToCheckout = false, 
  onCheckout,
  cartItems: propsCartItems, // ✅ אם מועבר מ-SideCart, משתמש בו
  calculation: propsCalculation, // ✅ אם מועבר מ-SideCart, משתמש בו
  discountCode: propsDiscountCode, // ✅ אם מועבר מ-SideCart, משתמש בו
  applyDiscountCode: propsApplyDiscountCode, // ✅ אם מועבר מ-SideCart, משתמש בו
  removeDiscountCode: propsRemoveDiscountCode, // ✅ אם מועבר מ-SideCart, משתמש בו
  recalculate: propsRecalculate, // ✅ אם מועבר מ-SideCart, משתמש בו
}: CartSummaryProps) {
  const cartFromHook = useCart();
  const cartItems = propsCartItems ?? cartFromHook.cartItems; // ✅ משתמש ב-props אם קיים
  
  // ✅ אם יש props מ-SideCart, משתמש בהם (סינכרון מלא)
  // אחרת יוצר instance נפרד (רק אם CartSummary משמש לבד)
  const isUsingProps = !!propsCalculation;
  
  const calculatorHook = useCartCalculator({
    storeId,
    cartItems,
    shippingRate,
    autoCalculate: !isUsingProps, // ✅ אם יש props, לא מחשב אוטומטית
  });
  
  // ✅ משתמש ב-props אם קיים, אחרת מה-hook
  const calculation = propsCalculation ?? calculatorHook.calculation;
  const discountCode = propsDiscountCode ?? calculatorHook.discountCode;
  const validatingCode = calculatorHook.validatingCode;
  const calcLoading = isUsingProps ? false : calculatorHook.loading; // ✅ אם יש props, לא טוען
  const applyDiscountCode = propsApplyDiscountCode ?? calculatorHook.applyDiscountCode;
  const removeDiscountCode = propsRemoveDiscountCode ?? calculatorHook.removeDiscountCode;
  const recalculate = propsRecalculate ?? calculatorHook.recalculate;
  
  const getSubtotal = () => calculation?.subtotal || 0;
  const getDiscount = () => calculation?.itemsDiscount || 0;
  const getShipping = () => calculation?.shippingAfterDiscount || 0;
  const getTotal = () => calculation?.total || 0;
  const getDiscounts = () => calculation?.discounts || [];
  const hasErrors = () => (calculation?.errors.length || 0) > 0;
  const hasWarnings = () => (calculation?.warnings.length || 0) > 0;
  const getErrors = () => calculation?.errors || [];
  const getWarnings = () => calculation?.warnings || [];

  const isLoading = cartFromHook.isLoading || calcLoading;

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

  // Show loading state while cart is loading or calculating
  if (isLoading || !calculation) {
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

  // If cart is empty, show empty state
  if (cartItems.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500 text-center">העגלה ריקה</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 space-y-3">
      {/* Discount Code */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">
          קופון הנחה
        </label>
        
        {/* Applied discount code - compact badge style */}
        {/* ✅ מציג קופון רק אם הוא תקף (מופיע ב-getDiscounts) */}
        {discountCode && getDiscounts().some(d => d.source === 'code' && d.code === discountCode) && (
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 border border-green-200 rounded-full text-sm" dir="rtl">
              {validatingCode ? (
                <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <button
                  onClick={async () => {
                    await removeDiscountCode();
                  }}
                  className="text-green-500 hover:text-red-500 transition-colors"
                  type="button"
                >
                  <HiX className="w-4 h-4" />
                </button>
              )}
              <HiTag className="w-4 h-4 text-green-600" />
              {getDiscounts().filter(d => d.source === 'code' && d.code === discountCode).map((discount, idx) => {
                // ✅ בדיקה אם הקוד כבר מופיע בתיאור (כדי למנוע הצגה כפולה)
                const description = discount.description || discount.name || 'הנחה';
                const codeInDescription = discount.code && description.includes(discount.code);
                
                return (
                  <span key={idx} className="text-green-600">
                    {description}
                  </span>
                );
              })}
              {/* ✅ מציג את הקוד רק אם הוא לא מופיע בתיאור */}
              {(() => {
                const discount = getDiscounts().find(d => d.source === 'code' && d.code === discountCode);
                const description = discount?.description || discount?.name || '';
                const codeInDescription = discountCode && description.includes(discountCode);
                
                if (!codeInDescription && discountCode) {
                  return (
                    <>
                      <span className="text-green-500">-</span>
                      <span className="font-medium text-green-700" dir="ltr">{discountCode}</span>
                    </>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        )}
        
        {/* ✅ מציג קופון לא תקף עם אזהרה */}
        {discountCode && !getDiscounts().some(d => d.source === 'code' && d.code === discountCode) && (
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-yellow-50 border border-yellow-200 rounded-full text-sm" dir="rtl">
              <button
                onClick={async () => {
                  await removeDiscountCode();
                }}
                className="text-yellow-600 hover:text-red-500 transition-colors"
                type="button"
              >
                <HiX className="w-4 h-4" />
              </button>
              <HiTag className="w-4 h-4 text-yellow-600" />
              <span className="text-yellow-700" dir="ltr">{discountCode}</span>
              <span className="text-yellow-600 text-xs">(לא תקף)</span>
            </div>
          </div>
        )}
        
        {/* Input field - same height for input and button */}
        <div className="flex gap-2">
          <input
            type="text"
            value={codeInput}
            onChange={(e) => {
              setCodeInput(e.target.value);
              setCodeError('');
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleApplyCode()}
            placeholder={discountCode ? "קוד קופון נוסף" : "הכנס קוד קופון"}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500"
          />
          <button
            onClick={handleApplyCode}
            disabled={validatingCode || !codeInput.trim()}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {validatingCode ? '...' : 'החל'}
          </button>
        </div>
        
        {codeError && (
          <p className="mt-1.5 text-sm text-red-600">{codeError}</p>
        )}
      </div>

      {/* Errors & Warnings */}
      {hasErrors() && (
        <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {getErrors().map((error, index) => (
            <p key={index}>{error}</p>
          ))}
        </div>
      )}
      {hasWarnings() && (
        <div className="p-2.5 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-600">
          {getWarnings().map((warning, index) => (
            <p key={index}>{warning}</p>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="border-t border-gray-200 pt-3 space-y-2">
        {/* סה"כ פריטים - מוצג רק אם יש הנחה */}
        {getDiscount() > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">סה"כ פריטים:</span>
            <span className="text-gray-900">₪{getSubtotal().toFixed(2)}</span>
          </div>
        )}

        {/* הנחות - סיכום */}
        {getDiscount() > 0 && (
          <div className="space-y-1">
            {/* הנחות אוטומטיות */}
            {getDiscounts().filter(d => d.source === 'automatic').map((discount, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {discount.name || discount.description || 'הנחה אוטומטית'}:
                </span>
                <span className="font-medium text-green-600">
                  {discount.type === 'free_shipping' ? 'משלוח חינם' : `-₪${discount.amount.toFixed(2)}`}
                </span>
              </div>
            ))}

            {/* הנחת קופון */}
            {getDiscounts().filter(d => d.source === 'code').map((discount, idx) => {
              // ✅ בדיקה אם הקוד כבר מופיע בתיאור (כדי למנוע הצגה כפולה)
              const description = discount.description || discount.name || 'הנחה';
              const codeInDescription = discount.code && description.includes(discount.code);
              const displayName = codeInDescription ? description : (discount.code || discount.name || 'קופון');
              
              return (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    קופון {displayName}:
                  </span>
                  <span className="font-medium text-green-600">
                    {discount.type === 'free_shipping' ? 'משלוח חינם' : `-₪${discount.amount.toFixed(2)}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {shippingRate && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">משלוח:</span>
            <span className="text-gray-900">
              {getShipping() === 0 ? (
                <span className="text-green-600 font-medium">חינם</span>
              ) : (
                `₪${getShipping().toFixed(2)}`
              )}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-base font-bold border-t border-gray-200 pt-3 mt-3">
          <span className="text-gray-900">סה"כ לתשלום:</span>
          <span className="text-gray-900">₪{getTotal().toFixed(2)}</span>
        </div>
      </div>

      {/* Checkout Button - Compact */}
      {onCheckout && (
        <button
          onClick={onCheckout}
          disabled={!calculation.isValid || calculation.total === 0 || isNavigatingToCheckout}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        >
          {isNavigatingToCheckout ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              עובר לצ'ק אאוט...
            </>
          ) : (
            'המשך לצ\'ק אאוט'
          )}
        </button>
      )}
    </div>
  );
}

