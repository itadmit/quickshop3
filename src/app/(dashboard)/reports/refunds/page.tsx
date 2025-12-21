'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import {
  HiArrowLeft,
  HiRefresh,
  HiCurrencyDollar,
  HiShoppingCart,
  HiTrendingDown,
  HiExclamationCircle,
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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface RefundStats {
  total_refunds: number;
  total_refund_amount: number;
  total_orders: number;
  refund_rate: number;
  avg_refund_amount: number;
}

interface RefundByReason {
  reason: string;
  count: number;
  amount: number;
  percentage: number;
}

interface DailyRefunds {
  date: string;
  refunds: number;
  amount: number;
}

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e', '#8b5cf6', '#ec4899'];

export default function RefundsReportPage() {
  const { toast } = useOptimisticToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RefundStats>({
    total_refunds: 0,
    total_refund_amount: 0,
    total_orders: 0,
    refund_rate: 0,
    avg_refund_amount: 0,
  });
  const [refundsByReason, setRefundsByReason] = useState<RefundByReason[]>([]);
  const [dailyData, setDailyData] = useState<DailyRefunds[]>([]);
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

      const response = await fetch(`/api/reports/refunds?${params.toString()}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || stats);
        setRefundsByReason(data.by_reason || []);
        setDailyData(data.daily || []);
      }
    } catch (error: any) {
      console.error('Error loading refunds report:', error);
      toast({ title: 'שגיאה', description: 'לא ניתן לטעון נתונים', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const reasonPieData = refundsByReason.map((r) => ({
    name: r.reason || 'לא צוין',
    value: r.amount,
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
            <h1 className="text-2xl font-bold text-gray-900">דוח החזרות וביטולים</h1>
            <p className="text-gray-500 mt-1">ניתוח החזרים כספיים וביטולי הזמנות</p>
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
              <div className="text-sm text-gray-500">סה"כ החזרים</div>
              <HiRefresh className="w-6 h-6 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.total_refunds}</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">סכום החזרים</div>
              <HiCurrencyDollar className="w-6 h-6 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-600">₪{stats.total_refund_amount.toLocaleString('he-IL')}</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">שיעור החזרים</div>
              <HiTrendingDown className="w-6 h-6 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-600">{stats.refund_rate.toFixed(2)}%</div>
            <div className="text-sm text-gray-400">מתוך {stats.total_orders} הזמנות</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">החזר ממוצע</div>
              <HiExclamationCircle className="w-6 h-6 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">₪{stats.avg_refund_amount.toFixed(0)}</div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Refunds by Reason */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">החזרים לפי סיבה</h2>
            {loading ? (
              <div className="h-80 animate-pulse bg-gray-200 rounded"></div>
            ) : reasonPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reasonPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {reasonPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`₪${value.toLocaleString('he-IL')}`, 'סכום']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">אין נתונים</div>
            )}
          </div>
        </Card>

        {/* Daily Refunds Trend */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">מגמת החזרים יומית</h2>
            {loading ? (
              <div className="h-80 animate-pulse bg-gray-200 rounded"></div>
            ) : dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData.map((d) => ({
                  date: new Date(d.date).toLocaleDateString('he-IL', { month: 'short', day: 'numeric' }),
                  refunds: d.refunds,
                  amount: d.amount,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="refunds" fill="#ef4444" name="מספר החזרים" />
                  <Line yAxisId="right" type="monotone" dataKey="amount" stroke="#f59e0b" strokeWidth={2} name="סכום (₪)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">אין נתונים</div>
            )}
          </div>
        </Card>
      </div>

      {/* Refunds by Reason Table */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">פירוט לפי סיבה</h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : refundsByReason.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">סיבה</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">מספר החזרים</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">סכום</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">אחוז</th>
                  </tr>
                </thead>
                <tbody>
                  {refundsByReason.map((reason, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 font-medium text-gray-900">{reason.reason || 'לא צוין'}</td>
                      <td className="py-4 px-4 text-gray-900">{reason.count}</td>
                      <td className="py-4 px-4 text-red-600 font-medium">₪{reason.amount.toLocaleString('he-IL')}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-red-500 rounded-full"
                              style={{ width: `${reason.percentage}%` }}
                            />
                          </div>
                          <span className="text-gray-500 text-sm">{reason.percentage.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">אין החזרים בתקופה הנבחרת</div>
          )}
        </div>
      </Card>
    </div>
  );
}

