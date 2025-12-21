'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  HiArrowLeft,
  HiDownload,
  HiCurrencyDollar,
  HiShoppingCart,
  HiTrendingUp,
  HiCalendar,
} from 'react-icons/hi';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
  avg_order_value: number;
}

interface SalesStats {
  total_revenue: number;
  total_orders: number;
  avg_order_value: number;
  orders_growth: number;
  revenue_growth: number;
}

export default function SalesReportPage() {
  const { toast } = useOptimisticToast();
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [stats, setStats] = useState<SalesStats>({
    total_revenue: 0,
    total_orders: 0,
    avg_order_value: 0,
    orders_growth: 0,
    revenue_growth: 0,
  });
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');

  useEffect(() => {
    loadData();
  }, [dateRange, groupBy]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('start_date', dateRange.start_date);
      params.append('end_date', dateRange.end_date);
      params.append('group_by', groupBy);

      const response = await fetch(`/api/reports/sales?${params.toString()}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSalesData(data.sales || []);
        setStats(data.stats || stats);
      }
    } catch (error: any) {
      console.error('Error loading sales report:', error);
      toast({ title: 'שגיאה', description: 'לא ניתן לטעון נתונים', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      params.append('start_date', dateRange.start_date);
      params.append('end_date', dateRange.end_date);
      params.append('format', 'csv');

      const response = await fetch(`/api/analytics/export?${params.toString()}&report_type=sales`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_type: 'sales',
          format: 'csv',
          start_date: dateRange.start_date,
          end_date: dateRange.end_date,
        }),
      });

      if (!response.ok) throw new Error('Failed to export');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-report-${dateRange.start_date}-${dateRange.end_date}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: 'הצלחה', description: 'הדוח יוצא בהצלחה' });
    } catch (error: any) {
      toast({ title: 'שגיאה', description: 'שגיאה בייצוא הדוח', variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/reports" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <HiArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">סקירת מכירות</h1>
            <p className="text-gray-500 mt-1">מכירות לפי תאריך וזמן</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">יומי</SelectItem>
              <SelectItem value="week">שבועי</SelectItem>
              <SelectItem value="month">חודשי</SelectItem>
            </SelectContent>
          </Select>
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
          <Button onClick={handleExport} variant="ghost">
            <HiDownload className="w-4 h-4 ml-1" />
            ייצא CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">סה"כ הכנסות</div>
              <HiCurrencyDollar className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">₪{stats.total_revenue.toLocaleString('he-IL')}</div>
            {stats.revenue_growth !== 0 && (
              <div className={`text-sm mt-1 ${stats.revenue_growth > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {stats.revenue_growth > 0 ? '+' : ''}{stats.revenue_growth.toFixed(1)}%
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">סה"כ הזמנות</div>
              <HiShoppingCart className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.total_orders.toLocaleString('he-IL')}</div>
            {stats.orders_growth !== 0 && (
              <div className={`text-sm mt-1 ${stats.orders_growth > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {stats.orders_growth > 0 ? '+' : ''}{stats.orders_growth.toFixed(1)}%
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">ערך הזמנה ממוצע</div>
              <HiTrendingUp className="w-6 h-6 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">₪{stats.avg_order_value.toFixed(0)}</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">ימים בתקופה</div>
              <HiCalendar className="w-6 h-6 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{salesData.length}</div>
          </div>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">מגמת הכנסות</h2>
          {loading ? (
            <div className="h-80 animate-pulse bg-gray-200 rounded"></div>
          ) : salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={salesData.map((d) => ({
                date: new Date(d.date).toLocaleDateString('he-IL', { month: 'short', day: 'numeric' }),
                revenue: d.revenue,
                orders: d.orders,
              }))}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip formatter={(value: number, name: string) => {
                  if (name === 'revenue') return [`₪${value.toLocaleString('he-IL')}`, 'הכנסות'];
                  return [value, 'הזמנות'];
                }} />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#22c55e"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name="הכנסות"
                />
                <Bar yAxisId="right" dataKey="orders" fill="#3b82f6" name="הזמנות" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">אין נתונים להצגה</div>
          )}
        </div>
      </Card>

      {/* Daily Breakdown Table */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">פירוט יומי</h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 animate-pulse bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : salesData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">תאריך</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">הזמנות</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">הכנסות</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">ממוצע להזמנה</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.slice().reverse().map((day, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 font-medium text-gray-900">
                        {new Date(day.date).toLocaleDateString('he-IL', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-4 px-4 text-gray-900">{day.orders}</td>
                      <td className="py-4 px-4 text-emerald-600 font-medium">₪{day.revenue.toLocaleString('he-IL')}</td>
                      <td className="py-4 px-4 text-gray-900">₪{day.avg_order_value.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">אין נתונים</div>
          )}
        </div>
      </Card>
    </div>
  );
}

