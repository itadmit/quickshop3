'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  HiArrowLeft,
  HiDownload,
  HiCreditCard,
  HiCurrencyDollar,
  HiCheckCircle,
  HiXCircle,
  HiClock,
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

interface GiftCardData {
  code: string;
  initial_value: number;
  current_value: number;
  status: string;
  created_at: Date;
  expires_at: Date | null;
  usage_count: number;
}

interface DailyData {
  date: string;
  count: number;
  total_value: number;
  total_amount?: number;
}

export default function GiftCardsReportPage() {
  const { toast } = useOptimisticToast();
  const [loading, setLoading] = useState(true);
  const [created, setCreated] = useState<DailyData[]>([]);
  const [used, setUsed] = useState<DailyData[]>([]);
  const [giftCards, setGiftCards] = useState<GiftCardData[]>([]);
  const [totals, setTotals] = useState({
    total_created: 0,
    total_value_created: 0,
    total_active: 0,
    total_used: 0,
    total_amount_used: 0,
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

      const response = await fetch(`/api/reports/gift-cards?${params.toString()}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setCreated(data.created || []);
        setUsed(data.used || []);
        setGiftCards(data.gift_cards || []);
        setTotals(data.totals || totals);
      }
    } catch (error: any) {
      console.error('Error loading gift cards report:', error);
      toast({ title: 'שגיאה', description: 'לא ניתן לטעון נתונים', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'פעיל':
        return 'text-emerald-600 bg-emerald-50';
      case 'מוצה':
        return 'text-gray-600 bg-gray-50';
      case 'פג תוקף':
        return 'text-red-600 bg-red-50';
      case 'לא פעיל':
        return 'text-amber-600 bg-amber-50';
      default:
        return 'text-gray-600 bg-gray-50';
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
            <h1 className="text-2xl font-bold text-gray-900">דוח גיפט קארדים</h1>
            <p className="text-gray-500 mt-1">ניתוח שימוש בגיפט קארדים</p>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">גיפט קארדים שנוצרו</div>
              <HiCreditCard className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{totals.total_created}</div>
            <div className="text-sm text-gray-500 mt-1">סה"כ ערך: ₪{totals.total_value_created.toLocaleString('he-IL')}</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">גיפט קארדים פעילים</div>
              <HiCheckCircle className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{totals.total_active}</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">גיפט קארדים ששומשו</div>
              <HiCurrencyDollar className="w-6 h-6 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{totals.total_used}</div>
            <div className="text-sm text-gray-500 mt-1">סה"כ שימוש: ₪{totals.total_amount_used.toLocaleString('he-IL')}</div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Created vs Used */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">גיפט קארדים שנוצרו ושומשו</h2>
            {loading ? (
              <div className="h-80 animate-pulse bg-gray-200 rounded"></div>
            ) : created.length > 0 || used.length > 0 ? (
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
                  />
                  <Tooltip 
                    contentStyle={{ direction: 'rtl', textAlign: 'right' }}
                    formatter={(value: number, name: string) => {
                      if (name === 'created') return [value, 'נוצרו'];
                      if (name === 'used') return [value, 'שומשו'];
                      return [value, name];
                    }}
                  />
                  <Legend wrapperStyle={{ direction: 'rtl' }} />
                  <Line type="monotone" dataKey="count" data={created} stroke="#3b82f6" strokeWidth={2} name="נוצרו" />
                  <Line type="monotone" dataKey="count" data={used} stroke="#22c55e" strokeWidth={2} name="שומשו" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">אין נתונים</div>
            )}
          </div>
        </Card>

        {/* Value Chart */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ערך גיפט קארדים</h2>
            {loading ? (
              <div className="h-80 animate-pulse bg-gray-200 rounded"></div>
            ) : created.length > 0 || used.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart margin={{ right: 20, left: 20 }}>
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
                      if (name === 'total_value') return [`₪${value.toLocaleString('he-IL')}`, 'ערך שנוצר'];
                      if (name === 'total_amount') return [`₪${value.toLocaleString('he-IL')}`, 'ערך ששומש'];
                      return [`₪${value.toLocaleString('he-IL')}`, name];
                    }}
                  />
                  <Legend wrapperStyle={{ direction: 'rtl' }} />
                  <Bar dataKey="total_value" data={created} fill="#3b82f6" name="ערך שנוצר" />
                  <Bar dataKey="total_amount" data={used} fill="#22c55e" name="ערך ששומש" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">אין נתונים</div>
            )}
          </div>
        </Card>
      </div>

      {/* Gift Cards Table */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">פירוט גיפט קארדים</h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 animate-pulse bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : giftCards.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">קוד</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">ערך התחלתי</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">יתרה נוכחית</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">סטטוס</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">תאריך יצירה</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">תאריך תפוגה</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">שימושים</th>
                  </tr>
                </thead>
                <tbody>
                  {giftCards.map((gc, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <span className="font-mono font-medium text-gray-900">{gc.code}</span>
                      </td>
                      <td className="py-4 px-4 text-gray-900">₪{gc.initial_value.toLocaleString('he-IL')}</td>
                      <td className="py-4 px-4 text-gray-900">₪{gc.current_value.toLocaleString('he-IL')}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(gc.status)}`}>
                          {gc.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-500 text-sm">
                        {new Date(gc.created_at).toLocaleDateString('he-IL')}
                      </td>
                      <td className="py-4 px-4 text-gray-500 text-sm">
                        {gc.expires_at ? new Date(gc.expires_at).toLocaleDateString('he-IL') : 'ללא תאריך תפוגה'}
                      </td>
                      <td className="py-4 px-4 text-gray-900">{gc.usage_count}</td>
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


