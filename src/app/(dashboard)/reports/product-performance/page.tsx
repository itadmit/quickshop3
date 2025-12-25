'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HiArrowLeft, HiDownload, HiTrendingUp, HiTrendingDown } from 'react-icons/hi';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';

interface ProductPerformance {
  product_id: number;
  product_title: string;
  product_image: string | null;
  current_revenue: number;
  previous_revenue: number;
  change_percent: number;
  current_quantity: number;
  previous_quantity: number;
  orders_count: number;
  views: number;
  conversion_rate: number;
}

export default function ProductPerformancePage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductPerformance[]>([]);
  const [stats, setStats] = useState({ total_products: 0, growing: 0, declining: 0 });
  const [dateRange, setDateRange] = useState('30');
  const [sortBy, setSortBy] = useState('revenue');
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
  }, [startDate, endDate, sortBy]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/product-performance?start_date=${startDate}&end_date=${endDate}&sort_by=${sortBy}`);
      const json = await res.json();
      if (json.products) {
        setProducts(json.products);
        setStats(json.stats || { total_products: 0, growing: 0, declining: 0 });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['מוצר', 'הכנסות', 'שינוי %', 'כמות', 'הזמנות'];
    const rows = products.map(p => [p.product_title, p.current_revenue.toFixed(2), p.change_percent.toFixed(1) + '%', p.current_quantity, p.orders_count]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `product-performance-${startDate}-${endDate}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/reports" className="p-2 hover:bg-gray-100 rounded-lg"><HiArrowLeft className="w-5 h-5 text-gray-600" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ביצועי מוצרים</h1>
            <p className="text-gray-500">ניתוח מעמיק לפי מוצר</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">לפי הכנסות</SelectItem>
              <SelectItem value="quantity">לפי כמות</SelectItem>
              <SelectItem value="growth">לפי צמיחה</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
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
        <Card><div className="p-4"><div className="text-sm text-gray-500">מוצרים פעילים</div><div className="text-2xl font-bold">{stats.total_products}</div></div></Card>
        <Card>
          <div className="p-4 border-r-4 border-green-500">
            <div className="flex items-center gap-2 text-sm text-gray-500"><HiTrendingUp className="w-4 h-4 text-green-500" />מוצרים בצמיחה</div>
            <div className="text-2xl font-bold text-green-600">{stats.growing}</div>
          </div>
        </Card>
        <Card>
          <div className="p-4 border-r-4 border-red-500">
            <div className="flex items-center gap-2 text-sm text-gray-500"><HiTrendingDown className="w-4 h-4 text-red-500" />מוצרים בירידה</div>
            <div className="text-2xl font-bold text-red-600">{stats.declining}</div>
          </div>
        </Card>
      </div>

      {loading ? (
        <Card><div className="p-8 text-center text-gray-500">טוען...</div></Card>
      ) : (
        <>
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">מוצרים מובילים</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={products.slice(0, 10)} layout="vertical" margin={{ right: 20, left: 10, top: 20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="number" 
                      orientation="top"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v) => `₪${v.toLocaleString('he-IL')}`} 
                    />
                    <YAxis 
                      dataKey="product_title" 
                      type="category" 
                      width={220}
                      tick={{ fontSize: 11 }}
                      tickMargin={10}
                      interval={0}
                      angle={0}
                      dx={-5}
                    />
                    <Tooltip 
                      contentStyle={{ direction: 'rtl', textAlign: 'right' }}
                      formatter={(v: number) => `₪${v.toLocaleString('he-IL')}`} 
                    />
                    <Bar dataKey="current_revenue" fill="#10b981" name="הכנסות" radius={[4, 0, 0, 4]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">פירוט מוצרים</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-3 px-4 font-medium text-gray-600">מוצר</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">הכנסות</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">שינוי</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">כמות</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">הזמנות</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p, i) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{p.product_title}</td>
                        <td className="py-3 px-4 text-emerald-600 font-medium">₪{p.current_revenue.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <div className={`flex items-center gap-1 ${p.change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {p.change_percent >= 0 ? <HiTrendingUp className="w-4 h-4" /> : <HiTrendingDown className="w-4 h-4" />}
                            <span>{p.change_percent >= 0 ? '+' : ''}{p.change_percent.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">{p.current_quantity.toLocaleString()}</td>
                        <td className="py-3 px-4">{p.orders_count}</td>
                        <td className="py-3 px-4">
                          <Link href={`/products/edit/${p.product_id}`} className="text-blue-600 hover:underline text-sm">פרטים</Link>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-500">אין נתונים</td></tr>}
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

