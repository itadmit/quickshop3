'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  HiArrowLeft,
  HiDownload,
  HiExternalLink,
  HiGlobeAlt,
} from 'react-icons/hi';
import Link from 'next/link';
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
} from 'recharts';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';

interface ReferrerData {
  referrer: string;
  referrer_domain: string;
  sessions: number;
  unique_visitors: number;
  orders: number;
  revenue: number;
  conversion_rate: number;
  bounce_rate: number;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function ReferrersReportPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReferrerData[]>([]);
  const [totals, setTotals] = useState({ total_sessions: 0, total_orders: 0, total_revenue: 0 });
  const [dateRange, setDateRange] = useState('30');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - parseInt(dateRange));
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, [dateRange]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchData();
    }
  }, [startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/referrers?start_date=${startDate}&end_date=${endDate}`);
      const json = await res.json();
      if (json.referrers) {
        setData(json.referrers);
        setTotals(json.totals || { total_sessions: 0, total_orders: 0, total_revenue: 0 });
      }
    } catch (error) {
      console.error('Error fetching referrers:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['אתר מפנה', 'דומיין', 'סשנים', 'מבקרים ייחודיים', 'הזמנות', 'הכנסות', 'שיעור המרה'];
    const rows = data.map(r => [
      r.referrer,
      r.referrer_domain,
      r.sessions,
      r.unique_visitors,
      r.orders,
      r.revenue.toFixed(2),
      r.conversion_rate.toFixed(2) + '%'
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `referrers-report-${startDate}-${endDate}.csv`;
    a.click();
  };

  const pieData = data.slice(0, 8).map(r => ({
    name: r.referrer_domain || r.referrer || 'ישיר',
    value: r.sessions,
  }));

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/reports" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <HiArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">אתרים מפנים</h1>
            <p className="text-gray-500">מאילו אתרים הגיעו המבקרים לחנות</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 ימים אחרונים</SelectItem>
              <SelectItem value="30">30 ימים אחרונים</SelectItem>
              <SelectItem value="90">90 ימים אחרונים</SelectItem>
              <SelectItem value="365">שנה אחרונה</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCSV}>
            <HiDownload className="w-4 h-4 ml-2" />
            ייצוא CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="text-sm text-gray-500">סה"כ סשנים</div>
            <div className="text-2xl font-bold text-gray-900">{totals.total_sessions.toLocaleString()}</div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-sm text-gray-500">אתרים מפנים</div>
            <div className="text-2xl font-bold text-gray-900">{data.length}</div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-sm text-gray-500">סה"כ הזמנות</div>
            <div className="text-2xl font-bold text-gray-900">{totals.total_orders.toLocaleString()}</div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-sm text-gray-500">סה"כ הכנסות</div>
            <div className="text-2xl font-bold text-emerald-600">₪{totals.total_revenue.toLocaleString()}</div>
          </div>
        </Card>
      </div>

      {loading ? (
        <Card>
          <div className="p-8 text-center text-gray-500">טוען נתונים...</div>
        </Card>
      ) : (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">התפלגות לפי מקור</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => value.toLocaleString()} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">סשנים לפי מקור</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="referrer_domain" type="category" width={120} />
                      <Tooltip formatter={(value: number) => value.toLocaleString()} />
                      <Bar dataKey="sessions" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">פירוט אתרים מפנים</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-3 px-4 font-medium text-gray-600">אתר מפנה</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">סשנים</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">מבקרים</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">הזמנות</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">הכנסות</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">שיעור המרה</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <HiGlobeAlt className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{row.referrer_domain || row.referrer || 'כניסה ישירה'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">{row.sessions.toLocaleString()}</td>
                        <td className="py-3 px-4">{row.unique_visitors.toLocaleString()}</td>
                        <td className="py-3 px-4">{row.orders}</td>
                        <td className="py-3 px-4 text-emerald-600 font-medium">₪{row.revenue.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-sm ${row.conversion_rate > 3 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                            {row.conversion_rate.toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {row.referrer && row.referrer !== 'direct' && (
                            <a href={row.referrer.startsWith('http') ? row.referrer : `https://${row.referrer}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                              <HiExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                    {data.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-500">
                          אין נתונים להצגה
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

