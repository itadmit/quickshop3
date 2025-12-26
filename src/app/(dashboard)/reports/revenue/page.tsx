'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  HiArrowLeft,
  HiDownload,
  HiCurrencyDollar,
  HiTrendingUp,
  HiTrendingDown,
  HiShoppingCart,
  HiCreditCard,
  HiReceiptTax,
  HiTruck,
} from 'react-icons/hi';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { DateRangePicker, getDefaultDateRange, dateRangeToParams } from '@/components/ui/DateRangePicker';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface RevenueStats {
  gross_revenue: number;
  net_revenue: number;
  total_tax: number;
  total_shipping: number;
  total_discounts: number;
  total_refunds: number;
  orders_count: number;
  avg_order_value: number;
  revenue_growth: number;
}

interface DailyRevenue {
  date: string;
  gross_revenue: number;
  net_revenue: number;
  orders: number;
}

interface RevenueByPayment {
  payment_method: string;
  revenue: number;
  orders: number;
  percentage: number;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function RevenueReportPage() {
  const { toast } = useOptimisticToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RevenueStats>({
    gross_revenue: 0,
    net_revenue: 0,
    total_tax: 0,
    total_shipping: 0,
    total_discounts: 0,
    total_refunds: 0,
    orders_count: 0,
    avg_order_value: 0,
    revenue_growth: 0,
  });
  const [dailyData, setDailyData] = useState<DailyRevenue[]>([]);
  const [byPayment, setByPayment] = useState<RevenueByPayment[]>([]);
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

      const response = await fetch(`/api/reports/revenue?${params.toString()}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || stats);
        setDailyData(data.daily || []);
        setByPayment(data.by_payment || []);
      }
    } catch (error: any) {
      console.error('Error loading revenue report:', error);
      toast({ title: 'שגיאה', description: 'לא ניתן לטעון נתונים', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const { start_date, end_date } = dateRangeToParams(dateRange);
      const params = new URLSearchParams();
      params.append('start_date', start_date);
      params.append('end_date', end_date);

      const response = await fetch(`/api/reports/revenue/export?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to export');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `revenue-report-${start_date}-${end_date}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: 'הצלחה', description: 'הדוח יוצא בהצלחה' });
    } catch (error: any) {
      toast({ title: 'שגיאה', description: 'שגיאה בייצוא הדוח', variant: 'destructive' });
    }
  };

  const breakdownData = [
    { name: 'הכנסות ברוטו', value: stats.gross_revenue, color: '#22c55e' },
    { name: 'מיסים', value: -stats.total_tax, color: '#f59e0b' },
    { name: 'משלוחים', value: stats.total_shipping, color: '#3b82f6' },
    { name: 'הנחות', value: -stats.total_discounts, color: '#ef4444' },
    { name: 'החזרים', value: -stats.total_refunds, color: '#8b5cf6' },
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
            <h1 className="text-2xl font-bold text-gray-900">דוח הכנסות</h1>
            <p className="text-gray-500 mt-1">ניתוח פיננסי מקיף</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
          <Button onClick={handleExport} variant="ghost">
            <HiDownload className="w-4 h-4 ml-1" />
            ייצא CSV
          </Button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-emerald-100 text-sm">הכנסות ברוטו</div>
              <HiCurrencyDollar className="w-6 h-6 text-emerald-200" />
            </div>
            <div className="text-3xl font-bold">₪{stats.gross_revenue.toLocaleString('he-IL')}</div>
            {stats.revenue_growth !== 0 && (
              <div className="flex items-center gap-1 mt-2 text-sm">
                {stats.revenue_growth > 0 ? (
                  <HiTrendingUp className="w-4 h-4" />
                ) : (
                  <HiTrendingDown className="w-4 h-4" />
                )}
                <span>{Math.abs(stats.revenue_growth).toFixed(1)}% מהתקופה הקודמת</span>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">הכנסות נטו</div>
              <HiCreditCard className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">₪{stats.net_revenue.toLocaleString('he-IL')}</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">הזמנות</div>
              <HiShoppingCart className="w-6 h-6 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.orders_count.toLocaleString('he-IL')}</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">ממוצע להזמנה</div>
              <HiTrendingUp className="w-6 h-6 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">₪{stats.avg_order_value.toFixed(0)}</div>
          </div>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <HiReceiptTax className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">מיסים</div>
                <div className="font-bold text-gray-900">₪{stats.total_tax.toLocaleString('he-IL')}</div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <HiTruck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">משלוחים</div>
                <div className="font-bold text-gray-900">₪{stats.total_shipping.toLocaleString('he-IL')}</div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <HiCurrencyDollar className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">הנחות</div>
                <div className="font-bold text-red-600">₪{stats.total_discounts.toLocaleString('he-IL')}</div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <HiCurrencyDollar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">החזרים</div>
                <div className="font-bold text-purple-600">₪{stats.total_refunds.toLocaleString('he-IL')}</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">מגמת הכנסות</h2>
            {loading ? (
              <div className="h-80 animate-pulse bg-gray-200 rounded"></div>
            ) : dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyData.map((d) => ({
                  date: new Date(d.date).toLocaleDateString('he-IL', { month: 'short', day: 'numeric' }),
                  gross_revenue: d.gross_revenue,
                  net_revenue: d.net_revenue,
                  orders: d.orders,
                }))} margin={{ right: 20, left: 20 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    orientation="right"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `₪${value.toLocaleString('he-IL')}`}
                  />
                  <Tooltip 
                    contentStyle={{ direction: 'rtl', textAlign: 'right' }}
                    formatter={(value: number, name: string) => {
                    if (name.includes('revenue')) return [`₪${value.toLocaleString('he-IL')}`, name === 'gross_revenue' ? 'ברוטו' : 'נטו'];
                    return [value, 'הזמנות'];
                    }} 
                  />
                  <Legend wrapperStyle={{ direction: 'rtl' }} />
                  <Area
                    type="monotone"
                    dataKey="gross_revenue"
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    name="הכנסות ברוטו"
                  />
                  <Area
                    type="monotone"
                    dataKey="net_revenue"
                    stroke="#3b82f6"
                    fillOpacity={0.3}
                    fill="#3b82f6"
                    name="הכנסות נטו"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">אין נתונים</div>
            )}
          </div>
        </Card>

        {/* Revenue by Payment Method */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">הכנסות לפי אמצעי תשלום</h2>
            {loading ? (
              <div className="h-80 animate-pulse bg-gray-200 rounded"></div>
            ) : byPayment.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={byPayment.map((p) => ({ name: p.payment_method || 'אחר', value: p.revenue }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {byPayment.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ direction: 'rtl', textAlign: 'right' }}
                    formatter={(value: number) => [`₪${value.toLocaleString('he-IL')}`, 'הכנסות']} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">אין נתונים</div>
            )}
          </div>
        </Card>
      </div>

      {/* Financial Breakdown */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">פירוט פיננסי</h2>
          <div className="space-y-4">
            {/* Gross Revenue */}
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="font-medium text-gray-900">הכנסות ברוטו</span>
              </div>
              <span className="font-bold text-emerald-600">+₪{stats.gross_revenue.toLocaleString('he-IL')}</span>
            </div>

            {/* Deductions */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-700">הנחות</span>
              </div>
              <span className="text-red-600">-₪{stats.total_discounts.toLocaleString('he-IL')}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-gray-700">החזרים</span>
              </div>
              <span className="text-purple-600">-₪{stats.total_refunds.toLocaleString('he-IL')}</span>
            </div>

            {/* Net Revenue */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="font-bold text-gray-900">הכנסות נטו</span>
              </div>
              <span className="font-bold text-blue-600 text-xl">₪{stats.net_revenue.toLocaleString('he-IL')}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

