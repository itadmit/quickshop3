'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import Link from 'next/link';

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

export function CheckoutForm({ storeId, storeName, storeLogo, storeSlug, customFields = [] }: CheckoutFormProps) {
  const router = useRouter();
  const { cartItems, clearCart, isLoading: cartLoading } = useCart();
  const { t, loading: translationsLoading } = useTranslation('storefront');
  const [processing, setProcessing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  
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

  // רענון חישוב כשהעגלה משתנה - רק כשהכמויות משתנות
  useEffect(() => {
    if (cartItems.length > 0) {
      recalculate();
    }
  }, [cartItems.map(i => `${i.variant_id}-${i.quantity}`).join(','), recalculate]);

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
    paymentMethod: 'credit_card' as 'credit_card' | 'bank_transfer' | 'cash',
    deliveryMethod: 'shipping' as 'shipping' | 'pickup',
    customFields: {} as Record<string, any>,
  });

  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

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
        total: total,
        deliveryMethod: formData.deliveryMethod,
        paymentMethod: formData.paymentMethod,
        customFields: formData.customFields,
      });

      // Track Purchase event
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
  useEffect(() => {
    if (isMounted && cartItems.length === 0 && !orderCompleted) {
      router.push(`/shops/${storeSlug}/cart`);
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
            <div className="lg:col-span-2 border-b border-gray-200 flex justify-start" style={{ backgroundColor: '#fafafa' }}>
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
                backgroundColor: '#fafafa',
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
    <div 
      className="min-h-screen" 
      dir="rtl"
      style={{ 
        backgroundColor: '#ffffff',
      }}
    >
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
              backgroundColor: '#ffffff',
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
                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(value: any) => {
                      setFormData((prev) => ({ ...prev, paymentMethod: value }))
                    }}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2 space-x-reverse border border-gray-200 rounded-lg p-4 hover:border-gray-300 cursor-pointer">    
                      <RadioGroupItem value="credit_card" id="credit_card" />
                      <Label htmlFor="credit_card" className="cursor-pointer flex-1">                                                                           
                        <div className="font-medium">
                          {translationsLoading ? (
                            <TextSkeleton width="w-24" height="h-5" />
                          ) : (
                            'כרטיס אשראי'
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {translationsLoading ? (
                            <TextSkeleton width="w-32" height="h-4" />
                          ) : (
                            'תשלום מאובטח בכרטיס אשראי'
                          )}
                        </div>                                                                  
                      </Label>
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse border border-gray-200 rounded-lg p-4 hover:border-gray-300 cursor-pointer">      
                      <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                      <Label htmlFor="bank_transfer" className="cursor-pointer flex-1">                                                                           
                        <div className="font-medium">
                          {translationsLoading ? (
                            <TextSkeleton width="w-32" height="h-5" />
                          ) : (
                            'העברה בנקאית'
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {translationsLoading ? (
                            <TextSkeleton width="w-40" height="h-4" />
                          ) : (
                            'העברת כסף ישירות לחשבון הבנק'
                          )}
                        </div>                                                                 
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse border border-gray-200 rounded-lg p-4 hover:border-gray-300 cursor-pointer">      
                      <RadioGroupItem value="cash" id="cash" />
                      <Label htmlFor="cash" className="cursor-pointer flex-1">
                        <div className="font-medium">
                          {translationsLoading ? (
                            <TextSkeleton width="w-32" height="h-5" />
                          ) : (
                            'מזומן בהזמנה'
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {translationsLoading ? (
                            <TextSkeleton width="w-40" height="h-4" />
                          ) : (
                            'תשלום במזומן בעת המשלוח'
                          )}
                        </div>                                                                      
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>

            {/* Order Summary - Right Side - 40% */}
            <div 
              className="lg:col-span-2 min-h-screen flex justify-start"
              style={{
                backgroundColor: '#fafafa',
              }}
            >
              <div className="w-full max-w-md px-8 py-8">
                <div 
                  className="p-6 sticky top-24"
                  style={{ 
                    backgroundColor: '#fafafa',
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
                            {calculatedItem.appliedDiscounts && calculatedItem.appliedDiscounts.length > 0 && (
                              <div className="mt-1 space-y-0.5">
                                {calculatedItem.appliedDiscounts.map((discount, idx) => (
                                  <div key={idx} className="text-xs text-green-600">
                                    {discount.source === 'automatic' && '🔵 '}
                                    {discount.source === 'code' && '🟢 '}
                                    {discount.description}: -₪{discount.amount.toFixed(2)}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="font-medium">
                            {hasDiscount ? (
                              <div className="text-right">
                                <div className="text-sm text-gray-400 line-through">
                                  ₪{calculatedItem.lineTotal.toFixed(2)}
                                </div>
                                <div className="text-base font-bold text-green-600">
                                  ₪{calculatedItem.lineTotalAfterDiscount.toFixed(2)}
                                </div>
                              </div>
                            ) : (
                              <div className="text-base font-bold">
                                ₪{calculatedItem.lineTotalAfterDiscount.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Coupon/Discount Code */}
                  <div className="mb-6">
                    {discountCode ? (
                      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-green-800">
                            {discountCode}
                          </div>
                          {getDiscounts().filter(d => d.source === 'code').length > 0 && (
                            <div className="text-xs text-green-600">
                              {translationsLoading ? (
                                <TextSkeleton width="w-24" height="h-3" />
                              ) : (
                                `חיסכון של ₪${getDiscounts()
                                  .filter(d => d.source === 'code')
                                  .reduce((sum, d) => sum + d.amount, 0)
                                  .toFixed(2)}`
                              )}
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-green-700 hover:text-green-900 hover:bg-green-100"
                          onClick={removeDiscountCode}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
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
                      <p className="mt-2 text-sm text-red-600">{codeError}</p>
                    )}
                  </div>

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
                    
                    {getDiscounts().filter(d => d.source === 'code').length > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>
                          {translationsLoading ? (
                            <TextSkeleton width="w-16" height="h-4" />
                          ) : (
                            'קופון'
                          )}
                        </span>
                        <span>
                          -₪{getDiscounts()
                            .filter(d => d.source === 'code')
                            .reduce((sum, d) => sum + d.amount, 0)
                            .toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    {getDiscounts().filter(d => d.source === 'automatic').length > 0 && (
                      <div className="flex items-center justify-between gap-2">
                        <Badge className="bg-green-100 hover:bg-green-100 text-green-800 border border-green-700 text-xs font-semibold whitespace-nowrap px-2 py-1 rounded-sm">
                          {translationsLoading ? (
                            <TextSkeleton width="w-24" height="h-3" />
                          ) : (
                            getDiscounts().find(d => d.source === 'automatic')?.name || 'הנחה אוטומטית'
                          )}
                        </Badge>
                        <span className="text-green-600 font-medium">
                          -₪{getDiscounts()
                            .filter(d => d.source === 'automatic')
                            .reduce((sum, d) => sum + d.amount, 0)
                            .toFixed(2)}
                        </span>
                      </div>
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
                          'סה"כ'
                        )}
                      </span>
                      <span>₪{finalTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full mt-6 text-white rounded-lg font-semibold"
                    style={{ backgroundColor: '#9333ea' }}
                    size="lg"
                    disabled={processing}
                  >
                    {processing ? (
                      translationsLoading ? (
                        <TextSkeleton width="w-24" height="h-5" />
                      ) : (
                        'מעבד...'
                      )
                    ) : translationsLoading ? (
                      <TextSkeleton width="w-32" height="h-5" />
                    ) : (
                      `שלם ₪${finalTotal.toFixed(2)}`
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
  );
}

