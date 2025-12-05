'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { HiTrendingUp, HiShoppingCart, HiUsers, HiCurrencyDollar, HiGlobeAlt } from 'react-icons/hi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface SalesData {
  date: string;
  orders: number;
  revenue: string;
  average_order_value: string;
}

interface TopProduct {
  product_id: number;
  product_title: string;
  total_quantity: number;
  total_revenue: string;
  order_count: number;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [totals, setTotals] = useState({
    total_orders: 0,
    total_revenue: '0',
    average_order_value: '0',
  });
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [trafficData, setTrafficData] = useState<{
    date: string;
    visits: number;
    unique_visitors: number;
  }[]>([]);
  const [trafficTotals, setTrafficTotals] = useState({
    total_visits: 0,
    total_unique_visitors: 0,
  });
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    loadAnalytics(signal);

    return () => {
      abortController.abort();
    };
  }, [dateRange]);

  const loadAnalytics = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('start_date', dateRange.start_date);
      params.append('end_date', dateRange.end_date);

      // Load all in parallel
      const [salesResponse, productsResponse, visitsResponse] = await Promise.all([
        fetch(`/api/analytics/sales?${params.toString()}`, {
          credentials: 'include',
          signal,
        }),
        fetch(`/api/analytics/top-products?${params.toString()}&limit=10`, {
          credentials: 'include',
          signal,
        }),
        fetch(`/api/analytics/visits?${params.toString()}`, {
          credentials: 'include',
          signal,
        }),
      ]);

      if (signal?.aborted) return;

      if (salesResponse.ok) {
        const salesResult = await salesResponse.json();
        setSalesData(salesResult.sales || []);
        setTotals(salesResult.totals || totals);
      }

      if (productsResponse.ok) {
        const productsResult = await productsResponse.json();
        setTopProducts(productsResult.products || []);
      }

      if (visitsResponse.ok) {
        const visitsResult = await visitsResponse.json();
        setTrafficData(visitsResult.visits || []);
        setTrafficTotals(visitsResult.totals || trafficTotals);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error loading analytics:', error);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">אנליטיקס</h1>
          <p className="text-gray-500 mt-1">ניתוח מכירות ותנועה</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/analytics/realtime"
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <HiGlobeAlt className="w-5 h-5" />
            <span>אנליטיקה בזמן אמת</span>
          </Link>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.start_date}
              onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <span className="text-gray-500">עד</span>
            <input
              type="date"
              value={dateRange.end_date}
              onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">סה"כ הזמנות</div>
              <HiShoppingCart className="w-6 h-6 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{totals.total_orders}</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">סה"כ הכנסות</div>
              <HiCurrencyDollar className="w-6 h-6 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              ₪{parseFloat(totals.total_revenue).toLocaleString('he-IL')}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">ערך הזמנה ממוצע</div>
              <HiTrendingUp className="w-6 h-6 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              ₪{parseFloat(totals.average_order_value).toLocaleString('he-IL')}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">מוצרים מובילים</div>
              <HiUsers className="w-6 h-6 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{topProducts.length}</div>
          </div>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">גרף הכנסות</h2>
          {loading ? (
            <div className="h-64 animate-pulse bg-gray-200 rounded"></div>
          ) : salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData.map(item => ({
                date: new Date(item.date).toLocaleDateString('he-IL', { month: 'short', day: 'numeric' }),
                revenue: parseFloat(item.revenue),
                orders: item.orders,
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'revenue') {
                      return [`₪${value.toLocaleString('he-IL')}`, 'הכנסות'];
                    }
                    return [value, name === 'orders' ? 'הזמנות' : name];
                  }}
                />
                <Legend 
                  formatter={(value) => value === 'revenue' ? 'הכנסות' : value === 'orders' ? 'הזמנות' : value}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">
              אין נתונים להצגה
            </div>
          )}
        </div>
      </Card>

      {/* Order Trends Chart */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">מגמות הזמנות</h2>
          {loading ? (
            <div className="h-64 animate-pulse bg-gray-200 rounded"></div>
          ) : salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData.map(item => ({
                date: new Date(item.date).toLocaleDateString('he-IL', { month: 'short', day: 'numeric' }),
                orders: item.orders,
                average_order_value: parseFloat(item.average_order_value),
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'average_order_value') {
                      return [`₪${value.toLocaleString('he-IL')}`, 'ערך ממוצע'];
                    }
                    return [value, name === 'orders' ? 'הזמנות' : name];
                  }}
                />
                <Legend 
                  formatter={(value) => value === 'orders' ? 'מספר הזמנות' : value === 'average_order_value' ? 'ערך ממוצע' : value}
                />
                <Bar yAxisId="left" dataKey="orders" fill="#3b82f6" name="orders" />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="average_order_value" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  name="average_order_value"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">
              אין נתונים להצגה
            </div>
          )}
        </div>
      </Card>

      {/* Traffic Analytics Chart */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">אנליטיקס תנועה</h2>
          {loading ? (
            <div className="h-64 animate-pulse bg-gray-200 rounded"></div>
          ) : trafficData.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">סה"כ ביקורים</div>
                  <div className="text-2xl font-bold text-gray-900">{trafficTotals.total_visits}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">מבקרים ייחודיים</div>
                  <div className="text-2xl font-bold text-gray-900">{trafficTotals.total_unique_visitors}</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trafficData.map(item => ({
                  date: new Date(item.date).toLocaleDateString('he-IL', { month: 'short', day: 'numeric' }),
                  visits: item.visits,
                  unique_visitors: item.unique_visitors,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend 
                    formatter={(value) => value === 'visits' ? 'ביקורים' : value === 'unique_visitors' ? 'מבקרים ייחודיים' : value}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="visits" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="visits"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="unique_visitors" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="unique_visitors"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              אין נתוני להצגה
            </div>
          )}
        </div>
      </Card>

      {/* Top Products */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">מוצרים מובילים</h2>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : topProducts.length > 0 ? (
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.product_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center font-bold text-gray-600">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{product.product_title}</div>
                      <div className="text-sm text-gray-500">
                        {product.order_count} הזמנות • {product.total_quantity} יחידות
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      ₪{parseFloat(product.total_revenue).toLocaleString('he-IL')}
                    </div>
                    <div className="text-sm text-gray-500">סה"כ הכנסות</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              אין נתונים להצגה
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

