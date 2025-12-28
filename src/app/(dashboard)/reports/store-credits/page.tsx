'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  HiArrowLeft,
  HiDownload,
  HiCurrencyDollar,
  HiUsers,
  HiTrendingUp,
  HiTrendingDown,
} from 'react-icons/hi';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { DateRangePicker, getDefaultDateRange, dateRangeToParams } from '@/components/ui/DateRangePicker';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface CustomerCredit {
  customer_id: number;
  customer_name: string;
  customer_email: string;
  balance: number;
  total_earned: number;
  total_used: number;
  transaction_count: number;
}

interface DailyData {
  date: string;
  count: number;
  total_amount: number;
}

export default function StoreCreditsReportPage() {
  const { toast } = useOptimisticToast();
  const [loading, setLoading] = useState(true);
  const [earned, setEarned] = useState<DailyData[]>([]);
  const [used, setUsed] = useState<DailyData[]>([]);
  const [customers, setCustomers] = useState<CustomerCredit[]>([]);
  const [totals, setTotals] = useState({
    total_customers_with_credit: 0,
    total_balance: 0,
    total_earned: 0,
    total_used: 0,
    total_expired: 0,
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

      const response = await fetch(`/api/reports/store-credits?${params.toString()}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setEarned(data.earned || []);
        setUsed(data.used || []);
        setCustomers(data.customers || []);
        setTotals(data.totals || totals);
      }
    } catch (error: any) {
      console.error('Error loading store credits report:', error);
      toast({ title: 'שגיאה', description: 'לא ניתן לטעון נתונים', variant: 'destructive' });
    } finally {
      setLoading(false);
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
            <h1 className="text-2xl font-bold text-gray-900">דוח קרדיטים בחנות</h1>
            <p className="text-gray-500 mt-1">ניתוח קרדיטים שנוצרו ושומשו</p>
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
              <div className="text-sm text-gray-500">לקוחות עם קרדיט</div>
              <HiUsers className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{totals.total_customers_with_credit}</div>
            <div className="text-sm text-gray-500 mt-1">סה"כ יתרה: ₪{totals.total_balance.toLocaleString('he-IL')}</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">קרדיטים שנוצרו</div>
              <HiTrendingUp className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-600">₪{totals.total_earned.toLocaleString('he-IL')}</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">קרדיטים ששומשו</div>
              <HiTrendingDown className="w-6 h-6 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-600">₪{totals.total_used.toLocaleString('he-IL')}</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">קרדיטים שפגו</div>
              <HiCurrencyDollar className="w-6 h-6 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-600">₪{totals.total_expired.toLocaleString('he-IL')}</div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earned vs Used */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">קרדיטים שנוצרו ושומשו</h2>
            {loading ? (
              <div className="h-80 animate-pulse bg-gray-200 rounded"></div>
            ) : earned.length > 0 || used.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart margin={{ right: 20, left: 20 }}>
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
                      if (name === 'earned') return [`₪${value.toLocaleString('he-IL')}`, 'נוצרו'];
                      if (name === 'used') return [`₪${value.toLocaleString('he-IL')}`, 'שומשו'];
                      return [`₪${value.toLocaleString('he-IL')}`, name];
                    }}
                  />
                  <Legend wrapperStyle={{ direction: 'rtl' }} />
                  <Line type="monotone" dataKey="total_amount" data={earned} stroke="#22c55e" strokeWidth={2} name="נוצרו" />
                  <Line type="monotone" dataKey="total_amount" data={used} stroke="#ef4444" strokeWidth={2} name="שומשו" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">אין נתונים</div>
            )}
          </div>
        </Card>

        {/* Balance Distribution */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">יתרות לקוחות</h2>
            {loading ? (
              <div className="h-80 animate-pulse bg-gray-200 rounded"></div>
            ) : customers.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={customers.slice(0, 10).map(c => ({ name: c.customer_name.substring(0, 15), balance: c.balance }))} margin={{ right: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    orientation="right"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `₪${value.toLocaleString('he-IL')}`}
                  />
                  <Tooltip 
                    contentStyle={{ direction: 'rtl', textAlign: 'right' }}
                    formatter={(value: number) => [`₪${value.toLocaleString('he-IL')}`, 'יתרה']}
                  />
                  <Bar dataKey="balance" fill="#3b82f6" name="יתרה" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">אין נתונים</div>
            )}
          </div>
        </Card>
      </div>

      {/* Customers Table */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">פירוט קרדיטים לפי לקוח</h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 animate-pulse bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : customers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">לקוח</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">אימייל</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">יתרה נוכחית</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">סה"כ נוצר</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">סה"כ שומש</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">מספר עסקאות</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer, index) => (
                    <tr key={customer.customer_id || index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 font-medium text-gray-900">{customer.customer_name}</td>
                      <td className="py-4 px-4 text-gray-500">{customer.customer_email}</td>
                      <td className="py-4 px-4 text-emerald-600 font-medium">₪{customer.balance.toLocaleString('he-IL')}</td>
                      <td className="py-4 px-4 text-gray-900">₪{customer.total_earned.toLocaleString('he-IL')}</td>
                      <td className="py-4 px-4 text-red-600">₪{customer.total_used.toLocaleString('he-IL')}</td>
                      <td className="py-4 px-4 text-gray-900">{customer.transaction_count}</td>
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

