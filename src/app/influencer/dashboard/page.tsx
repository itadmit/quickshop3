'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { HiShoppingCart, HiCurrencyDollar, HiTicket, HiStar } from 'react-icons/hi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { InfluencerStats, InfluencerCouponStats, InfluencerOrder } from '@/types/influencer';
import Link from 'next/link';

interface TopProduct {
  product_id: number;
  product_title: string;
  quantity_sold: number;
  total_revenue: number;
  image_url?: string;
}

export default function InfluencerDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<InfluencerStats | null>(null);
  const [coupons, setCoupons] = useState<InfluencerCouponStats[]>([]);
  const [chartData, setChartData] = useState<{ labels: string[]; sales: number[]; orders: number[] }>({
    labels: [],
    sales: [],
    orders: [],
  });
  const [recentOrders, setRecentOrders] = useState<InfluencerOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  useEffect(() => {
    loadDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load stats and chart data
      const statsResponse = await fetch('/api/influencers/stats?period=all', {
        credentials: 'include',
      });

      if (!statsResponse.ok) {
        if (statsResponse.status === 401) {
          router.push('/influencer/login');
          return;
        }
        throw new Error('Failed to load stats');
      }

      const statsData = await statsResponse.json();
      setStats(statsData.stats);
      setCoupons(statsData.coupons || []);
      setChartData(statsData.chart_data || { labels: [], sales: [], orders: [] });

      // Load recent orders
      const ordersResponse = await fetch('/api/influencers/orders?limit=5', {
        credentials: 'include',
      });

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setRecentOrders(ordersData.orders || []);
      }

      // Load top products
      const productsResponse = await fetch('/api/influencers/top-products?limit=10', {
        credentials: 'include',
      });

      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setTopProducts(productsData.products || []);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const chartDataFormatted = chartData.labels.map((label, index) => ({
    date: new Date(label).toLocaleDateString('he-IL', { month: 'short', day: 'numeric' }),
    sales: chartData.sales[index] || 0,
    orders: chartData.orders[index] || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">סה"כ מכירות</p>
              <h3 className="text-3xl font-bold text-gray-900">
                {loading ? '...' : `₪${(stats?.total_sales || 0).toLocaleString('he-IL')}`}
              </h3>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <HiCurrencyDollar className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">סה"כ הזמנות</p>
              <h3 className="text-3xl font-bold text-gray-900">
                {loading ? '...' : stats?.total_orders || 0}
              </h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <HiShoppingCart className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">קופונים פעילים</p>
              <h3 className="text-3xl font-bold text-gray-900">
                {loading ? '...' : stats?.active_coupons || 0}
              </h3>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <HiTicket className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">מגמות מכירות והזמנות (30 יום אחרונים)</h2>
          {loading ? (
            <div className="h-64 animate-pulse bg-gray-200 rounded"></div>
          ) : chartDataFormatted.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartDataFormatted}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'sales') {
                      return [`₪${value.toLocaleString('he-IL')}`, 'מכירות'];
                    }
                    return [value, name === 'orders' ? 'הזמנות' : name];
                  }}
                />
                <Legend
                  formatter={(value) => (value === 'sales' ? 'מכירות' : value === 'orders' ? 'הזמנות' : value)}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="orders"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="orders"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="sales"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="sales"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">אין נתונים להצגה</div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <HiStar className="w-5 h-5 text-yellow-500" />
              <h2 className="text-lg font-semibold text-gray-900">טופ 10 מוצרים נמכרים</h2>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-14 animate-pulse bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : topProducts.length > 0 ? (
              <div className="space-y-2">
                {topProducts.map((product, index) => (
                  <div
                    key={product.product_id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-green-100 text-green-700 text-xs font-bold rounded-full">
                      {index + 1}
                    </span>
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.product_title}
                        className="w-10 h-10 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{product.product_title}</p>
                      <p className="text-xs text-gray-500">{product.quantity_sold} יחידות</p>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">
                        ₪{product.total_revenue.toLocaleString('he-IL')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">אין נתונים על מוצרים</div>
            )}
          </div>
        </Card>

        {/* Active Coupons */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">קופונים פעילים</h2>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 animate-pulse bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : coupons.length > 0 ? (
              <div className="space-y-3">
                {coupons.filter(c => c.is_active).slice(0, 5).map((coupon) => (
                  <div key={coupon.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-semibold text-gray-900">{coupon.code}</span>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                        פעיל
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {coupon.usage_count} שימושים
                        {coupon.usage_limit && ` / ${coupon.usage_limit}`}
                      </span>
                      <span className="font-medium text-gray-900">
                        ₪{coupon.total_sales.toLocaleString('he-IL')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">אין קופונים פעילים</div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Orders - showing only customer name and amount */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">הזמנות אחרונות</h2>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 animate-pulse bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-2 text-sm font-medium text-gray-600">שם לקוח</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-600">סכום</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-600">תאריך</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 text-sm text-gray-900">{order.customer_name || 'לקוח'}</td>
                      <td className="py-3 text-sm font-semibold text-gray-900">₪{order.total_amount.toLocaleString('he-IL')}</td>
                      <td className="py-3 text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('he-IL')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">אין הזמנות</div>
          )}
        </div>
      </Card>
    </div>
  );
}



