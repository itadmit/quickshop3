'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HiArrowLeft, HiDownload, HiDocumentText } from 'react-icons/hi';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';

interface PageData {
  page_path: string;
  page_title: string;
  page_views: number;
  unique_visitors: number;
  avg_time_on_page: number;
  bounce_rate: number;
}

export default function TopPagesPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PageData[]>([]);
  const [totals, setTotals] = useState({ total_views: 0, total_visitors: 0 });
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
    if (startDate && endDate) fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/top-pages?start_date=${startDate}&end_date=${endDate}`);
      const json = await res.json();
      if (json.pages) {
        setData(json.pages);
        setTotals(json.totals || { total_views: 0, total_visitors: 0 });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPageType = (path: string) => {
    if (path === '/' || path === '') return 'דף הבית';
    if (path.includes('/products/') || path.includes('/p/')) return 'דף מוצר';
    if (path.includes('/collections/') || path.includes('/categories/')) return 'דף קטגוריה';
    if (path.includes('/cart')) return 'עגלה';
    if (path.includes('/checkout')) return 'צ\'קאאוט';
    if (path.includes('/account')) return 'חשבון';
    if (path.includes('/blog')) return 'בלוג';
    return 'אחר';
  };

  const exportCSV = () => {
    const headers = ['דף', 'צפיות', 'מבקרים', 'סוג'];
    const rows = data.map(p => [p.page_path, p.page_views, p.unique_visitors, getPageType(p.page_path)]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `top-pages-${startDate}-${endDate}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/reports" className="p-2 hover:bg-gray-100 rounded-lg"><HiArrowLeft className="w-5 h-5 text-gray-600" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">דפים פופולריים</h1>
            <p className="text-gray-500">הדפים הנצפים ביותר באתר</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 ימים</SelectItem>
              <SelectItem value="30">30 ימים</SelectItem>
              <SelectItem value="90">90 ימים</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCSV}><HiDownload className="w-4 h-4 ml-2" />ייצוא</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><div className="p-4"><div className="text-sm text-gray-500">סה"כ צפיות</div><div className="text-2xl font-bold">{totals.total_views.toLocaleString()}</div></div></Card>
        <Card><div className="p-4"><div className="text-sm text-gray-500">מבקרים ייחודיים</div><div className="text-2xl font-bold">{totals.total_visitors.toLocaleString()}</div></div></Card>
        <Card><div className="p-4"><div className="text-sm text-gray-500">דפים ייחודיים</div><div className="text-2xl font-bold">{data.length}</div></div></Card>
      </div>

      {loading ? (
        <Card><div className="p-8 text-center text-gray-500">טוען...</div></Card>
      ) : (
        <>
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">דפים מובילים לפי צפיות</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="page_path" type="category" width={200} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="page_views" fill="#10b981" name="צפיות" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">פירוט דפים</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-3 px-4 font-medium text-gray-600">דף</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">סוג</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">צפיות</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">מבקרים</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">% מסה"כ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((p, i) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <HiDocumentText className="w-4 h-4 text-gray-400" />
                            <span className="font-medium truncate max-w-xs">{p.page_path || '/'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4"><span className="px-2 py-1 bg-gray-100 rounded text-sm">{getPageType(p.page_path)}</span></td>
                        <td className="py-3 px-4 font-medium">{p.page_views.toLocaleString()}</td>
                        <td className="py-3 px-4">{p.unique_visitors.toLocaleString()}</td>
                        <td className="py-3 px-4">{totals.total_views > 0 ? ((p.page_views / totals.total_views) * 100).toFixed(1) : 0}%</td>
                      </tr>
                    ))}
                    {data.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-500">אין נתונים</td></tr>}
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

