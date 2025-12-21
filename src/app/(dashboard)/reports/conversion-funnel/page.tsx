'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  HiArrowLeft,
  HiDownload,
  HiEye,
  HiShoppingCart,
  HiCreditCard,
  HiCheckCircle,
  HiArrowDown,
} from 'react-icons/hi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
  Cell,
} from 'recharts';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface FunnelData {
  visits: number;
  product_views: number;
  add_to_cart: number;
  checkout_started: number;
  purchases: number;
  visit_to_product_rate: number;
  product_to_cart_rate: number;
  cart_to_checkout_rate: number;
  checkout_to_purchase_rate: number;
  overall_conversion_rate: number;
  cart_abandonment_rate: number;
  checkout_abandonment_rate: number;
}

interface DailyFunnel {
  date: string;
  visits: number;
  add_to_cart: number;
  purchases: number;
  conversion_rate: number;
}

const FUNNEL_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function ConversionFunnelPage() {
  const { toast } = useOptimisticToast();
  const [loading, setLoading] = useState(true);
  const [funnelData, setFunnelData] = useState<FunnelData>({
    visits: 0,
    product_views: 0,
    add_to_cart: 0,
    checkout_started: 0,
    purchases: 0,
    visit_to_product_rate: 0,
    product_to_cart_rate: 0,
    cart_to_checkout_rate: 0,
    checkout_to_purchase_rate: 0,
    overall_conversion_rate: 0,
    cart_abandonment_rate: 0,
    checkout_abandonment_rate: 0,
  });
  const [dailyData, setDailyData] = useState<DailyFunnel[]>([]);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('start_date', dateRange.start_date);
      params.append('end_date', dateRange.end_date);

      const response = await fetch(`/api/reports/conversion-funnel?${params.toString()}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setFunnelData(data.funnel || funnelData);
        setDailyData(data.daily || []);
      }
    } catch (error: any) {
      console.error('Error loading conversion funnel:', error);
      toast({ title: 'שגיאה', description: 'לא ניתן לטעון נתונים', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const funnelChartData = [
    { name: 'ביקורים', value: funnelData.visits, fill: '#3b82f6' },
    { name: 'צפיות במוצרים', value: funnelData.product_views, fill: '#22c55e' },
    { name: 'הוספה לעגלה', value: funnelData.add_to_cart, fill: '#f59e0b' },
    { name: 'התחלת תשלום', value: funnelData.checkout_started, fill: '#ef4444' },
    { name: 'רכישות', value: funnelData.purchases, fill: '#8b5cf6' },
  ];

  const funnelSteps = [
    {
      icon: <HiEye className="w-8 h-8" />,
      name: 'ביקורים',
      value: funnelData.visits,
      rate: 100,
      color: 'bg-blue-500',
    },
    {
      icon: <HiEye className="w-8 h-8" />,
      name: 'צפיות במוצרים',
      value: funnelData.product_views,
      rate: funnelData.visit_to_product_rate,
      color: 'bg-emerald-500',
    },
    {
      icon: <HiShoppingCart className="w-8 h-8" />,
      name: 'הוספה לעגלה',
      value: funnelData.add_to_cart,
      rate: funnelData.product_to_cart_rate,
      color: 'bg-amber-500',
    },
    {
      icon: <HiCreditCard className="w-8 h-8" />,
      name: 'התחלת תשלום',
      value: funnelData.checkout_started,
      rate: funnelData.cart_to_checkout_rate,
      color: 'bg-rose-500',
    },
    {
      icon: <HiCheckCircle className="w-8 h-8" />,
      name: 'רכישות',
      value: funnelData.purchases,
      rate: funnelData.checkout_to_purchase_rate,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/reports" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <HiArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">משפך המרה</h1>
            <p className="text-gray-500 mt-1">ניתוח מסע הלקוח מביקור ועד רכישה</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={`${dateRange.start_date}_${dateRange.end_date}`}
            onValueChange={(value) => {
              const [start, end] = value.split('_');
              setDateRange({ start_date: start, end_date: end });
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={`${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}_${new Date().toISOString().split('T')[0]}`}>
                7 ימים אחרונים
              </SelectItem>
              <SelectItem value={`${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}_${new Date().toISOString().split('T')[0]}`}>
                30 ימים אחרונים
              </SelectItem>
              <SelectItem value={`${new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}_${new Date().toISOString().split('T')[0]}`}>
                90 ימים אחרונים
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-6 text-center">
            <div className="text-sm text-gray-500 mb-2">שיעור המרה כללי</div>
            <div className="text-3xl font-bold text-emerald-600">{funnelData.overall_conversion_rate.toFixed(2)}%</div>
            <div className="text-xs text-gray-400 mt-1">מביקור לרכישה</div>
          </div>
        </Card>

        <Card>
          <div className="p-6 text-center">
            <div className="text-sm text-gray-500 mb-2">נטישת עגלות</div>
            <div className="text-3xl font-bold text-red-600">{funnelData.cart_abandonment_rate.toFixed(1)}%</div>
            <div className="text-xs text-gray-400 mt-1">הוסיפו לעגלה אבל לא קנו</div>
          </div>
        </Card>

        <Card>
          <div className="p-6 text-center">
            <div className="text-sm text-gray-500 mb-2">נטישת תשלום</div>
            <div className="text-3xl font-bold text-amber-600">{funnelData.checkout_abandonment_rate.toFixed(1)}%</div>
            <div className="text-xs text-gray-400 mt-1">התחילו תשלום אבל לא סיימו</div>
          </div>
        </Card>

        <Card>
          <div className="p-6 text-center">
            <div className="text-sm text-gray-500 mb-2">סה"כ רכישות</div>
            <div className="text-3xl font-bold text-gray-900">{funnelData.purchases.toLocaleString('he-IL')}</div>
            <div className="text-xs text-gray-400 mt-1">הזמנות שהושלמו</div>
          </div>
        </Card>
      </div>

      {/* Visual Funnel */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">משפך המרה ויזואלי</h2>
          {loading ? (
            <div className="h-96 animate-pulse bg-gray-200 rounded"></div>
          ) : (
            <div className="space-y-4">
              {funnelSteps.map((step, index) => {
                const width = funnelData.visits > 0 ? (step.value / funnelData.visits) * 100 : 0;
                return (
                  <div key={index}>
                    <div className="flex items-center gap-4 mb-2">
                      <div className={`p-2 rounded-lg ${step.color} text-white`}>
                        {step.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">{step.name}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-lg font-bold text-gray-900">
                              {step.value.toLocaleString('he-IL')}
                            </span>
                            {index > 0 && (
                              <span className="text-sm text-gray-500">
                                ({step.rate.toFixed(1)}% מהשלב הקודם)
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                          <div
                            className={`h-full ${step.color} transition-all duration-500`}
                            style={{ width: `${Math.max(width, 2)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    {index < funnelSteps.length - 1 && (
                      <div className="flex justify-center my-2">
                        <HiArrowDown className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Daily Conversion Trend */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">מגמת המרה יומית</h2>
          {loading ? (
            <div className="h-80 animate-pulse bg-gray-200 rounded"></div>
          ) : dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData.map((d) => ({
                date: new Date(d.date).toLocaleDateString('he-IL', { month: 'short', day: 'numeric' }),
                visits: d.visits,
                add_to_cart: d.add_to_cart,
                purchases: d.purchases,
                conversion_rate: d.conversion_rate,
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="visits" fill="#3b82f6" name="ביקורים" />
                <Bar yAxisId="left" dataKey="add_to_cart" fill="#f59e0b" name="הוספה לעגלה" />
                <Bar yAxisId="left" dataKey="purchases" fill="#22c55e" name="רכישות" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">אין נתונים</div>
          )}
        </div>
      </Card>

      {/* Conversion Rates Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="text-sm text-gray-500 mb-2">ביקור → צפייה במוצר</div>
            <div className="text-2xl font-bold text-blue-600">{funnelData.visit_to_product_rate.toFixed(1)}%</div>
            <div className="h-2 bg-gray-100 rounded-full mt-3">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${funnelData.visit_to_product_rate}%` }}
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="text-sm text-gray-500 mb-2">צפייה → הוספה לעגלה</div>
            <div className="text-2xl font-bold text-emerald-600">{funnelData.product_to_cart_rate.toFixed(1)}%</div>
            <div className="h-2 bg-gray-100 rounded-full mt-3">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${funnelData.product_to_cart_rate}%` }}
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="text-sm text-gray-500 mb-2">עגלה → תשלום</div>
            <div className="text-2xl font-bold text-amber-600">{funnelData.cart_to_checkout_rate.toFixed(1)}%</div>
            <div className="h-2 bg-gray-100 rounded-full mt-3">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${funnelData.cart_to_checkout_rate}%` }}
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="text-sm text-gray-500 mb-2">תשלום → רכישה</div>
            <div className="text-2xl font-bold text-purple-600">{funnelData.checkout_to_purchase_rate.toFixed(1)}%</div>
            <div className="h-2 bg-gray-100 rounded-full mt-3">
              <div
                className="h-full bg-purple-500 rounded-full"
                style={{ width: `${funnelData.checkout_to_purchase_rate}%` }}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

