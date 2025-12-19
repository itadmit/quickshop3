'use client';

import { useState, useMemo, useEffect, useRef, Fragment } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Textarea } from '@/components/ui/Textarea';
import { Autocomplete } from '@/components/ui/Autocomplete';
import { Badge } from '@/components/ui/badge';
import { useCitySearch, useStreetSearch } from '@/hooks/useIsraelAddress';
import { useCart } from '@/hooks/useCart';
import { useCartCalculator } from '@/hooks/useCartCalculator';
import { useTranslation } from '@/hooks/useTranslation';
import { TextSkeleton } from '@/components/ui/Skeleton';
import { emitTrackingEvent } from '@/lib/tracking/events';
import { createOrder } from '@/app/(storefront)/actions/checkout';
import {
  CreditCard,
  Truck,
  Mail,
  User,
  Phone,
  X,
  Lock,
  Coins,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { CheckoutFooter } from './CheckoutFooter';

interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'checkbox' | 'select';
  placeholder?: string;
  required?: boolean;
  enabled?: boolean;
  options?: string[]; // For select type
}

interface CheckoutFormProps {
  storeId: number;
  storeName: string;
  storeLogo?: string | null;
  storeSlug: string;
  customFields?: CustomField[];
}

// Types for payment methods
interface PaymentMethodOption {
  id: string;
  name: string;
  description: string;
  icon?: string;
  fee?: number;
  details?: string;
}

export function CheckoutForm({ storeId, storeName, storeLogo, storeSlug, customFields = [] }: CheckoutFormProps) {
  const router = useRouter();
  const { cartItems, clearCart, isLoading: cartLoading } = useCart();
  const { t, loading: translationsLoading } = useTranslation('storefront');
  const [processing, setProcessing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [redirectingToPayment, setRedirectingToPayment] = useState(false);
  
  // Available payment methods from store settings
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);
  const [minimumOrderAmount, setMinimumOrderAmount] = useState(0);
  
  // Checkout customizer settings
  const [checkoutSettings, setCheckoutSettings] = useState<{
    layout: { left_column_color: string; right_column_color: string };
    button: { text: string; background_color: string; text_color: string; border_radius: string };
    fields_order: string[];
    custom_fields: Array<{ id: string; label: string; type: string; required: boolean; options?: string[]; placeholder?: string }>;
    show_order_notes: boolean;
    show_shipping_options: boolean;
    show_payment_methods: boolean;
  }>({
    layout: { left_column_color: '#fafafa', right_column_color: '#ffffff' },
    button: { text: 'לתשלום', background_color: '#000000', text_color: '#ffffff', border_radius: '8' },
    fields_order: ['email', 'first_name', 'last_name', 'phone', 'city', 'street', 'apartment', 'notes'],
    custom_fields: [],
    show_order_notes: true,
    show_shipping_options: true,
    show_payment_methods: true
  });
  
  // Autocomplete hooks לערים ורחובות
  const citySearch = useCitySearch(storeSlug);
  const [selectedCityForStreets, setSelectedCityForStreets] = useState('');
  
  const streetSearch = useStreetSearch(storeSlug, selectedCityForStreets);

  // SINGLE SOURCE OF TRUTH: מעביר את cartItems ל-useCartCalculator
  const {
    calculation,
    discountCode,
    validatingCode,
    loading: calcLoading,
    applyDiscountCode,
    removeDiscountCode,
    recalculate,
    getSubtotal,
    getDiscount,
    getShipping,
    getTotal,
    getDiscounts,
  } = useCartCalculator({
    storeId,
    cartItems,
    autoCalculate: true,
  });

  // ✅ autoCalculate: true ב-useCartCalculator כבר מטפל בחישוב אוטומטי
  // לא צריך useEffect נוסף - זה גורם ל-loop אינסופי של קריאות

  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    companyName: '',
    address: '',
    houseNumber: '',
    apartment: '',
    floor: '',
    city: '',
    zip: '',
    orderNotes: '',
    newsletter: true,
    createAccount: false,
    saveDetails: false,
    paymentMethod: 'credit_card' as 'credit_card' | 'bank_transfer' | 'cash' | 'store_credit',
    deliveryMethod: 'shipping' as 'shipping' | 'pickup',
    customFields: {} as Record<string, any>,
    storeCreditAmount: 0, // סכום קרדיט לשימוש
  });

  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [storeCredit, setStoreCredit] = useState<{ balance: number; id: number } | null>(null);
  const [loadingStoreCredit, setLoadingStoreCredit] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load available payment methods
  useEffect(() => {
    if (!isMounted) return;
    
    const loadPaymentMethods = async () => {
      try {
        setLoadingPaymentMethods(true);
        const response = await fetch(`/api/storefront/${storeSlug}/payment-methods`);
        if (response.ok) {
          const data = await response.json();
          setPaymentMethods(data.methods || []);
          setMinimumOrderAmount(data.minimum_order_amount || 0);
          // Set default payment method if available
          if (data.defaultMethod && data.methods?.length > 0) {
            setFormData(prev => ({ ...prev, paymentMethod: data.defaultMethod }));
          }
        }
      } catch (error) {
        console.error('Error loading payment methods:', error);
      } finally {
        setLoadingPaymentMethods(false);
      }
    };
    
    loadPaymentMethods();
  }, [isMounted, storeSlug]);

  // Load checkout customizer settings
  useEffect(() => {
    if (!isMounted) return;
    
    const loadCheckoutSettings = async () => {
      try {
        const response = await fetch(`/api/storefront/${storeSlug}/checkout-settings`);
        if (response.ok) {
          const data = await response.json();
          if (data.settings) {
            setCheckoutSettings(prev => ({
              ...prev,
              ...data.settings
            }));
          }
        }
      } catch (error) {
        console.error('Error loading checkout settings:', error);
      }
    };
    
    loadCheckoutSettings();
  }, [isMounted, storeSlug]);

  // Load store credit if customer is logged in
  useEffect(() => {
    if (!isMounted) return;
    
    const token = localStorage.getItem(`storefront_token_${storeSlug}`);
    if (token) {
      loadStoreCredit();
    }
  }, [isMounted, storeSlug]);

  const loadStoreCredit = async () => {
    try {
      setLoadingStoreCredit(true);
      const token = localStorage.getItem(`storefront_token_${storeSlug}`);
      if (!token) return;

      const response = await fetch(`/api/storefront/${storeSlug}/store-credit`, {
        headers: {
          'x-customer-id': token,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.balance > 0) {
          setStoreCredit({ balance: data.balance, id: data.id });
        } else {
          setStoreCredit(null);
        }
      }
    } catch (error) {
      console.error('Error loading store credit:', error);
    } finally {
      setLoadingStoreCredit(false);
    }
  };

  // Track InitiateCheckout on mount - רק פעם אחת
  const hasTrackedCheckout = useRef(false);
  useEffect(() => {
    // רק אם יש פריטים, יש calculation, ולא עקבינו כבר
    if (!hasTrackedCheckout.current && cartItems.length > 0 && calculation && calculation.total > 0) {
      emitTrackingEvent({
        event: 'InitiateCheckout',
        content_ids: cartItems.map(item => String(item.product_id)),
        contents: cartItems.map(item => ({
          id: String(item.product_id),
          quantity: item.quantity,
          item_price: item.price,
        })),
        currency: 'ILS',
        value: calculation.total, // ✅ משתמש ב-calculation.total ישירות במקום getTotal()
        num_items: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      });
      hasTrackedCheckout.current = true;
    }
    // ✅ הסרתי את getTotal מה-dependencies כדי למנוע ריצות כפולות
  }, [cartItems, calculation]);

  const handleApplyCode = async () => {
    if (!codeInput.trim()) return;

    setCodeError('');
    const result = await applyDiscountCode(codeInput.trim());
    
    if (result.valid) {
      setCodeInput('');
    } else {
      setCodeError(result.error || t('checkout.invalid_code'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      // Validation לפני שליחה
      if (!formData.email || !formData.phone || !formData.firstName || !formData.lastName) {
        alert('אנא מלא את כל השדות הנדרשים');
        setProcessing(false);
        return;
      }

      if (formData.deliveryMethod === 'shipping' && (!formData.city || !formData.address || !formData.houseNumber)) {
        alert('אנא מלא את כל פרטי המשלוח');
        setProcessing(false);
        return;
      }

      const total = getTotal();
      const storeCreditAmount = formData.paymentMethod === 'store_credit' ? formData.storeCreditAmount : 0;
      const finalTotal = Math.max(0, total - storeCreditAmount);
      
      const order = await createOrder({
        storeId, // ✅ מעביר את storeId מה-prop
        lineItems: cartItems.map((item) => ({
          variant_id: item.variant_id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
          properties: item.properties,
        })),
        customer: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postalCode: formData.zip,
          country: 'ישראל',
          notes: formData.orderNotes,
        },
        total: finalTotal > 0 ? finalTotal : 0, // אם הקרדיט מכסה הכל, הסכום הוא 0
        deliveryMethod: formData.deliveryMethod,
        paymentMethod: formData.paymentMethod,
        storeCreditAmount: storeCreditAmount,
        customFields: formData.customFields,
        discountCodes: discountCode ? [discountCode] : [], // ✅ מוסיף את קוד הקופון להזמנה
      });

      // אם תשלום בכרטיס אשראי - הפניה לדף סליקה
      if (formData.paymentMethod === 'credit_card' && finalTotal > 0) {
        try {
          const baseUrl = window.location.origin;
          const paymentResponse = await fetch('/api/payments/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: order.id,
              storeSlug,
              successUrl: `${baseUrl}/shops/${storeSlug}/checkout/success?orderId=${order.id}`,
              errorUrl: `${baseUrl}/shops/${storeSlug}/checkout?error=payment_failed&orderId=${order.id}`,
            }),
          });

          const paymentData = await paymentResponse.json();

          if (paymentData.success && paymentData.paymentUrl) {
            // ⚠️ לא מוחקים את העגלה כאן!
            // העגלה תימחק רק בדף התודה אחרי תשלום מוצלח
            setOrderCompleted(true); // מונע redirect לעגלה ריקה
            setRedirectingToPayment(true); // הצגת loader לפני הפניה
            
            // Track InitiatePayment event (לא Purchase - זה יהיה רק אחרי תשלום)
            emitTrackingEvent({
              event: 'InitiatePayment',
              content_ids: cartItems.map(item => String(item.product_id)),
              currency: 'ILS',
              value: finalTotal,
              order_id: String(order.id),
            });

            // הפניה לדף הסליקה
            window.location.href = paymentData.paymentUrl;
            return;
          } else if (paymentData.noGateway) {
            // ❌ אין ספק סליקה מוגדר - לא מאפשרים תשלום בכרטיס אשראי
            setProcessing(false);
            alert('לא ניתן לשלם בכרטיס אשראי כרגע. אנא בחר שיטת תשלום אחרת או פנה לבעל החנות.');
            return;
          } else {
            // ❌ שגיאה באתחול התשלום
            setProcessing(false);
            alert(paymentData.error || 'אירעה שגיאה באתחול התשלום. אנא נסה שוב.');
            return;
          }
        } catch (paymentError) {
          // ❌ שגיאה בתקשורת עם שרת התשלומים
          console.error('Payment init failed:', paymentError);
          setProcessing(false);
          alert('אירעה שגיאה בתקשורת עם שרת התשלומים. אנא נסה שוב.');
          return;
        }
      }

      // Track Purchase event - רק אם לא הופנה לסליקה
      emitTrackingEvent({
        event: 'Purchase',
        content_ids: cartItems.map(item => String(item.product_id)),
        contents: cartItems.map(item => ({
          id: String(item.product_id),
          quantity: item.quantity,
          item_price: item.price,
        })),
        currency: 'ILS',
        value: total,
        order_id: String(order.id),
      });

      setOrderCompleted(true); // מונע redirect לעמוד עגלה ריקה
      clearCart();
      // שימוש ב-handle במקום orderId לביטחון
      const orderHandle = (order as any).handle || (order as any).order_handle || order.id;
      if (!orderHandle) {
        console.error('No order handle found');
        return;
      }
      router.push(`/shops/${storeSlug}/checkout/success?handle=${orderHandle}`);
    } catch (error) {
      console.error('Checkout error:', error);
      alert(t('checkout.error') || 'אירעה שגיאה ביצירת ההזמנה');
    } finally {
      setProcessing(false);
    }
  };

  const finalTotal = useMemo(() => {
    return getTotal();
  }, [getTotal]);

  const shippingCost = useMemo(() => {
    return getShipping();
  }, [getShipping]);

  // Redirect אם אין פריטים - רק ב-client אחרי mount
  // לא מפנים אם ההזמנה הושלמה (כדי לאפשר redirect לעמוד התודה)
  // ✅ תיקון: מוסיף delay קצר כדי לאפשר טעינת העגלה מהשרת לפני redirect
  useEffect(() => {
    if (isMounted && cartItems.length === 0 && !orderCompleted) {
      // ✅ delay קצר כדי לאפשר טעינת העגלה מהשרת (cookies-based)
      const timeoutId = setTimeout(() => {
        // בדיקה נוספת אחרי delay - אם עדיין אין פריטים, מפנה לעמוד עגלה
        if (cartItems.length === 0 && !orderCompleted) {
          router.push(`/shops/${storeSlug}/cart`);
        }
      }, 500); // 500ms delay כדי לאפשר טעינת העגלה מהשרת
      
      return () => clearTimeout(timeoutId);
    }
  }, [isMounted, cartItems.length, router, storeSlug, orderCompleted]);

  // הצגת skeleton רק אם אין calculation (אחרי mount)
  // חשוב: לא נבדוק isMounted כאן כדי למנוע hydration mismatch
  // השרת יציג את ה-skeleton דרך Suspense ב-CheckoutPage
  if (!calculation && cartItems.length > 0 && isMounted) {
    return (
      <div 
        className="min-h-screen" 
        dir="rtl"
        style={{ 
          backgroundColor: '#ffffff',
        }}
      >
        {/* Skeleton שמשקף את המבנה האמיתי */}
        <div className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
            {/* CheckoutHeader - מתפרס על כל הרוחב */}
            <div className="lg:col-span-3 flex justify-end bg-white border-b border-gray-200">
              <div className="w-full max-w-3xl pl-8 pr-4 py-4 flex items-center">
                <Link 
                  href={`/shops/${storeSlug}`}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <span>→</span>
                  <span>חזרה לחנות</span>
                </Link>
              </div>
            </div>
            <div className="lg:col-span-2 border-b border-gray-200 flex justify-start" style={{ backgroundColor: checkoutSettings.layout.left_column_color }}>
              <div className="w-full max-w-md px-8 py-4 flex items-center justify-end gap-3">
                {storeLogo && (
                  <img
                    src={storeLogo}
                    alt={storeName}
                    className="h-8 w-8 object-contain"
                  />
                )}
                <h1 className="text-xl font-bold uppercase">{storeName}</h1>
              </div>
            </div>
          
            {/* Left Side - Form Skeleton */}
            <div 
              className="lg:col-span-3 min-h-screen flex justify-end"
              style={{
                backgroundColor: '#ffffff',
              }}
            >
              <div className="w-full max-w-3xl pl-8 pr-4 py-8 space-y-6">
                {/* Page Title Skeleton */}
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
                </div>
                
                {/* Contact Information Skeleton */}
                <div className="pb-6 border-b border-gray-200">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-10 bg-gray-200 rounded"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-24 bg-gray-200 rounded"></div>
                  </div>
                </div>
                
                {/* Delivery Method Skeleton */}
                <div className="pb-6 border-b border-gray-200">
                  <div className="animate-pulse space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
                
                {/* Shipping Address Skeleton */}
                <div className="pb-6 border-b border-gray-200">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-10 bg-gray-200 rounded"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="h-10 bg-gray-200 rounded"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
                
                {/* Payment Method Skeleton */}
                <div className="pb-6 border-b border-gray-200">
                  <div className="animate-pulse space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Side - Order Summary Skeleton */}
            <div 
              className="lg:col-span-2 min-h-screen flex justify-start"
              style={{
                backgroundColor: checkoutSettings.layout.left_column_color,
              }}
            >
              <div className="w-full max-w-md px-8 py-8">
                <div className="p-6 sticky top-24 bg-gray-50 rounded-lg">
                  <div className="animate-pulse space-y-6">
                    {/* Title */}
                    <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>
                    
                    {/* Cart Items Skeleton */}
                    <div className="space-y-4 mb-6">
                      {[1, 2].map((i) => (
                        <div key={i} className="flex gap-3">
                          <div className="w-16 h-16 bg-gray-200 rounded"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                          </div>
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Coupon Skeleton */}
                    <div className="mb-6">
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                    
                    {/* Summary Skeleton */}
                    <div className="space-y-2 pt-4 border-t border-gray-200">
                      <div className="flex justify-between">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div className="flex justify-between">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-200">
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                        <div className="h-6 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                    
                    {/* Button Skeleton */}
                    <div className="mt-6">
                      <div className="h-12 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // אם אין cartItems או עדיין לא mounted, נציג null (השרת יציג skeleton דרך Suspense)
  if (!isMounted || cartItems.length === 0) {
    return null;
  }

  return (
    <>
      <div 
        className="min-h-screen" 
        dir="rtl"
        style={{ 
          backgroundColor: '#ffffff',
        }}
      >
        {/* Payment Redirect Overlay */}
      {redirectingToPayment && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-4 max-w-sm mx-4 text-center">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-gray-900">מעביר לעמוד תשלום...</h3>
              <p className="text-sm text-gray-500">אנא המתן, אתה מועבר לדף הסליקה המאובטח</p>
            </div>
            <Lock className="w-5 h-5 text-emerald-500" />
          </div>
        </div>
      )}

      {/* הרקע של העמודות מתפרס על כל הרוחב */}
      <form onSubmit={handleSubmit} className="w-full">
        {/* Header - Mobile: Logo and Back in same row */}
        <div className="w-full bg-white border-b border-gray-200">
          {/* Mobile: Logo and Back in same row */}
          <div className="lg:hidden flex items-center justify-between px-4 py-4">
            <Link 
              href={`/shops/${storeSlug}`}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <span>→</span>
              <span>חזרה לחנות</span>
            </Link>
            <div className="flex items-center gap-3">
              {storeLogo && (
                <img
                  src={storeLogo}
                  alt={storeName}
                  className="h-8 w-8 object-contain"
                />
              )}
              <h1 className="text-xl font-bold uppercase">{storeName}</h1>
            </div>
          </div>
          
          {/* Desktop: Same layout as before */}
          <div className="hidden lg:grid grid-cols-5 gap-0">
            <div className="col-span-3 flex justify-end">
              <div className="w-full max-w-3xl pl-8 pr-4 py-4 flex items-center">
                <Link 
                  href={`/shops/${storeSlug}`}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <span>→</span>
                  <span>חזרה לחנות</span>
                </Link>
              </div>
            </div>
            <div className="col-span-2 border-b border-gray-200 flex justify-start" style={{ backgroundColor: '#fafafa' }}>
              <div className="w-full max-w-md px-8 py-4 flex items-center justify-end gap-3">
                {storeLogo && (
                  <img
                    src={storeLogo}
                    alt={storeName}
                    className="h-8 w-8 object-contain"
                  />
                )}
                <h1 className="text-xl font-bold uppercase">{storeName}</h1>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
          
          {/* Main Form - Left Side - 60% */}
          <div 
            className="lg:col-span-3 min-h-screen flex justify-end"
            style={{
              backgroundColor: checkoutSettings.layout.right_column_color,
            }}
          >
            {/* Container לתוכן - מוגבל לרוחב */}
            <div className="w-full max-w-3xl pl-8 pr-4 py-8 space-y-6">
                {/* Page Title */}
                <h1 
                  className="text-2xl font-semibold mb-8"
                >
                  {translationsLoading ? (
                    <TextSkeleton width="w-24" height="h-8" />
                  ) : (
                    t('checkout.title')
                  )}
                </h1>
                
                {/* Contact Information */}
                <div 
                  className="pb-6"
                  style={{ 
                    borderBottom: '1px solid #e5e7eb'
                  }}
                >
                  <h2 
                    className="text-lg font-semibold mb-4 flex items-center gap-2"
                  >
                    <Mail className="w-5 h-5" />
                    {translationsLoading ? (
                      <TextSkeleton width="w-32" height="h-6" />
                    ) : (
                      'פרטי איש קשר'
                    )}
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        {translationsLoading ? (
                          <TextSkeleton width="w-16" height="h-4" />
                        ) : (
                          'אימייל *'
                        )}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                        required
                        className="mt-1"
                        placeholder={translationsLoading ? '' : 'כתובת המייל שלך'}
                      />
                      
                      {/* Newsletter Checkbox */}
                      <div className="flex items-center space-x-2 space-x-reverse mt-2">
                        <Checkbox
                          id="newsletter"
                          checked={formData.newsletter}
                          onCheckedChange={(checked) => 
                            setFormData((prev) => ({ ...prev, newsletter: checked === true }))
                          }
                        />
                        <Label 
                          htmlFor="newsletter" 
                          className="text-sm text-gray-700 cursor-pointer"
                        >
                          {translationsLoading ? (
                            <TextSkeleton width="w-48" height="h-4" />
                          ) : (
                            'אני מאשר/ת קבלת דיוור ומבצעים'
                          )}
                        </Label>
                      </div>

                      {/* Create Account Checkbox */}
                      <div className="flex items-center space-x-2 space-x-reverse mt-2">
                        <Checkbox
                          id="createAccount"
                          checked={formData.createAccount}
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({ ...prev, createAccount: checked === true }))
                          }
                        />
                        <Label 
                          htmlFor="createAccount" 
                          className="text-sm text-gray-700 cursor-pointer"
                        >
                          {translationsLoading ? (
                            <TextSkeleton width="w-64" height="h-4" />
                          ) : (
                            'צור חשבון כדי לעקוב אחרי הזמנות ולשמור פרטים לפעם הבאה'
                          )}
                        </Label>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                        {translationsLoading ? (
                          <TextSkeleton width="w-16" height="h-4" />
                        ) : (
                          'טלפון *'
                        )}
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                        required
                        className="mt-1"
                        placeholder="___-_______"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                          {translationsLoading ? (
                            <TextSkeleton width="w-20" height="h-4" />
                          ) : (
                            'שם פרטי *'
                          )}
                        </Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                          {translationsLoading ? (
                            <TextSkeleton width="w-24" height="h-4" />
                          ) : (
                            'שם משפחה *'
                          )}
                        </Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                          required
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
                        {translationsLoading ? (
                          <TextSkeleton width="w-32" height="h-4" />
                        ) : (
                          'שם חברה (אופציונלי)'
                        )}
                      </Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, companyName: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="orderNotes" className="text-sm font-medium text-gray-700">
                        {translationsLoading ? (
                          <TextSkeleton width="w-24" height="h-4" />
                        ) : (
                          'הערות להזמנה'
                        )}
                      </Label>
                      <Textarea
                        id="orderNotes"
                        value={formData.orderNotes}
                        onChange={(e) => setFormData((prev) => ({ ...prev, orderNotes: e.target.value }))}
                        className="mt-1"
                        rows={4}
                        placeholder={translationsLoading ? '' : 'הערות נוספות להזמנה שלך...'}
                      />
                    </div>

                    {/* Custom Fields */}
                    {customFields.filter(field => field.enabled).map((field) => (
                      <div key={field.id}>
                        <Label htmlFor={`custom-${field.id}`} className="text-sm font-medium text-gray-700">
                          {field.label}
                          {field.required && <span className="text-red-500 mr-1">*</span>}
                        </Label>
                        {field.type === "textarea" ? (
                          <Textarea
                            id={`custom-${field.id}`}
                            value={formData.customFields[field.id] || ""}
                            onChange={(e) => setFormData((prev) => ({
                              ...prev,
                              customFields: {
                                ...prev.customFields,
                                [field.id]: e.target.value
                              }
                            }))}
                            className="mt-1"
                            rows={4}
                            placeholder={field.placeholder}
                            required={field.required}
                          />
                        ) : field.type === "date" ? (
                          <Input
                            id={`custom-${field.id}`}
                            type="date"
                            value={formData.customFields[field.id] || ""}
                            onChange={(e) => setFormData((prev) => ({
                              ...prev,
                              customFields: {
                                ...prev.customFields,
                                [field.id]: e.target.value
                              }
                            }))}
                            className="mt-1"
                            required={field.required}
                          />
                        ) : field.type === "checkbox" ? (
                          <div className="flex items-center space-x-2 space-x-reverse mt-2">
                            <Checkbox
                              id={`custom-${field.id}`}
                              checked={formData.customFields[field.id] || false}
                              onCheckedChange={(checked) => setFormData((prev) => ({
                                ...prev,
                                customFields: {
                                  ...prev.customFields,
                                  [field.id]: checked === true
                                }
                              }))}
                            />
                            <Label htmlFor={`custom-${field.id}`} className="text-sm text-gray-700 cursor-pointer">
                              {field.placeholder || field.label}
                            </Label>
                          </div>
                        ) : field.type === "select" ? (
                          <Select
                            value={formData.customFields[field.id] || ""}
                            onValueChange={(value) => setFormData((prev) => ({
                              ...prev,
                              customFields: {
                                ...prev.customFields,
                                [field.id]: value
                              }
                            }))}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder={field.placeholder || 'בחר...'} />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options?.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            id={`custom-${field.id}`}
                            type="text"
                            value={formData.customFields[field.id] || ""}
                            onChange={(e) => setFormData((prev) => ({
                              ...prev,
                              customFields: {
                                ...prev.customFields,
                                [field.id]: e.target.value
                              }
                            }))}
                            className="mt-1"
                            placeholder={field.placeholder}
                            required={field.required}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Method */}
                <div 
                  className="pb-6"
                  style={{ 
                    borderBottom: '1px solid #e5e7eb'
                  }}
                >
                  <h2 
                    className="text-lg font-semibold mb-4 flex items-center gap-2"
                  >
                    <Truck className="w-5 h-5" />
                    {translationsLoading ? (
                      <TextSkeleton width="w-32" height="h-6" />
                    ) : (
                      'שיטת משלוח'
                    )}
                  </h2>
                  <RadioGroup
                    value={formData.deliveryMethod}
                    onValueChange={(value: any) =>
                      setFormData((prev) => ({ ...prev, deliveryMethod: value }))
                    }
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2 space-x-reverse border border-gray-200 rounded-lg p-4 hover:border-gray-300 cursor-pointer">
                      <RadioGroupItem value="shipping" id="shipping" />
                      <Label htmlFor="shipping" className="cursor-pointer flex-1">
                        <div className="font-medium">
                          {translationsLoading ? (
                            <TextSkeleton width="w-16" height="h-5" />
                          ) : (
                            'משלוח'
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {shippingCost === 0 ? (
                            translationsLoading ? (
                              <TextSkeleton width="w-24" height="h-4" />
                            ) : (
                              'משלוח חינם'
                            )
                          ) : (
                            `₪${shippingCost.toFixed(2)}`
                          )}
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Shipping Address */}
                {formData.deliveryMethod === 'shipping' && (
                  <div 
                    className="pb-6"
                    style={{ 
                      borderBottom: '1px solid #e5e7eb'
                    }}
                  >
                    <h2 
                      className="text-lg font-semibold mb-4 flex items-center gap-2"
                    >
                      <Truck className="w-5 h-5" />
                      {translationsLoading ? (
                        <TextSkeleton width="w-32" height="h-6" />
                      ) : (
                        'כתובת משלוח'
                      )}
                    </h2>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                            {translationsLoading ? (
                              <TextSkeleton width="w-12" height="h-4" />
                            ) : (
                              'עיר *'
                            )}
                          </Label>
                          <Autocomplete
                            id="city"
                            value={formData.city}
                            onChange={(value) => {
                              setFormData((prev) => ({ ...prev, city: value }))
                              citySearch.setQuery(value)
                            }}
                            onSelect={(option) => {
                              setFormData((prev) => ({ ...prev, city: option.value }))
                              setSelectedCityForStreets(option.value)
                            }}
                            options={citySearch.cities.map((city: any) => ({
                              value: city.cityName,
                              label: city.cityName,
                            }))}
                            loading={citySearch.loading}
                            placeholder={translationsLoading ? '' : 'התחל להקליד עיר...'}
                            className="mt-1"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                            {translationsLoading ? (
                              <TextSkeleton width="w-16" height="h-4" />
                            ) : (
                              'רחוב *'
                            )}
                          </Label>
                          <Autocomplete
                            id="address"
                            value={formData.address}
                            onChange={(value) => {
                              setFormData((prev) => ({ ...prev, address: value }))
                              streetSearch.setQuery(value)
                            }}
                            onSelect={(option) => {
                              setFormData((prev) => ({ ...prev, address: option.value }))
                            }}
                            options={streetSearch.streets.map((street: any) => ({
                              value: street.streetName,
                              label: street.streetName,
                            }))}
                            loading={streetSearch.loading}
                            placeholder={formData.city ? (translationsLoading ? '' : 'התחל להקליד רחוב...') : (translationsLoading ? '' : 'בחר עיר תחילה...')}
                            className="mt-1"
                            required
                            disabled={!formData.city}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="houseNumber" className="text-sm font-medium text-gray-700">
                            {translationsLoading ? (
                              <TextSkeleton width="w-24" height="h-4" />
                            ) : (
                              'מספר בית *'
                            )}
                          </Label>
                          <Input
                            id="houseNumber"
                            value={formData.houseNumber}
                            onChange={(e) => setFormData((prev) => ({ ...prev, houseNumber: e.target.value }))}
                            required
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="apartment" className="text-sm font-medium text-gray-700">
                            {translationsLoading ? (
                              <TextSkeleton width="w-12" height="h-4" />
                            ) : (
                              'דירה'
                            )}
                          </Label>
                          <Input
                            id="apartment"
                            value={formData.apartment}
                            onChange={(e) => setFormData((prev) => ({ ...prev, apartment: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="floor" className="text-sm font-medium text-gray-700">
                            {translationsLoading ? (
                              <TextSkeleton width="w-16" height="h-4" />
                            ) : (
                              'קומה'
                            )}
                          </Label>
                          <Input
                            id="floor"
                            value={formData.floor}
                            onChange={(e) => setFormData((prev) => ({ ...prev, floor: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="zip" className="text-sm font-medium text-gray-700">
                          {translationsLoading ? (
                            <TextSkeleton width="w-16" height="h-4" />
                          ) : (
                            'מיקוד'
                          )}
                        </Label>
                        <Input
                          id="zip"
                          value={formData.zip}
                          onChange={(e) => setFormData((prev) => ({ ...prev, zip: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom Fields from Customizer */}
                {checkoutSettings.custom_fields.length > 0 && (
                  <div 
                    className="pb-6"
                    style={{ 
                      borderBottom: '1px solid #e5e7eb'
                    }}
                  >
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      פרטים נוספים
                    </h2>
                    <div className="space-y-4">
                      {checkoutSettings.custom_fields.map((field) => (
                        <div key={field.id}>
                          <Label htmlFor={field.id} className="text-sm font-medium text-gray-700">
                            {field.label} {field.required && '*'}
                          </Label>
                          {field.type === 'text' && (
                            <Input
                              id={field.id}
                              placeholder={field.placeholder}
                              value={formData.customFields[field.id] || ''}
                              onChange={(e) => setFormData((prev) => ({
                                ...prev,
                                customFields: { ...prev.customFields, [field.id]: e.target.value }
                              }))}
                              className="mt-1"
                              required={field.required}
                            />
                          )}
                          {field.type === 'textarea' && (
                            <Textarea
                              id={field.id}
                              placeholder={field.placeholder}
                              value={formData.customFields[field.id] || ''}
                              onChange={(e) => setFormData((prev) => ({
                                ...prev,
                                customFields: { ...prev.customFields, [field.id]: e.target.value }
                              }))}
                              className="mt-1"
                              rows={3}
                              required={field.required}
                            />
                          )}
                          {field.type === 'date' && (
                            <Input
                              id={field.id}
                              type="date"
                              value={formData.customFields[field.id] || ''}
                              onChange={(e) => setFormData((prev) => ({
                                ...prev,
                                customFields: { ...prev.customFields, [field.id]: e.target.value }
                              }))}
                              className="mt-1"
                              required={field.required}
                            />
                          )}
                          {field.type === 'select' && (
                            <Select
                              value={formData.customFields[field.id] || ''}
                              onValueChange={(value) => setFormData((prev) => ({
                                ...prev,
                                customFields: { ...prev.customFields, [field.id]: value }
                              }))}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder={field.placeholder || 'בחר...'} />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options?.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment Method */}
                <div 
                  className="pb-6"
                  style={{ 
                    borderBottom: '1px solid #e5e7eb'
                  }}
                >
                  <h2 
                    className="text-lg font-semibold mb-4 flex items-center gap-2"
                  >
                    <CreditCard className="w-5 h-5" />
                    {translationsLoading ? (
                      <TextSkeleton width="w-32" height="h-6" />
                    ) : (
                      finalTotal > 0 ? 'שיטת תשלום' : 'אישור הזמנה'
                    )}
                  </h2>
                  {loadingPaymentMethods ? (
                    <div className="space-y-3">
                      <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                      <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                    </div>
                  ) : paymentMethods.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                      <p>לא הוגדרו שיטות תשלום לחנות זו</p>
                      <p className="text-sm mt-1">יש ליצור קשר עם בעל החנות</p>
                    </div>
                  ) : (
                    <RadioGroup
                      value={formData.paymentMethod}
                      onValueChange={(value: any) => {
                        setFormData((prev) => ({ ...prev, paymentMethod: value }))
                      }}
                      className="space-y-3"
                    >
                      {paymentMethods.map((method) => (
                        <div 
                          key={method.id}
                          className="flex items-center space-x-2 space-x-reverse border border-gray-200 rounded-lg p-4 hover:border-gray-300 cursor-pointer"
                        >
                          <RadioGroupItem value={method.id} id={method.id} />
                          <Label htmlFor={method.id} className="cursor-pointer flex-1">
                            <div className="font-medium flex items-center gap-2">
                              {method.name}
                              {method.fee && method.fee > 0 && (
                                <span className="text-xs text-gray-500">(+₪{method.fee})</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{method.description}</div>
                          </Label>
                          {method.id === 'credit_card' && <Lock className="w-5 h-5 text-gray-400" />}
                        </div>
                      ))}
                      
                      {/* Store Credit Option - shows only if customer has balance */}
                      {storeCredit && storeCredit.balance > 0 && (
                        <div className="flex items-center space-x-2 space-x-reverse border border-gray-200 rounded-lg p-4 hover:border-gray-300 cursor-pointer">
                          <RadioGroupItem value="store_credit" id="store_credit" />
                          <Label htmlFor="store_credit" className="cursor-pointer flex-1">
                            <div className="font-medium flex items-center gap-2">
                              <Coins className="w-5 h-5 text-yellow-600" />
                              {translationsLoading ? (
                                <TextSkeleton width="w-32" height="h-5" />
                              ) : (
                                'קרדיט בחנות'
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {translationsLoading ? (
                                <TextSkeleton width="w-40" height="h-4" />
                              ) : (
                                `יתרה זמינה: ₪${storeCredit.balance.toFixed(2)}`
                              )}
                            </div>
                          </Label>
                        </div>
                      )}
                    </RadioGroup>
                  )}
                  
                  {/* Store Credit Amount Input */}
                  {formData.paymentMethod === 'store_credit' && storeCredit && storeCredit.balance > 0 && (
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="storeCreditAmount" className="text-sm font-medium text-gray-700">
                        סכום קרדיט לשימוש (₪)
                      </Label>
                      <Input
                        id="storeCreditAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        max={Math.min(storeCredit.balance, getTotal())}
                        value={formData.storeCreditAmount || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          const maxAmount = Math.min(storeCredit.balance, getTotal());
                          setFormData((prev) => ({
                            ...prev,
                            storeCreditAmount: Math.min(value, maxAmount),
                          }));
                        }}
                        className="mt-1"
                        placeholder={`0.00 (מקסימום: ₪${Math.min(storeCredit.balance, getTotal()).toFixed(2)})`}
                      />
                      <p className="text-xs text-gray-500">
                        יתרה זמינה: ₪{storeCredit.balance.toFixed(2)} | 
                        סכום הזמנה: ₪{getTotal().toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Summary - Right Side - 40% */}
            <div 
              className="lg:col-span-2 min-h-screen flex justify-start"
              style={{
                backgroundColor: checkoutSettings.layout.left_column_color,
              }}
            >
              <div className="w-full max-w-md px-8 py-8">
                <div 
                  className="p-6 sticky top-24"
                  style={{ 
                    backgroundColor: checkoutSettings.layout.left_column_color,
                  }}
                >
                  <h2 
                    className="text-lg font-semibold mb-6"
                  >
                    {translationsLoading ? (
                      <TextSkeleton width="w-32" height="h-6" />
                    ) : (
                      t('checkout.order_summary')
                    )}
                  </h2>
                  
                  {/* Cart Items */}
                  <div className="space-y-4 mb-6">
                    {calculation?.items?.map((calculatedItem) => {
                      const item = calculatedItem.item;
                      const hasDiscount = calculatedItem.lineDiscount > 0;
                      
                      return (
                        <div key={item.variant_id} className="flex gap-3">
                          {item.image ? (
                            <div className="relative">
                              <img
                                src={item.image}
                                alt={item.product_title}
                                className="w-16 h-16 object-cover rounded"
                              />
                              <div className="absolute -top-2 -right-2 w-5 h-5 bg-gray-500 text-white text-xs rounded-full flex items-center justify-center">
                                {item.quantity}
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="w-16 h-16 rounded flex items-center justify-center relative"
                              style={{ 
                                backgroundColor: '#e5e7eb40',
                              }}
                            >
                              <Truck className="w-8 h-8 text-gray-400" />
                              <div className="absolute -top-2 -right-2 w-5 h-5 bg-gray-500 text-white text-xs rounded-full flex items-center justify-center">
                                {item.quantity}
                              </div>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm line-clamp-2">
                              {item.product_title}
                            </div>
                            {/* הצגת אפשרויות המוצר (מידה, צבע וכו') */}
                            {item.properties && item.properties.length > 0 ? (
                              <div className="text-xs mt-0.5 text-gray-500 space-y-0.5">
                                {item.properties.map((prop: { name: string; value: string }, idx: number) => (
                                  <div key={idx}>
                                    {prop.name}: {prop.value}
                                  </div>
                                ))}
                              </div>
                            ) : item.variant_title !== 'Default Title' && (
                              <div className="text-xs mt-0.5 text-gray-500">
                                {item.variant_title}
                              </div>
                            )}
                          </div>
                          <div className="font-medium">
                            <div className="text-base font-bold">
                              ₪{calculatedItem.lineTotalAfterDiscount.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Coupon/Discount Code - מועבר למטה לסיכום */}
                  {discountCode && (
                    <div className="mb-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-green-800">
                          {discountCode}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-green-700 hover:text-green-900 hover:bg-green-100"
                        onClick={async () => {
                          await removeDiscountCode();
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  {!discountCode && (
                    <div className="mb-4 flex gap-2">
                      <Input
                        type="text"
                        value={codeInput}
                        onChange={(e) => {
                          setCodeInput(e.target.value);
                          setCodeError('');
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && handleApplyCode()}
                        placeholder={translationsLoading ? '' : 'קוד קופון או הנחה'}
                        className="flex-1"
                        style={{ backgroundColor: '#ffffff' }}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        className="px-6"
                        style={{ backgroundColor: '#e5e7eb' }}
                        onClick={handleApplyCode}
                        disabled={validatingCode || !codeInput.trim()}
                      >
                        {validatingCode ? (
                          translationsLoading ? (
                            <TextSkeleton width="w-12" height="h-4" />
                          ) : (
                            t('checkout.checking')
                          )
                        ) : translationsLoading ? (
                          <TextSkeleton width="w-12" height="h-4" />
                        ) : (
                          t('checkout.apply')
                        )}
                      </Button>
                    </div>
                  )}
                  {codeError && (
                    <p className="mb-4 text-sm text-red-600">{codeError}</p>
                  )}

                  {/* Summary */}
                  <div 
                    className="pt-4 space-y-2 text-sm border-t"
                    style={{ 
                      borderColor: '#e5e7eb'
                    }}
                  >
                    <div className="flex justify-between">
                      <span style={{ opacity: 0.7 }}>
                        {translationsLoading ? (
                          <TextSkeleton width="w-24" height="h-4" />
                        ) : (
                          'סכום ביניים'
                        )}
                      </span>
                      <span className="font-medium">₪{getSubtotal().toFixed(2)}</span>
                    </div>
                    
                    {/* הנחות - סיכום מפורט עם שמות */}
                    {getDiscount() > 0 && (
                      <>
                        {getDiscounts().filter(d => d.source === 'automatic').map((discount, idx) => (
                          <div key={`auto-${idx}`} className="flex justify-between text-green-600">
                            <span>
                              {translationsLoading ? (
                                <TextSkeleton width="w-24" height="h-4" />
                              ) : (
                                discount.name || discount.description || 'הנחה אוטומטית'
                              )}
                            </span>
                            <span>
                              {discount.type === 'free_shipping' ? (
                                'משלוח חינם'
                              ) : (
                                `-₪${discount.amount.toFixed(2)}`
                              )}
                            </span>
                          </div>
                        ))}
                        
                        {getDiscounts().filter(d => d.source === 'code').map((discount, idx) => (
                          <div key={`code-${idx}`} className="flex justify-between text-green-600">
                            <span>
                              {translationsLoading ? (
                                <TextSkeleton width="w-16" height="h-4" />
                              ) : (
                                `קופון ${discount.code || discount.name || 'הנחה'}`
                              )}
                            </span>
                            <span>
                              {discount.type === 'free_shipping' ? (
                                'משלוח חינם'
                              ) : (
                                `-₪${discount.amount.toFixed(2)}`
                              )}
                            </span>
                          </div>
                        ))}
                      </>
                    )}
                    
                    {shippingCost > 0 && (
                      <div className="flex justify-between">
                        <span style={{ opacity: 0.7 }}>
                          {translationsLoading ? (
                            <TextSkeleton width="w-16" height="h-4" />
                          ) : (
                            formData.deliveryMethod === 'pickup' ? 'איסוף עצמי' : 'משלוח'
                          )}
                        </span>
                        <span>₪{shippingCost.toFixed(2)}</span>
                      </div>
                    )}
                    
                    {shippingCost === 0 && formData.deliveryMethod === 'shipping' && (
                      <div className="flex justify-between text-green-600">
                        <span>
                          {translationsLoading ? (
                            <TextSkeleton width="w-16" height="h-4" />
                          ) : (
                            'משלוח'
                          )}
                        </span>
                        <span>
                          {translationsLoading ? (
                            <TextSkeleton width="w-12" height="h-4" />
                          ) : (
                            'חינם'
                          )}
                        </span>
                      </div>
                    )}
                    
                    {/* Store Credit Applied */}
                    {formData.paymentMethod === 'store_credit' && formData.storeCreditAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>
                          {translationsLoading ? (
                            <TextSkeleton width="w-24" height="h-4" />
                          ) : (
                            'קרדיט בחנות'
                          )}
                        </span>
                        <span>-₪{formData.storeCreditAmount.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div 
                      className="pt-2 flex justify-between font-bold text-lg border-t"
                      style={{ 
                        borderColor: '#e5e7eb',
                      }}
                    >
                      <span>
                        {translationsLoading ? (
                          <TextSkeleton width="w-16" height="h-6" />
                        ) : (
                          formData.paymentMethod === 'store_credit' && formData.storeCreditAmount >= finalTotal
                            ? 'סה"כ לתשלום'
                            : 'סה"כ'
                        )}
                      </span>
                      <span>
                        {formData.paymentMethod === 'store_credit' && formData.storeCreditAmount >= finalTotal
                          ? '₪0.00'
                          : `₪${Math.max(0, finalTotal - (formData.storeCreditAmount || 0)).toFixed(2)}`}
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  {/* Minimum order warning */}
                  {minimumOrderAmount > 0 && getTotal() < minimumOrderAmount && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm text-center">
                      סכום ההזמנה המינימלי הוא ₪{minimumOrderAmount.toFixed(2)}. נותרו עוד ₪{(minimumOrderAmount - getTotal()).toFixed(2)} להזמנה.
                    </div>
                  )}
                  
                  <Button
                    type="submit"
                    className="w-full mt-6 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      backgroundColor: checkoutSettings.button.background_color,
                      color: checkoutSettings.button.text_color,
                      borderRadius: `${checkoutSettings.button.border_radius}px`
                    }}
                    size="lg"
                    disabled={processing || loadingPaymentMethods || paymentMethods.length === 0 || (minimumOrderAmount > 0 && getTotal() < minimumOrderAmount)}
                  >
                    {processing ? (
                      translationsLoading ? (
                        <TextSkeleton width="w-24" height="h-5" />
                      ) : (
                        'מעבד...'
                      )
                    ) : translationsLoading ? (
                      <TextSkeleton width="w-32" height="h-5" />
                    ) : formData.paymentMethod === 'store_credit' && formData.storeCreditAmount >= finalTotal ? (
                      'אישור הזמנה'
                    ) : (
                      `${checkoutSettings.button.text} ₪${Math.max(0, finalTotal - (formData.storeCreditAmount || 0)).toFixed(2)}`
                    )}
                  </Button>
                  
                  <div className="text-xs text-gray-500 text-center mt-4 flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3" />
                    {translationsLoading ? (
                      <TextSkeleton width="w-24" height="h-3" />
                    ) : (
                      'תשלום מאובטח'
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
      
      {/* Checkout Footer */}
      <CheckoutFooter storeSlug={storeSlug} />
    </>
  );
}

