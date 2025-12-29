'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  HiArrowLeft,
  HiDownload,
  HiUserGroup,
  HiTag,
  HiShoppingCart,
  HiCurrencyDollar,
  HiTrendingUp,
} from 'react-icons/hi';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { DateRangePicker, getDefaultDateRange, dateRangeToParams } from '@/components/ui/DateRangePicker';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface InfluencerData {
  influencer_id: number;
  influencer_name: string;
  influencer_email: string;
  coupons_count: number;
  orders_count: number;
  revenue: number;
  discount_amount: number;
}

interface DailyData {
  date: string;
  influencer_id: number;
  influencer_name: string;
  orders_count: number;
  revenue: number;
}

export default function InfluencersReportPage() {
  const { toast } = useOptimisticToast();
  const [loading, setLoading] = useState(true);
  const [influencers, setInfluencers] = useState<InfluencerData[]>([]);
  const [daily, setDaily] = useState<DailyData[]>([]);
  const [totals, setTotals] = useState({
    total_influencers: 0,
    total_orders: 0,
    total_revenue: 0,
    total_discounts: 0,
  });
  const [dateRange, setDateRange] = useState(getDefaultDateRange());

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      const { start_date, end_date } = dateRangeToParams(dateRange);
      const params = new URLSearchParams();
      params.append('start_date', start_date);
      params.append('end_date', end_date);

      const response = await fetch(`/api/reports/influencers?${params.toString()}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setInfluencers(data.influencers || []);
        setDaily(data.daily || []);
        setTotals(data.totals || totals);
      }
    } catch (error: any) {
      console.error('Error loading influencers report:', error);
      toast({ title: 'שגיאה', description: 'לא ניתן לטעון נתונים', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const topInfluencersChart = influencers.slice(0, 10).map((i) => ({
    name: i.influencer_name.length > 15 ? i.influencer_name.substring(0, 15) + '...' : i.influencer_name,
    revenue: i.revenue,
    orders: i.orders_count,
  }));

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/reports" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <HiArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">דוח משפיענים</h1>
            <p className="text-gray-500 mt-1">ביצועי משפיענים ומכירות</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">משפיענים פעילים</div>
              <HiUserGroup className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{totals.total_influencers}</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">הזמנות</div>
              <HiShoppingCart className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{totals.total_orders.toLocaleString('he-IL')}</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">סה"כ הכנסות</div>
              <HiCurrencyDollar className="w-6 h-6 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">₪{totals.total_revenue.toLocaleString('he-IL')}</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">סה"כ הנחות</div>
              <HiTag className="w-6 h-6 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-600">₪{totals.total_discounts.toLocaleString('he-IL')}</div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Influencers */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">10 משפיענים מובילים</h2>
            {loading ? (
              <div className="h-80 animate-pulse bg-gray-200 rounded"></div>
            ) : topInfluencersChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={topInfluencersChart} layout="vertical" margin={{ right: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    orientation="top"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `₪${value.toLocaleString('he-IL')}`}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={150}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{ direction: 'rtl', textAlign: 'right' }}
                    formatter={(value: number, name: string) => {
                      if (name === 'revenue') return [`₪${value.toLocaleString('he-IL')}`, 'הכנסות'];
                      if (name === 'orders') return [value.toLocaleString('he-IL'), 'הזמנות'];
                      return [value, name];
                    }}
                  />
                  <Legend wrapperStyle={{ direction: 'rtl' }} />
                  <Bar dataKey="revenue" fill="#3b82f6" name="הכנסות" radius={[4, 0, 0, 4]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">אין נתונים</div>
            )}
          </div>
        </Card>

        {/* Daily Revenue Trend */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">מגמת הכנסות יומית</h2>
            {loading ? (
              <div className="h-80 animate-pulse bg-gray-200 rounded"></div>
            ) : daily.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={daily.reduce((acc: any[], d) => {
                  const existing = acc.find(a => a.date === d.date);
                  if (existing) {
                    existing.revenue += d.revenue;
                    existing.orders += d.orders_count;
                  } else {
                    acc.push({
                      date: new Date(d.date).toLocaleDateString('he-IL', { month: 'short', day: 'numeric' }),
                      revenue: d.revenue,
                      orders: d.orders_count,
                    });
                  }
                  return acc;
                }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())} margin={{ right: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    yAxisId="left" 
                    orientation="right"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `₪${value.toLocaleString('he-IL')}`}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="left"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ direction: 'rtl', textAlign: 'right' }}
                    formatter={(value: number, name: string) => {
                      if (name === 'revenue') return [`₪${value.toLocaleString('he-IL')}`, 'הכנסות'];
                      if (name === 'orders') return [value.toLocaleString('he-IL'), 'הזמנות'];
                      return [value, name];
                    }}
                  />
                  <Legend wrapperStyle={{ direction: 'rtl' }} />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="הכנסות (₪)" />
                  <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#22c55e" strokeWidth={2} name="הזמנות" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">אין נתונים</div>
            )}
          </div>
        </Card>
      </div>

      {/* Influencers Table */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">פירוט משפיענים</h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 animate-pulse bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : influencers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">משפיען</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">אימייל</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">קופונים</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">הזמנות</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">הכנסות</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">הנחות</th>
                  </tr>
                </thead>
                <tbody>
                  {influencers.map((influencer, index) => (
                    <tr key={influencer.influencer_id || index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <HiUserGroup className="w-4 h-4 text-purple-500" />
                          <span className="font-medium text-gray-900">{influencer.influencer_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-500">{influencer.influencer_email}</td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                          {influencer.coupons_count}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-900">{influencer.orders_count}</td>
                      <td className="py-4 px-4 text-emerald-600 font-medium">₪{influencer.revenue.toLocaleString('he-IL')}</td>
                      <td className="py-4 px-4 text-red-600">₪{influencer.discount_amount.toLocaleString('he-IL')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">אין נתונים להצגה</div>
          )}
        </div>
      </Card>
    </div>
  );
}


