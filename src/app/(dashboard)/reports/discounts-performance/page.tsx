'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  HiArrowLeft,
  HiDownload,
  HiTag,
  HiCurrencyDollar,
  HiShoppingCart,
  HiTrendingUp,
  HiTrendingDown,
  HiTicket,
} from 'react-icons/hi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface DiscountData {
  discount_id: number;
  discount_code: string;
  discount_type: string;
  usage_count: number;
  orders_count: number;
  total_discount_amount: number;
  revenue_generated: number;
  avg_order_value: number;
  conversion_rate: number;
}

interface DailyDiscounts {
  date: string;
  discount_amount: number;
  orders_with_discount: number;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function DiscountsPerformancePage() {
  const { toast } = useOptimisticToast();
  const [loading, setLoading] = useState(true);
  const [discounts, setDiscounts] = useState<DiscountData[]>([]);
  const [dailyData, setDailyData] = useState<DailyDiscounts[]>([]);
  const [totals, setTotals] = useState({
    total_discounts_used: 0,
    total_discount_amount: 0,
    total_orders_with_discount: 0,
    total_revenue_with_discount: 0,
    avg_discount_per_order: 0,
    discount_rate: 0,
  });
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

      const response = await fetch(`/api/reports/discounts-performance?${params.toString()}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setDiscounts(data.discounts || []);
        setDailyData(data.daily || []);
        setTotals(data.totals || totals);
      }
    } catch (error: any) {
      console.error('Error loading discounts report:', error);
      toast({ title: 'שגיאה', description: 'לא ניתן לטעון נתונים', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const pieData = discounts.slice(0, 6).map((d) => ({
    name: d.discount_code,
    value: d.total_discount_amount,
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
            <h1 className="text-2xl font-bold text-gray-900">דוח הנחות וקופונים</h1>
            <p className="text-gray-500 mt-1">ביצועי קודי הנחה וקופונים</p>
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
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">קופונים בשימוש</div>
              <HiTag className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{totals.total_discounts_used}</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">סה"כ הנחות</div>
              <HiCurrencyDollar className="w-6 h-6 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-600">₪{totals.total_discount_amount.toLocaleString('he-IL')}</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">הזמנות עם הנחה</div>
              <HiShoppingCart className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{totals.total_orders_with_discount.toLocaleString('he-IL')}</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">הנחה ממוצעת להזמנה</div>
              <HiTicket className="w-6 h-6 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">₪{totals.avg_discount_per_order.toFixed(0)}</div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Discounts Distribution */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">התפלגות הנחות לפי קופון</h2>
            {loading ? (
              <div className="h-80 animate-pulse bg-gray-200 rounded"></div>
            ) : pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`₪${value.toLocaleString('he-IL')}`, 'הנחות']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">אין נתונים</div>
            )}
          </div>
        </Card>

        {/* Daily Discounts Trend */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">מגמת הנחות יומית</h2>
            {loading ? (
              <div className="h-80 animate-pulse bg-gray-200 rounded"></div>
            ) : dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData.map((d) => ({
                  date: new Date(d.date).toLocaleDateString('he-IL', { month: 'short', day: 'numeric' }),
                  discount_amount: d.discount_amount,
                  orders_with_discount: d.orders_with_discount,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="discount_amount" stroke="#ef4444" strokeWidth={2} name="סכום הנחות (₪)" />
                  <Line yAxisId="right" type="monotone" dataKey="orders_with_discount" stroke="#3b82f6" strokeWidth={2} name="הזמנות עם הנחה" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">אין נתונים</div>
            )}
          </div>
        </Card>
      </div>

      {/* Discounts Table */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">פירוט קופונים</h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 animate-pulse bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : discounts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">קופון</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">סוג</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">שימושים</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">הזמנות</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">סה"כ הנחות</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">הכנסות</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">ממוצע להזמנה</th>
                  </tr>
                </thead>
                <tbody>
                  {discounts.map((discount, index) => (
                    <tr key={discount.discount_id || index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <HiTag className="w-4 h-4 text-purple-500" />
                          <span className="font-medium text-gray-900">{discount.discount_code}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 text-xs bg-gray-100 rounded-full">
                          {discount.discount_type === 'percentage' ? 'אחוזים' : 
                           discount.discount_type === 'fixed_amount' ? 'סכום קבוע' : 
                           discount.discount_type}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-900">{discount.usage_count}</td>
                      <td className="py-4 px-4 text-gray-900">{discount.orders_count}</td>
                      <td className="py-4 px-4 text-red-600 font-medium">₪{discount.total_discount_amount.toLocaleString('he-IL')}</td>
                      <td className="py-4 px-4 text-emerald-600 font-medium">₪{discount.revenue_generated.toLocaleString('he-IL')}</td>
                      <td className="py-4 px-4 text-gray-900">₪{discount.avg_order_value.toFixed(0)}</td>
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

