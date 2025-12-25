'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  HiArrowLeft,
  HiDownload,
  HiUsers,
  HiUserAdd,
  HiRefresh,
  HiCurrencyDollar,
  HiTrendingUp,
  HiMail,
} from 'react-icons/hi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { DateRangePicker, getDefaultDateRange, dateRangeToParams } from '@/components/ui/DateRangePicker';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface CustomerStats {
  total_customers: number;
  new_customers: number;
  returning_customers: number;
  one_time_buyers: number;
  repeat_buyers: number;
  total_revenue: number;
  new_customer_revenue: number;
  returning_customer_revenue: number;
  avg_order_value: number;
  avg_orders_per_customer: number;
  avg_customer_lifetime_value: number;
}

interface TopCustomer {
  customer_id: number;
  customer_name: string;
  customer_email: string;
  orders_count: number;
  total_spent: number;
  avg_order_value: number;
  first_order_date: string;
  last_order_date: string;
}

interface DailyCustomers {
  date: string;
  new_customers: number;
  returning_customers: number;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function CustomersReportPage() {
  const { toast } = useOptimisticToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CustomerStats>({
    total_customers: 0,
    new_customers: 0,
    returning_customers: 0,
    one_time_buyers: 0,
    repeat_buyers: 0,
    total_revenue: 0,
    new_customer_revenue: 0,
    returning_customer_revenue: 0,
    avg_order_value: 0,
    avg_orders_per_customer: 0,
    avg_customer_lifetime_value: 0,
  });
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [dailyData, setDailyData] = useState<DailyCustomers[]>([]);
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

      const response = await fetch(`/api/reports/customers?${params.toString()}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || stats);
        setTopCustomers(data.top_customers || []);
        setDailyData(data.daily_customers || []);
      }
    } catch (error: any) {
      console.error('Error loading customers report:', error);
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

      const response = await fetch(`/api/reports/customers/export?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to export');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers-report-${start_date}-${end_date}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: 'הצלחה', description: 'הדוח יוצא בהצלחה' });
    } catch (error: any) {
      toast({ title: 'שגיאה', description: 'שגיאה בייצוא הדוח', variant: 'destructive' });
    }
  };

  const pieData = [
    { name: 'לקוחות חדשים', value: stats.new_customers },
    { name: 'לקוחות חוזרים', value: stats.returning_customers },
  ];

  const revenueByType = [
    { name: 'לקוחות חדשים', value: stats.new_customer_revenue },
    { name: 'לקוחות חוזרים', value: stats.returning_customer_revenue },
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
            <h1 className="text-2xl font-bold text-gray-900">דוח לקוחות</h1>
            <p className="text-gray-500 mt-1">ניתוח לקוחות חדשים וחוזרים</p>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">סה"כ לקוחות</div>
              <HiUsers className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.total_customers.toLocaleString('he-IL')}</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">לקוחות חדשים</div>
              <HiUserAdd className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.new_customers.toLocaleString('he-IL')}</div>
            <div className="text-sm text-gray-400 mt-1">
              {stats.total_customers > 0 ? ((stats.new_customers / stats.total_customers) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">לקוחות חוזרים</div>
              <HiRefresh className="w-6 h-6 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.returning_customers.toLocaleString('he-IL')}</div>
            <div className="text-sm text-gray-400 mt-1">
              {stats.total_customers > 0 ? ((stats.returning_customers / stats.total_customers) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">ערך חיי לקוח ממוצע</div>
              <HiCurrencyDollar className="w-6 h-6 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">₪{stats.avg_customer_lifetime_value.toFixed(0)}</div>
          </div>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-6">
            <div className="text-sm text-gray-500 mb-2">ערך הזמנה ממוצע</div>
            <div className="text-xl font-bold text-gray-900">₪{stats.avg_order_value.toFixed(0)}</div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="text-sm text-gray-500 mb-2">הזמנות ממוצע ללקוח</div>
            <div className="text-xl font-bold text-gray-900">{stats.avg_orders_per_customer.toFixed(1)}</div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="text-sm text-gray-500 mb-2">סה"כ הכנסות</div>
            <div className="text-xl font-bold text-emerald-600">₪{stats.total_revenue.toLocaleString('he-IL')}</div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Distribution Pie */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">התפלגות לקוחות</h2>
            {loading ? (
              <div className="h-80 animate-pulse bg-gray-200 rounded"></div>
            ) : (
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
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Revenue by Customer Type */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">הכנסות לפי סוג לקוח</h2>
            {loading ? (
              <div className="h-80 animate-pulse bg-gray-200 rounded"></div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueByType} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip formatter={(value: number) => [`₪${value.toLocaleString('he-IL')}`, 'הכנסות']} />
                  <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Daily Trend */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">מגמת לקוחות יומית</h2>
          {loading ? (
            <div className="h-80 animate-pulse bg-gray-200 rounded"></div>
          ) : dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData.map((d) => ({
                date: new Date(d.date).toLocaleDateString('he-IL', { month: 'short', day: 'numeric' }),
                new_customers: d.new_customers,
                returning_customers: d.returning_customers,
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="new_customers" stroke="#22c55e" strokeWidth={2} name="חדשים" />
                <Line type="monotone" dataKey="returning_customers" stroke="#3b82f6" strokeWidth={2} name="חוזרים" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">אין נתונים</div>
          )}
        </div>
      </Card>

      {/* Top Customers Table */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">לקוחות מובילים</h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 animate-pulse bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : topCustomers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">#</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">לקוח</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">הזמנות</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">סה"כ הוצאות</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">ממוצע להזמנה</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">הזמנה אחרונה</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.map((customer, index) => (
                    <tr key={customer.customer_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600">
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{customer.customer_name || 'אורח'}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <HiMail className="w-3 h-3" />
                            {customer.customer_email}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-medium text-gray-900">{customer.orders_count}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-emerald-600">₪{customer.total_spent.toLocaleString('he-IL')}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-900">₪{customer.avg_order_value.toFixed(0)}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-500">
                          {new Date(customer.last_order_date).toLocaleDateString('he-IL')}
                        </span>
                      </td>
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

