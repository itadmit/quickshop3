'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  ArrowUpRight,
  Receipt,
  Loader2,
  Shield,
  Zap,
  ShoppingBag,
  Package,
  TrendingUp,
  RefreshCw,
  X,
  Gift
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

interface SubscriptionStatus {
  store: {
    id: number;
    name: string;
    slug: string;
    plan: string;
    is_active: boolean;
    is_blocked: boolean;
  };
  subscription: {
    id: number;
    status: string;
    plan: {
      id: number;
      name: string;
      display_name: string;
      price: number;
      vat_percentage: number;
      commission_percentage: number;
      has_checkout: boolean;
    };
    trial: {
      ends_at: string;
      remaining_days: number;
    } | null;
    billing: {
      current_period_start: string;
      current_period_end: string;
      next_payment_date: string;
    };
    last_payment: {
      date: string;
      amount: number;
      status: string;
    } | null;
    cancellation: {
      at_period_end: boolean;
      cancelled_at: string;
      reason: string;
      effective_date: string;
    } | null;
    failed_payments: number;
  } | null;
  payment_method: {
    last_four: string;
    brand: string;
    expiry: string;
  } | null;
  recent_transactions: Array<{
    id: number;
    type: string;
    amount: number;
    total_amount: number;
    status: string;
    description: string;
    created_at: string;
  }>;
}

interface Plan {
  id: number;
  name: string;
  display_name: string;
  description: string;
  price: number;
  vat_amount: number;
  total_price: number;
  commission_display: string | null;
  features: Record<string, boolean>;
  has_checkout: boolean;
  is_recommended: boolean;
}

interface CouponInfo {
  code: string;
  type: string;
  value: number;
  value_type: string;
  message: string;
}

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscribing, setSubscribing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponInfo | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statusRes, plansRes] = await Promise.all([
        fetch('/api/billing/status'),
        fetch('/api/billing/plans'),
      ]);
      
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setStatus(statusData);
      }
      
      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setPlans(plansData.plans || []);
      }
    } catch (err) {
      setError('שגיאה בטעינת נתונים');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planName: string) => {
    try {
      setSubscribing(true);
      
      const res = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          plan_name: planName,
          coupon_code: appliedCoupon?.code || undefined,
        }),
      });
      
      const data = await res.json();
      
      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        setError(data.error || 'שגיאה ביצירת קישור תשלום');
      }
    } catch (err) {
      setError('שגיאה בהתחלת תהליך התשלום');
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('האם אתה בטוח שברצונך לבטל את המנוי? תוכל להמשיך להשתמש עד סוף תקופת החיוב הנוכחית.')) {
      return;
    }
    
    try {
      setCancelling(true);
      
      const res = await fetch('/api/billing/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'User requested cancellation' }),
      });
      
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || 'שגיאה בביטול המנוי');
      }
    } catch (err) {
      setError('שגיאה בביטול המנוי');
    } finally {
      setCancelling(false);
    }
  };

  const handleReactivate = async () => {
    try {
      const res = await fetch('/api/billing/cancel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || 'שגיאה בהפעלת המנוי מחדש');
      }
    } catch (err) {
      setError('שגיאה בהפעלת המנוי מחדש');
    }
  };

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setValidatingCoupon(true);
    setCouponError(null);
    
    try {
      const res = await fetch('/api/billing/coupon/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode }),
      });
      
      const data = await res.json();
      
      if (data.valid) {
        setAppliedCoupon(data.coupon);
        setCouponError(null);
      } else {
        setAppliedCoupon(null);
        setCouponError(data.error || 'קופון לא תקין');
      }
    } catch (err) {
      setCouponError('שגיאה בבדיקת הקופון');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPrice = (amount: number) => {
    return `₪${amount.toLocaleString('he-IL')}`;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      trial: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'תקופת ניסיון' },
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'פעיל' },
      cancelled: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'בוטל' },
      blocked: { bg: 'bg-red-100', text: 'text-red-800', label: 'חסום' },
      expired: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'פג תוקף' },
      past_due: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'תשלום חייב' },
    };
    const badge = badges[status] || badges.active;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 p-6 md:p-8" dir="rtl">
        <div className="max-w-6xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-10 text-center md:text-right space-y-3">
            <Skeleton className="h-10 w-48 md:mr-0 mx-auto" />
            <Skeleton className="h-6 w-64 md:mr-0 mx-auto" />
          </div>

          {/* Status Card Skeleton */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-10">
            <div className="flex flex-col md:flex-row justify-between gap-6 mb-8 border-b border-gray-100 pb-8">
              <div className="space-y-3">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-20 w-40 rounded-xl" />
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
          </div>

          {/* Plans Skeleton */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 h-[600px] flex flex-col">
              <div className="flex flex-col items-center space-y-4 mb-8">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-4 w-60" />
                <Skeleton className="h-16 w-32 mt-4" />
              </div>
              <div className="space-y-4 flex-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
              <Skeleton className="h-14 w-full rounded-xl mt-8" />
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-8 h-[600px] flex flex-col">
              <div className="flex flex-col items-center space-y-4 mb-8">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-4 w-60" />
                <Skeleton className="h-16 w-32 mt-4" />
              </div>
              <div className="space-y-4 flex-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
              <Skeleton className="h-14 w-full rounded-xl mt-8" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 text-center md:text-right">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">חיוב ומנוי</h1>
          <p className="text-gray-500 mt-2 text-lg">נהל את המנוי ואמצעי התשלום שלך במקום אחד</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-800 animate-in fade-in slide-in-from-top-4">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span className="font-medium">{error}</span>
            <button onClick={() => setError(null)} className="mr-auto text-red-600 hover:text-red-800 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Current Subscription Status */}
        {status?.subscription ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-10">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 border-b border-gray-100 pb-8">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-2xl font-bold text-gray-900">{status.subscription.plan.display_name}</h2>
                  {getStatusBadge(status.subscription.status)}
                </div>
                {status.subscription.plan.commission_percentage > 0 && (
                  <p className="text-gray-500 font-medium">
                    + עמלת עסקאות {(status.subscription.plan.commission_percentage * 100).toFixed(1)}%
                  </p>
                )}
              </div>
              <div className="text-right md:text-left bg-gray-50 px-6 py-4 rounded-xl">
                <div className="text-3xl font-bold text-primary mb-1">
                  {formatPrice(status.subscription.plan.price)}
                </div>
                <div className="text-gray-500 text-sm font-medium">לחודש + מע"מ</div>
              </div>
            </div>

            {/* Trial Warning */}
            {status.subscription.trial && (
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-6 flex items-start gap-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-blue-900">
                    תקופת הניסיון מסתיימת בעוד {status.subscription.trial.remaining_days} ימים
                  </p>
                  <p className="text-blue-700 text-sm mt-1">
                    כדי להמשיך להשתמש במערכת ללא הפסקה, אנא בחר מסלול
                  </p>
                </div>
              </div>
            )}

            {/* Cancellation Notice */}
            {status.subscription.cancellation && (
              <div className="bg-yellow-50/50 border border-yellow-100 rounded-xl p-4 mb-6 flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-bold text-yellow-900">המנוי בוטל</p>
                    <p className="text-yellow-700 text-sm mt-1">
                      הגישה תימשך עד {formatDate(status.subscription.cancellation.effective_date)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleReactivate}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition shadow-sm font-medium text-sm"
                >
                  הפעל מחדש
                </button>
              </div>
            )}

            {/* Failed Payments Warning */}
            {status.subscription.failed_payments > 0 && (
              <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 mb-6 flex items-start gap-4">
                <div className="bg-red-100 p-2 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-bold text-red-900">
                    בעיה בחיוב הכרטיס
                  </p>
                  <p className="text-red-700 text-sm mt-1">
                    {status.subscription.failed_payments} נסיונות חיוב נכשלו. אנא עדכן את פרטי התשלום.
                  </p>
                </div>
              </div>
            )}

            {/* Billing Details Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {status.subscription.billing.next_payment_date && (
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium">
                    <Calendar className="h-4 w-4" />
                    <span>התשלום הבא</span>
                  </div>
                  <div className="font-bold text-gray-900 text-lg">
                    {formatDate(status.subscription.billing.next_payment_date)}
                  </div>
                </div>
              )}

              {status.subscription.last_payment && (
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium">
                    <Receipt className="h-4 w-4" />
                    <span>תשלום אחרון</span>
                  </div>
                  <div className="font-bold text-gray-900 text-lg">
                    {formatPrice(status.subscription.last_payment.amount)}
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    {formatDate(status.subscription.last_payment.date)}
                  </div>
                </div>
              )}

              {status.payment_method && (
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium">
                    <CreditCard className="h-4 w-4" />
                    <span>אמצעי תשלום</span>
                  </div>
                  <div className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <span className="uppercase">{status.payment_method.brand}</span>
                    <span>•••• {status.payment_method.last_four}</span>
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    תוקף {status.payment_method.expiry}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            {status.subscription.status === 'active' && !status.subscription.cancellation && (
              <div className="flex justify-end pt-6 border-t border-gray-100">
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition text-sm font-medium flex items-center gap-2"
                >
                  {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : 'בטל מנוי'}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* No subscription - Show alert */
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-6 mb-10 flex items-start gap-4">
            <div className="bg-orange-100 p-2 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-orange-900">אין לך מנוי פעיל</h2>
              <p className="text-orange-800">בחר את המסלול המתאים לך כדי להתחיל</p>
            </div>
          </div>
        )}

        {/* Coupon Code Section */}
        {(!status?.subscription || status.subscription.status === 'trial') && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-10">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              יש לך קוד קופון?
            </h3>
            
            {appliedCoupon ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-1.5 rounded-full">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-green-900">{appliedCoupon.message}</p>
                    <p className="text-green-700 text-sm">קוד: <span className="font-mono font-medium">{appliedCoupon.code}</span></p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="text-green-600 hover:text-green-800 text-sm font-medium px-3 py-1 hover:bg-green-100 rounded-lg transition"
                >
                  הסר
                </button>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponError(null);
                  }}
                  placeholder="הכנס קוד קופון"
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent uppercase text-center md:text-right transition-all outline-none"
                />
                <button
                  onClick={handleValidateCoupon}
                  disabled={validatingCoupon || !couponCode.trim()}
                  className="px-8 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm min-w-[120px]"
                >
                  {validatingCoupon ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    'החל קופון'
                  )}
                </button>
              </div>
            )}
            
            {couponError && (
              <p className="mt-3 text-red-600 text-sm flex items-center gap-2 bg-red-50 p-3 rounded-lg inline-flex">
                <AlertTriangle className="h-4 w-4" />
                {couponError}
              </p>
            )}
          </div>
        )}

        {/* Pricing Plans */}
        <div className="mb-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">תוכניות מחירים</h2>
            <p className="text-gray-500 mt-2">בחר את התוכנית המתאימה ביותר לעסק שלך</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => {
              const isCurrentPlan = status?.subscription?.plan.name === plan.name;
              
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col bg-white rounded-2xl transition-all duration-300 ${
                    plan.is_recommended 
                      ? 'border-2 border-primary shadow-xl scale-105 z-10' 
                      : 'border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md'
                  } ${isCurrentPlan ? 'ring-2 ring-primary ring-offset-4' : ''}`}
                >
                  {plan.is_recommended && (
                    <div className="absolute -top-4 right-1/2 translate-x-1/2">
                      <span className="bg-black text-white px-6 py-1.5 rounded-full text-sm font-bold shadow-md tracking-wide whitespace-nowrap">
                        מומלץ
                      </span>
                    </div>
                  )}
                  
                  {isCurrentPlan && (
                    <div className="absolute top-4 right-4">
                      <div className="bg-primary-green/10 text-primary-green p-2 rounded-full">
                        <CheckCircle className="h-6 w-6" />
                      </div>
                    </div>
                  )}

                  <div className="p-8 pb-0 text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.display_name}</h3>
                    <p className="text-gray-500 h-10 flex items-center justify-center">{plan.description}</p>
                    
                    <div className="mt-8 mb-8">
                      <div className="flex items-baseline justify-center gap-1 text-gray-900">
                        <span className="text-5xl font-bold tracking-tight">{formatPrice(plan.price)}</span>
                      </div>
                      <div className="text-gray-500 font-medium mt-1">לחודש</div>
                      <div className="text-gray-400 text-sm mt-1">
                        + {formatPrice(plan.vat_amount)} מע"מ
                      </div>
                      {plan.commission_display && (
                        <div className="mt-3 inline-block bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm font-bold border border-orange-100">
                          + {plan.commission_display} עמלת עסקאות
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-8 pt-0 flex-1 flex flex-col">
                    <div className="border-t border-gray-100 my-6"></div>
                    
                    <ul className="space-y-4 mb-8 flex-1">
                      {plan.has_checkout ? (
                        <>
                          <FeatureItem text="כל הפיצ'רים כלולים" />
                          <FeatureItem text="מערכת סליקה ומשלוחים" />
                          <FeatureItem text="קופונים, מבצעים ומועדון לקוחות" />
                          <FeatureItem text="אינטגרציה לפייסבוק, גוגל וטיקטוק" />
                          <FeatureItem text="תמיכה מלאה בוואטסאפ" />
                        </>
                      ) : (
                        <>
                          <FeatureItem text="עיצוב אישי ב-Drag & Drop" />
                          <FeatureItem text="הצגת מוצרים ללא הגבלה" />
                          <FeatureItem text="חיבור לדומיין אישי" />
                          <FeatureItem text="טופס יצירת קשר ללידים" />
                          <FeatureItem text="ללא אפשרות רכישה" excluded />
                        </>
                      )}
                    </ul>

                    <button
                      onClick={() => handleSubscribe(plan.name)}
                      disabled={subscribing || isCurrentPlan}
                      className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
                        isCurrentPlan
                          ? 'bg-gray-100 text-gray-400 cursor-default'
                          : plan.is_recommended
                            ? 'bg-black text-white hover:bg-gray-800 shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                            : 'bg-white text-gray-900 border-2 border-gray-200 hover:border-gray-900 hover:-translate-y-0.5'
                      }`}
                    >
                      {subscribing ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : isCurrentPlan ? (
                        <>
                          <CheckCircle className="h-6 w-6" />
                          התוכנית הנוכחית
                        </>
                      ) : status?.subscription ? (
                        <>
                          <ArrowUpRight className="h-6 w-6" />
                          עבור לתוכנית זו
                        </>
                      ) : (
                        <>
                          <Zap className="h-6 w-6" />
                          התחל עכשיו
                        </>
                      )}
                    </button>
                    
                    {!isCurrentPlan && !plan.is_recommended && (
                      <p className="text-center text-xs text-gray-400 mt-4">
                        * ניתן לבטל בכל עת
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transaction History */}
        {status?.recent_transactions && status.recent_transactions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">היסטוריית תשלומים</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    <th className="px-6 py-4">תאריך</th>
                    <th className="px-6 py-4">תיאור</th>
                    <th className="px-6 py-4">סכום</th>
                    <th className="px-6 py-4">סטטוס</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {status.recent_transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-gray-900 font-medium">
                        {formatDate(tx.created_at)}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {tx.description}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {formatPrice(tx.total_amount)}
                      </td>
                      <td className="px-6 py-4">
                        {tx.status === 'success' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3.5 w-3.5" />
                            הצליח
                          </span>
                        ) : tx.status === 'failed' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            נכשל
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {tx.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="bg-blue-50 text-blue-600 p-3 rounded-full inline-flex mb-4">
            <Shield className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">יש לך שאלות לגבי החיוב?</h3>
          <p className="text-gray-600 mb-6 max-w-lg mx-auto">
            צוות התמיכה שלנו זמין עבורך לכל שאלה או בעיה בנושא חיובים, חשבוניות או שינוי תוכנית.
          </p>
          <a 
            href="mailto:support@quickshop.co.il" 
            className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
          >
            צור קשר עם התמיכה
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>

  );
}

function FeatureItem({ text, highlighted = false, excluded = false }: { text: string; highlighted?: boolean; excluded?: boolean }) {
  return (
    <li className={`flex items-start gap-3 ${excluded ? 'opacity-50' : ''}`}>
      <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
        excluded 
          ? 'bg-gray-100 text-gray-400' 
          : highlighted 
            ? 'bg-primary-green/10 text-primary-green' 
            : 'bg-green-100 text-green-600'
      }`}>
        {excluded ? (
          <X className="h-3.5 w-3.5" />
        ) : (
          <CheckCircle className="h-3.5 w-3.5" />
        )}
      </div>
      <span className={`text-sm leading-6 ${highlighted ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
        {text}
      </span>
    </li>
  );
}
