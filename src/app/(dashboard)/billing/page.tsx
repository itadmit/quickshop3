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
  RefreshCw
} from 'lucide-react';

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

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscribing, setSubscribing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        body: JSON.stringify({ plan_name: planName }),
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">חיוב ומנוי</h1>
        <p className="text-gray-600 mt-2">נהל את המנוי ואמצעי התשלום שלך</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-800">
          <AlertTriangle className="h-5 w-5" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="mr-auto text-red-600 hover:text-red-800">
            ✕
          </button>
        </div>
      )}

      {/* Current Subscription Status */}
      {status?.subscription ? (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold">{status.subscription.plan.display_name}</h2>
                {getStatusBadge(status.subscription.status)}
              </div>
              {status.subscription.plan.commission_percentage > 0 && (
                <p className="text-gray-500 text-sm">
                  + עמלת עסקאות {(status.subscription.plan.commission_percentage * 100).toFixed(1)}%
                </p>
              )}
            </div>
            <div className="text-left">
              <div className="text-3xl font-bold text-primary">
                {formatPrice(status.subscription.plan.price)}
              </div>
              <div className="text-gray-500 text-sm">לחודש + מע"מ</div>
            </div>
          </div>

          {/* Trial Warning */}
          {status.subscription.trial && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">
                    תקופת הניסיון שלך מסתיימת בעוד {status.subscription.trial.remaining_days} ימים
                  </p>
                  <p className="text-blue-700 text-sm">
                    בחר מסלול כדי להמשיך להשתמש ב-Quick Shop
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Cancellation Notice */}
          {status.subscription.cancellation && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-900">המנוי שלך בוטל</p>
                    <p className="text-yellow-700 text-sm">
                      גישה עד {formatDate(status.subscription.cancellation.effective_date)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleReactivate}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                >
                  הפעל מחדש
                </button>
              </div>
            </div>
          )}

          {/* Failed Payments Warning */}
          {status.subscription.failed_payments > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">
                    יש בעיה בחיוב הכרטיס שלך
                  </p>
                  <p className="text-red-700 text-sm">
                    {status.subscription.failed_payments} נסיונות חיוב נכשלו. עדכן את פרטי התשלום שלך.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Billing Details */}
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {status.subscription.billing.next_payment_date && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">התשלום הבא</span>
                </div>
                <div className="font-semibold">
                  {formatDate(status.subscription.billing.next_payment_date)}
                </div>
              </div>
            )}

            {status.subscription.last_payment && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Receipt className="h-4 w-4" />
                  <span className="text-sm">תשלום אחרון</span>
                </div>
                <div className="font-semibold">
                  {formatPrice(status.subscription.last_payment.amount)}
                  <span className="text-gray-500 text-sm mr-2">
                    ({formatDate(status.subscription.last_payment.date)})
                  </span>
                </div>
              </div>
            )}

            {status.payment_method && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <CreditCard className="h-4 w-4" />
                  <span className="text-sm">אמצעי תשלום</span>
                </div>
                <div className="font-semibold">
                  {status.payment_method.brand} •••• {status.payment_method.last_four}
                  <span className="text-gray-500 text-sm mr-2">
                    ({status.payment_method.expiry})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          {status.subscription.status === 'active' && !status.subscription.cancellation && (
            <div className="flex gap-4 pt-4 border-t">
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
              >
                {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : 'בטל מנוי'}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* No subscription - Show pricing */
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
            <div>
              <h2 className="text-lg font-bold text-yellow-900">אין לך מנוי פעיל</h2>
              <p className="text-yellow-700">בחר מסלול כדי להמשיך להשתמש ב-Quick Shop</p>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Plans */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">תוכניות מחירים</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = status?.subscription?.plan.name === plan.name;
            
            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-xl shadow-sm border-2 p-6 transition-all ${
                  plan.is_recommended 
                    ? 'border-primary shadow-lg' 
                    : 'border-gray-200 hover:border-gray-300'
                } ${isCurrentPlan ? 'ring-2 ring-primary ring-offset-2' : ''}`}
              >
                {plan.is_recommended && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                      מומלץ
                    </span>
                  </div>
                )}
                
                {isCurrentPlan && (
                  <div className="absolute top-4 left-4">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.display_name}</h3>
                  <p className="text-gray-600 text-sm">{plan.description}</p>
                </div>

                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-primary">
                    {formatPrice(plan.price)}
                  </div>
                  <div className="text-gray-500">לחודש</div>
                  <div className="text-gray-400 text-sm">
                    + {formatPrice(plan.vat_amount)} מע"מ
                  </div>
                  {plan.commission_display && (
                    <div className="mt-2 text-orange-600 font-medium">
                      + {plan.commission_display} עמלת עסקאות
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.has_checkout ? (
                    <>
                      <li className="flex items-center gap-2 text-gray-700">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>כל הפיצ'רים כלולים</span>
                      </li>
                      <li className="flex items-center gap-2 text-gray-700">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>מערכת סליקה ומשלוחים</span>
                      </li>
                      <li className="flex items-center gap-2 text-gray-700">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>קופונים, מבצעים ומועדון לקוחות</span>
                      </li>
                      <li className="flex items-center gap-2 text-gray-700">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>אינטגרציה לפייסבוק, גוגל וטיקטוק</span>
                      </li>
                      <li className="flex items-center gap-2 text-gray-700">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>תמיכה מלאה בוואטסאפ</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-center gap-2 text-gray-700">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>עיצוב אישי ב-Drag & Drop</span>
                      </li>
                      <li className="flex items-center gap-2 text-gray-700">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>הצגת מוצרים ללא הגבלה</span>
                      </li>
                      <li className="flex items-center gap-2 text-gray-700">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>חיבור לדומיין אישי</span>
                      </li>
                      <li className="flex items-center gap-2 text-gray-700">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>טופס יצירת קשר ללידים</span>
                      </li>
                      <li className="flex items-center gap-2 text-gray-400">
                        <span className="h-5 w-5 text-center">✕</span>
                        <span>ללא אפשרות רכישה</span>
                      </li>
                    </>
                  )}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.name)}
                  disabled={subscribing || isCurrentPlan}
                  className={`w-full py-3 rounded-lg font-semibold transition ${
                    isCurrentPlan
                      ? 'bg-gray-100 text-gray-500 cursor-default'
                      : plan.is_recommended
                        ? 'bg-primary text-white hover:bg-primary/90'
                        : 'border-2 border-primary text-primary hover:bg-primary/5'
                  }`}
                >
                  {subscribing ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : isCurrentPlan ? (
                    'התוכנית הנוכחית שלך'
                  ) : status?.subscription ? (
                    'עבור לתוכנית זו'
                  ) : (
                    'התחל עכשיו'
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction History */}
      {status?.recent_transactions && status.recent_transactions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">היסטוריית תשלומים</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-right">
                  <th className="pb-3 text-gray-600 font-medium">תאריך</th>
                  <th className="pb-3 text-gray-600 font-medium">תיאור</th>
                  <th className="pb-3 text-gray-600 font-medium">סכום</th>
                  <th className="pb-3 text-gray-600 font-medium">סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {status.recent_transactions.map((tx) => (
                  <tr key={tx.id} className="border-b last:border-0">
                    <td className="py-4 text-gray-900">
                      {formatDate(tx.created_at)}
                    </td>
                    <td className="py-4 text-gray-600">
                      {tx.description}
                    </td>
                    <td className="py-4 font-medium">
                      {formatPrice(tx.total_amount)}
                    </td>
                    <td className="py-4">
                      {tx.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          הצליח
                        </span>
                      ) : tx.status === 'failed' ? (
                        <span className="inline-flex items-center gap-1 text-red-600">
                          <AlertTriangle className="h-4 w-4" />
                          נכשל
                        </span>
                      ) : (
                        <span className="text-gray-500">{tx.status}</span>
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
      <div className="mt-8 bg-gray-50 rounded-xl p-6 text-center">
        <p className="text-gray-600 mb-2">
          יש לך שאלות לגבי החיוב?
        </p>
        <a 
          href="mailto:support@quickshop.co.il" 
          className="text-primary hover:underline font-medium"
        >
          צור קשר עם התמיכה
        </a>
      </div>
    </div>
  );
}

