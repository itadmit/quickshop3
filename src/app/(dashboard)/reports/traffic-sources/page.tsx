'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  HiArrowLeft,
  HiDownload,
  HiGlobeAlt,
  HiTrendingUp,
  HiTrendingDown,
  HiShoppingCart,
  HiCurrencyDollar,
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
  Legend,
} from 'recharts';
import { DateRangePicker, getDefaultDateRange, dateRangeToParams } from '@/components/ui/DateRangePicker';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface TrafficSource {
  source_type: string;
  source_name: string;
  visits: number;
  orders: number;
  revenue: number;
  conversion_rate: number;
  avg_order_value: number;
}

interface SourceDetail {
  name: string;
  icon: string;
  color: string;
  bgColor: string;
}

const sourceDetails: Record<string, SourceDetail> = {
  direct: { name: 'גישה ישירה', icon: '🔗', color: '#6b7280', bgColor: '#f3f4f6' },
  google: { name: 'Google', icon: '🔍', color: '#4285f4', bgColor: '#e8f0fe' },
  facebook: { name: 'Facebook', icon: '📘', color: '#1877f2', bgColor: '#e7f0ff' },
  instagram: { name: 'Instagram', icon: '📸', color: '#e4405f', bgColor: '#fce7eb' },
  tiktok: { name: 'TikTok', icon: '🎵', color: '#000000', bgColor: '#f0f0f0' },
  organic: { name: 'חיפוש אורגני', icon: '🌱', color: '#22c55e', bgColor: '#dcfce7' },
  email: { name: 'אימייל', icon: '📧', color: '#f59e0b', bgColor: '#fef3c7' },
  referral: { name: 'הפניות', icon: '🔀', color: '#8b5cf6', bgColor: '#ede9fe' },
  paid: { name: 'פרסום ממומן', icon: '💰', color: '#ef4444', bgColor: '#fee2e2' },
  social: { name: 'רשתות חברתיות', icon: '👥', color: '#ec4899', bgColor: '#fce7f3' },
  youtube: { name: 'YouTube', icon: '▶️', color: '#ff0000', bgColor: '#fee2e2' },
  twitter: { name: 'Twitter/X', icon: '🐦', color: '#1da1f2', bgColor: '#e8f5fd' },
  linkedin: { name: 'LinkedIn', icon: '💼', color: '#0077b5', bgColor: '#e1f0f9' },
  whatsapp: { name: 'WhatsApp', icon: '💬', color: '#25d366', bgColor: '#dcfce7' },
  none: { name: 'לא ידוע', icon: '❓', color: '#9ca3af', bgColor: '#f3f4f6' },
};

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function TrafficSourcesPage() {
  const { toast } = useOptimisticToast();
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<TrafficSource[]>([]);
  const [totals, setTotals] = useState({
    total_visits: 0,
    total_orders: 0,
    total_revenue: 0,
    overall_conversion_rate: 0,
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

      const response = await fetch(`/api/reports/traffic-sources?${params.toString()}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSources(data.sources || []);
        setTotals(data.totals || totals);
      }
    } catch (error: any) {
      console.error('Error loading traffic sources:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון נתונים',
        variant: 'destructive',
      });
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
      params.append('format', 'csv');

      const response = await fetch(`/api/reports/traffic-sources/export?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to export');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `traffic-sources-${start_date}-${end_date}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'הצלחה',
        description: 'הדוח יוצא בהצלחה',
      });
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: 'שגיאה בייצוא הדוח',
        variant: 'destructive',
      });
    }
  };

  const getSourceDetails = (sourceName: string): SourceDetail => {
    const normalizedName = sourceName.toLowerCase();
    return sourceDetails[normalizedName] || sourceDetails['none'];
  };

  const pieData = sources.slice(0, 8).map((source) => ({
    name: getSourceDetails(source.source_name).name,
    value: source.visits,
    revenue: source.revenue,
  }));

  const barData = sources.slice(0, 10).map((source) => ({
    name: getSourceDetails(source.source_name).name,
    visits: source.visits,
    orders: source.orders,
    revenue: source.revenue,
    conversion_rate: source.conversion_rate,
  }));

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/reports"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <HiArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">דוח מקורות תנועה</h1>
            <p className="text-gray-500 mt-1">מאיפה הלקוחות מגיעים לחנות</p>
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
              <div className="text-sm text-gray-500">סה"כ ביקורים</div>
              <HiGlobeAlt className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {totals.total_visits.toLocaleString('he-IL')}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">הזמנות ממקורות</div>
              <HiShoppingCart className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {totals.total_orders.toLocaleString('he-IL')}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">הכנסות ממקורות</div>
              <HiCurrencyDollar className="w-6 h-6 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              ₪{totals.total_revenue.toLocaleString('he-IL')}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">שיעור המרה כללי</div>
              <HiTrendingUp className="w-6 h-6 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {totals.overall_conversion_rate.toFixed(2)}%
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">התפלגות תנועה לפי מקור</h2>
            {loading ? (
              <div className="h-80 animate-pulse bg-gray-200 rounded"></div>
            ) : pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
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
                    labelLine={true}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ direction: 'rtl', textAlign: 'right' }}
                    formatter={(value: number) => [value.toLocaleString('he-IL'), 'ביקורים']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                אין נתונים להצגה
              </div>
            )}
          </div>
        </Card>

        {/* Bar Chart */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">הכנסות לפי מקור</h2>
            {loading ? (
              <div className="h-80 animate-pulse bg-gray-200 rounded"></div>
            ) : barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={barData} layout="vertical" margin={{ right: 20, left: 60 }}>
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
                    width={120} 
                    tick={{ fontSize: 12 }}
                    tickMargin={8}
                  />
                  <Tooltip
                    contentStyle={{ direction: 'rtl', textAlign: 'right' }}
                    formatter={(value: number, name: string) => {
                      if (name === 'revenue') return [`₪${value.toLocaleString('he-IL')}`, 'הכנסות'];
                      return [value.toLocaleString('he-IL'), name];
                    }}
                  />
                  <Bar dataKey="revenue" fill="#22c55e" radius={[4, 0, 0, 4]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                אין נתונים להצגה
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">פירוט מקורות תנועה</h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 animate-pulse bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : sources.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">מקור</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">ביקורים</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">הזמנות</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">הכנסות</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">שיעור המרה</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">ערך הזמנה ממוצע</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((source, index) => {
                    const details = getSourceDetails(source.source_name);
                    return (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                              style={{ backgroundColor: details.bgColor }}
                            >
                              {details.icon}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{details.name}</div>
                              <div className="text-sm text-gray-500">{source.source_type}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-medium text-gray-900">
                            {source.visits.toLocaleString('he-IL')}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-medium text-gray-900">
                            {source.orders.toLocaleString('he-IL')}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-medium text-emerald-600">
                            ₪{source.revenue.toLocaleString('he-IL')}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-medium ${
                                source.conversion_rate >= 3
                                  ? 'text-emerald-600'
                                  : source.conversion_rate >= 1
                                  ? 'text-amber-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {source.conversion_rate.toFixed(2)}%
                            </span>
                            {source.conversion_rate >= 3 ? (
                              <HiTrendingUp className="w-4 h-4 text-emerald-500" />
                            ) : source.conversion_rate < 1 ? (
                              <HiTrendingDown className="w-4 h-4 text-red-500" />
                            ) : null}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-medium text-gray-900">
                            ₪{source.avg_order_value.toLocaleString('he-IL')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              אין נתונים להצגה בטווח התאריכים שנבחר
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

