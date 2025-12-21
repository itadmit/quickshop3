'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HiArrowLeft, HiDownload, HiDocumentText } from 'react-icons/hi';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';

interface TaxData {
  date: string;
  orders: number;
  subtotal: number;
  tax_amount: number;
  total: number;
}

interface TaxByRate {
  tax_rate: number;
  orders: number;
  taxable_amount: number;
  tax_collected: number;
}

export default function TaxesReportPage() {
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState<TaxData[]>([]);
  const [taxByRate, setTaxByRate] = useState<TaxByRate[]>([]);
  const [stats, setStats] = useState({ total_tax: 0, total_orders: 0, avg_tax_per_order: 0, effective_tax_rate: 0 });
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
      const res = await fetch(`/api/reports/taxes?start_date=${startDate}&end_date=${endDate}`);
      const json = await res.json();
      if (json.daily_data) {
        setDailyData(json.daily_data);
        setTaxByRate(json.tax_by_rate || []);
        setStats(json.stats || { total_tax: 0, total_orders: 0, avg_tax_per_order: 0, effective_tax_rate: 0 });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['תאריך', 'הזמנות', 'סכום לפני מע"מ', 'מע"מ', 'סה"כ'];
    const rows = dailyData.map(d => [d.date, d.orders, d.subtotal.toFixed(2), d.tax_amount.toFixed(2), d.total.toFixed(2)]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `taxes-report-${startDate}-${endDate}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/reports" className="p-2 hover:bg-gray-100 rounded-lg"><HiArrowLeft className="w-5 h-5 text-gray-600" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">דוח מיסים</h1>
            <p className="text-gray-500">דוח מע"מ ומיסים שנגבו</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 ימים</SelectItem>
              <SelectItem value="30">30 ימים</SelectItem>
              <SelectItem value="90">90 ימים</SelectItem>
              <SelectItem value="365">שנה</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCSV}><HiDownload className="w-4 h-4 ml-2" />ייצוא</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4 border-r-4 border-emerald-500">
            <div className="flex items-center gap-2 text-sm text-gray-500"><HiDocumentText className="w-4 h-4" />סה"כ מע"מ שנגבה</div>
            <div className="text-2xl font-bold text-emerald-600">₪{stats.total_tax.toLocaleString()}</div>
          </div>
        </Card>
        <Card><div className="p-4"><div className="text-sm text-gray-500">הזמנות</div><div className="text-2xl font-bold">{stats.total_orders.toLocaleString()}</div></div></Card>
        <Card><div className="p-4"><div className="text-sm text-gray-500">מע"מ ממוצע להזמנה</div><div className="text-2xl font-bold">₪{stats.avg_tax_per_order.toFixed(2)}</div></div></Card>
        <Card><div className="p-4"><div className="text-sm text-gray-500">שיעור מע"מ אפקטיבי</div><div className="text-2xl font-bold">{stats.effective_tax_rate.toFixed(1)}%</div></div></Card>
      </div>

      {loading ? (
        <Card><div className="p-8 text-center text-gray-500">טוען...</div></Card>
      ) : (
        <>
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">מע"מ לאורך זמן</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(v) => `₪${v}`} />
                    <Tooltip formatter={(v: number) => `₪${v.toLocaleString()}`} />
                    <Line type="monotone" dataKey="tax_amount" stroke="#10b981" strokeWidth={2} name="מעמ" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">פירוט יומי</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-3 px-4 font-medium text-gray-600">תאריך</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">הזמנות</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">סכום לפני מע"מ</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">מע"מ</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">סה"כ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyData.map((d, i) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{new Date(d.date).toLocaleDateString('he-IL')}</td>
                        <td className="py-3 px-4">{d.orders}</td>
                        <td className="py-3 px-4">₪{d.subtotal.toLocaleString()}</td>
                        <td className="py-3 px-4 text-emerald-600 font-medium">₪{d.tax_amount.toLocaleString()}</td>
                        <td className="py-3 px-4 font-medium">₪{d.total.toLocaleString()}</td>
                      </tr>
                    ))}
                    {dailyData.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-500">אין נתונים</td></tr>}
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

