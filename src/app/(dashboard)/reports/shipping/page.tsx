'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HiArrowLeft, HiDownload, HiTruck } from 'react-icons/hi';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';

interface ShippingMethod {
  method_name: string;
  orders: number;
  revenue: number;
  avg_cost: number;
  percentage: number;
}

interface DailyShipping {
  date: string;
  orders: number;
  shipping_revenue: number;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function ShippingReportPage() {
  const [loading, setLoading] = useState(true);
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [dailyData, setDailyData] = useState<DailyShipping[]>([]);
  const [stats, setStats] = useState({ total_shipping: 0, total_orders: 0, avg_shipping: 0, free_shipping_orders: 0 });
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
      const res = await fetch(`/api/reports/shipping?start_date=${startDate}&end_date=${endDate}`);
      const json = await res.json();
      if (json.methods) {
        setMethods(json.methods);
        setDailyData(json.daily_data || []);
        setStats(json.stats || { total_shipping: 0, total_orders: 0, avg_shipping: 0, free_shipping_orders: 0 });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['שיטת משלוח', 'הזמנות', 'הכנסות', 'עלות ממוצעת', 'אחוז'];
    const rows = methods.map(m => [m.method_name, m.orders, m.revenue.toFixed(2), m.avg_cost.toFixed(2), m.percentage.toFixed(1) + '%']);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `shipping-report-${startDate}-${endDate}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/reports" className="p-2 hover:bg-gray-100 rounded-lg"><HiArrowLeft className="w-5 h-5 text-gray-600" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">דוח משלוחים</h1>
            <p className="text-gray-500">עלויות והכנסות משלוח</p>
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500"><HiTruck className="w-4 h-4" />סה"כ הכנסות משלוח</div>
            <div className="text-2xl font-bold text-emerald-600">₪{stats.total_shipping.toLocaleString()}</div>
          </div>
        </Card>
        <Card><div className="p-4"><div className="text-sm text-gray-500">הזמנות עם משלוח</div><div className="text-2xl font-bold">{stats.total_orders.toLocaleString()}</div></div></Card>
        <Card><div className="p-4"><div className="text-sm text-gray-500">ממוצע עלות משלוח</div><div className="text-2xl font-bold">₪{stats.avg_shipping.toFixed(2)}</div></div></Card>
        <Card><div className="p-4"><div className="text-sm text-gray-500">הזמנות משלוח חינם</div><div className="text-2xl font-bold text-blue-600">{stats.free_shipping_orders}</div></div></Card>
      </div>

      {loading ? (
        <Card><div className="p-8 text-center text-gray-500">טוען...</div></Card>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">התפלגות שיטות משלוח</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={methods} dataKey="orders" nameKey="method_name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                        {methods.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">הכנסות משלוח לאורך זמן</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={(v) => `₪${v}`} />
                      <Tooltip formatter={(v: number) => `₪${v.toLocaleString()}`} />
                      <Line type="monotone" dataKey="shipping_revenue" stroke="#10b981" strokeWidth={2} name="הכנסות משלוח" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">פירוט שיטות משלוח</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-3 px-4 font-medium text-gray-600">שיטת משלוח</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">הזמנות</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">הכנסות</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">ממוצע</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">אחוז</th>
                    </tr>
                  </thead>
                  <tbody>
                    {methods.map((m, i) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4"><div className="flex items-center gap-2"><HiTruck className="w-4 h-4 text-gray-400" /><span className="font-medium">{m.method_name}</span></div></td>
                        <td className="py-3 px-4">{m.orders.toLocaleString()}</td>
                        <td className="py-3 px-4 text-emerald-600 font-medium">₪{m.revenue.toLocaleString()}</td>
                        <td className="py-3 px-4">₪{m.avg_cost.toFixed(2)}</td>
                        <td className="py-3 px-4">{m.percentage.toFixed(1)}%</td>
                      </tr>
                    ))}
                    {methods.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-500">אין נתונים</td></tr>}
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

