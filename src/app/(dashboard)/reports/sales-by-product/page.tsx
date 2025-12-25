'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  HiArrowLeft,
  HiDownload,
  HiCube,
  HiTrendingUp,
  HiTrendingDown,
  HiShoppingCart,
  HiCurrencyDollar,
  HiPhotograph,
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
} from 'recharts';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { DateRangePicker, getDefaultDateRange, dateRangeToParams } from '@/components/ui/DateRangePicker';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface ProductSales {
  product_id: number;
  product_title: string;
  product_image: string | null;
  variant_count: number;
  quantity_sold: number;
  orders_count: number;
  revenue: number;
  avg_price: number;
  refunds: number;
  net_revenue: number;
  views: number;
  conversion_rate: number;
}

interface SalesByDay {
  date: string;
  quantity: number;
  revenue: number;
}

export default function SalesByProductPage() {
  const { toast } = useOptimisticToast();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductSales[]>([]);
  const [dailyData, setDailyData] = useState<SalesByDay[]>([]);
  const [totals, setTotals] = useState({
    total_products: 0,
    total_quantity: 0,
    total_orders: 0,
    total_revenue: 0,
    avg_order_value: 0,
  });
  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const [sortBy, setSortBy] = useState<'revenue' | 'quantity' | 'orders'>('revenue');

  useEffect(() => {
    loadData();
  }, [dateRange, sortBy]);

  const loadData = async () => {
    try {
      setLoading(true);
      const { start_date, end_date } = dateRangeToParams(dateRange);
      const params = new URLSearchParams();
      params.append('start_date', start_date);
      params.append('end_date', end_date);
      params.append('sort_by', sortBy);

      const response = await fetch(`/api/reports/sales-by-product?${params.toString()}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        setDailyData(data.daily_sales || []);
        setTotals(data.totals || totals);
      }
    } catch (error: any) {
      console.error('Error loading sales by product:', error);
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

      const response = await fetch(`/api/reports/sales-by-product/export?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to export');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-by-product-${start_date}-${end_date}.csv`;
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

  const topProductsChart = products.slice(0, 10).map((p) => ({
    name: p.product_title.length > 20 ? p.product_title.substring(0, 20) + '...' : p.product_title,
    revenue: p.revenue,
    quantity: p.quantity_sold,
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
            <h1 className="text-2xl font-bold text-gray-900">מכירות לפי מוצר</h1>
            <p className="text-gray-500 mt-1">ביצועי מוצרים וניתוח מכירות</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">לפי הכנסות</SelectItem>
              <SelectItem value="quantity">לפי כמות</SelectItem>
              <SelectItem value="orders">לפי הזמנות</SelectItem>
            </SelectContent>
          </Select>
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">מוצרים נמכרו</div>
              <HiCube className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{totals.total_products}</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">יחידות נמכרו</div>
              <HiShoppingCart className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{totals.total_quantity.toLocaleString('he-IL')}</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">הזמנות</div>
              <HiShoppingCart className="w-6 h-6 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{totals.total_orders.toLocaleString('he-IL')}</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">סה"כ הכנסות</div>
              <HiCurrencyDollar className="w-6 h-6 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">₪{totals.total_revenue.toLocaleString('he-IL')}</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">ערך הזמנה ממוצע</div>
              <HiTrendingUp className="w-6 h-6 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">₪{totals.avg_order_value.toFixed(0)}</div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Chart */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">10 מוצרים מובילים</h2>
            {loading ? (
              <div className="h-80 animate-pulse bg-gray-200 rounded"></div>
            ) : topProductsChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={topProductsChart} layout="vertical" margin={{ right: 20, left: 10, top: 20, bottom: 10 }}>
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
                    width={200}
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                    interval={0}
                    angle={0}
                    dx={-5}
                  />
                  <Tooltip
                    contentStyle={{ direction: 'rtl', textAlign: 'right' }}
                    formatter={(value: number, name: string) => {
                      if (name === 'revenue') return [`₪${value.toLocaleString('he-IL')}`, 'הכנסות'];
                      if (name === 'quantity') return [value.toLocaleString('he-IL'), 'יחידות'];
                      return [value, name];
                    }}
                  />
                  <Legend wrapperStyle={{ direction: 'rtl' }} />
                  <Bar dataKey="revenue" fill="#22c55e" name="הכנסות" radius={[4, 0, 0, 4]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">אין נתונים</div>
            )}
          </div>
        </Card>

        {/* Daily Sales Trend */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">מגמת מכירות יומית</h2>
            {loading ? (
              <div className="h-80 animate-pulse bg-gray-200 rounded"></div>
            ) : dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={dailyData.map((d) => ({
                  date: new Date(d.date).toLocaleDateString('he-IL', { month: 'short', day: 'numeric' }),
                  revenue: d.revenue,
                  quantity: d.quantity,
                }))} margin={{ right: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    yAxisId="left" 
                    orientation="right"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `₪${value.toLocaleString('he-IL')}`}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="left"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ direction: 'rtl', textAlign: 'right' }}
                    formatter={(value: number, name: string) => {
                      if (name === 'revenue') return [`₪${value.toLocaleString('he-IL')}`, 'הכנסות'];
                      if (name === 'quantity') return [value.toLocaleString('he-IL'), 'יחידות'];
                      return [value, name];
                    }}
                  />
                  <Legend wrapperStyle={{ direction: 'rtl' }} />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} name="הכנסות (₪)" />
                  <Line yAxisId="right" type="monotone" dataKey="quantity" stroke="#3b82f6" strokeWidth={2} name="יחידות" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">אין נתונים</div>
            )}
          </div>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">פירוט מוצרים</h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 animate-pulse bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">מוצר</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">יחידות</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">הזמנות</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">הכנסות</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">מחיר ממוצע</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">החזרים</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">הכנסות נטו</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr key={product.product_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                            {product.product_image ? (
                              <img
                                src={product.product_image}
                                alt={product.product_title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <HiPhotograph className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{product.product_title}</div>
                            <div className="text-sm text-gray-500">{product.variant_count} וריאנטים</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-medium text-gray-900">{product.quantity_sold.toLocaleString('he-IL')}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-medium text-gray-900">{product.orders_count.toLocaleString('he-IL')}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-medium text-emerald-600">₪{product.revenue.toLocaleString('he-IL')}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-medium text-gray-900">₪{product.avg_price.toFixed(0)}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`font-medium ${product.refunds > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                          ₪{product.refunds.toLocaleString('he-IL')}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-gray-900">₪{product.net_revenue.toLocaleString('he-IL')}</span>
                      </td>
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

