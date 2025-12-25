'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HiArrowLeft, HiDownload, HiCollection } from 'react-icons/hi';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';

interface CategorySales {
  category_id: number;
  category_name: string;
  category_handle: string;
  products_count: number;
  quantity_sold: number;
  orders_count: number;
  revenue: number;
  avg_order_value: number;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function SalesByCategoryPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CategorySales[]>([]);
  const [totals, setTotals] = useState({ total_revenue: 0, total_orders: 0, total_quantity: 0 });
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
      const res = await fetch(`/api/reports/sales-by-category?start_date=${startDate}&end_date=${endDate}`);
      const json = await res.json();
      if (json.categories) {
        setData(json.categories);
        setTotals(json.totals || { total_revenue: 0, total_orders: 0, total_quantity: 0 });
      }
    } catch (error) {
      console.error('Error fetching sales by category:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['קטגוריה', 'מוצרים', 'כמות נמכרה', 'הזמנות', 'הכנסות', 'ממוצע הזמנה'];
    const rows = data.map(r => [r.category_name, r.products_count, r.quantity_sold, r.orders_count, r.revenue.toFixed(2), r.avg_order_value.toFixed(2)]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-by-category-${startDate}-${endDate}.csv`;
    a.click();
  };

  const pieData = data.slice(0, 8).map(c => ({ name: c.category_name, value: c.revenue }));

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/reports" className="p-2 hover:bg-gray-100 rounded-lg"><HiArrowLeft className="w-5 h-5 text-gray-600" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">מכירות לפי קטגוריה</h1>
            <p className="text-gray-500">ביצועי קולקציות וקטגוריות</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><div className="p-4"><div className="text-sm text-gray-500">סה"כ הכנסות</div><div className="text-2xl font-bold text-emerald-600">₪{totals.total_revenue.toLocaleString()}</div></div></Card>
        <Card><div className="p-4"><div className="text-sm text-gray-500">סה"כ הזמנות</div><div className="text-2xl font-bold">{totals.total_orders.toLocaleString()}</div></div></Card>
        <Card><div className="p-4"><div className="text-sm text-gray-500">קטגוריות פעילות</div><div className="text-2xl font-bold">{data.length}</div></div></Card>
      </div>

      {loading ? (
        <Card><div className="p-8 text-center text-gray-500">טוען...</div></Card>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">התפלגות הכנסות</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ direction: 'rtl', textAlign: 'right' }}
                        formatter={(v: number) => `₪${v.toLocaleString('he-IL')}`} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">הכנסות לפי קטגוריה</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.slice(0, 10)} layout="vertical" margin={{ right: 20, left: 10, top: 20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        type="number" 
                        orientation="top"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) => `₪${v.toLocaleString('he-IL')}`} 
                      />
                      <YAxis 
                        dataKey="category_name" 
                        type="category" 
                        width={180}
                        tick={{ fontSize: 12 }}
                        tickMargin={10}
                        interval={0}
                        angle={0}
                        dx={-5}
                      />
                      <Tooltip 
                        contentStyle={{ direction: 'rtl', textAlign: 'right' }}
                        formatter={(v: number) => `₪${v.toLocaleString('he-IL')}`} 
                      />
                      <Bar dataKey="revenue" fill="#10b981" radius={[4, 0, 0, 4]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">פירוט קטגוריות</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-3 px-4 font-medium text-gray-600">קטגוריה</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">מוצרים</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">כמות נמכרה</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">הזמנות</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">הכנסות</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">% מסה"כ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, i) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4"><div className="flex items-center gap-2"><HiCollection className="w-4 h-4 text-gray-400" /><span className="font-medium">{row.category_name}</span></div></td>
                        <td className="py-3 px-4">{row.products_count}</td>
                        <td className="py-3 px-4">{row.quantity_sold.toLocaleString()}</td>
                        <td className="py-3 px-4">{row.orders_count.toLocaleString()}</td>
                        <td className="py-3 px-4 text-emerald-600 font-medium">₪{row.revenue.toLocaleString()}</td>
                        <td className="py-3 px-4">{totals.total_revenue > 0 ? ((row.revenue / totals.total_revenue) * 100).toFixed(1) : 0}%</td>
                      </tr>
                    ))}
                    {data.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-500">אין נתונים</td></tr>}
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

