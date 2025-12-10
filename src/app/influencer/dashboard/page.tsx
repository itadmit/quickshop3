'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { HiTrendingUp, HiShoppingCart, HiCurrencyDollar, HiTicket } from 'react-icons/hi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { InfluencerStats, InfluencerCouponStats, InfluencerOrder } from '@/types/influencer';
import Link from 'next/link';

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <p className="text-sm text-gray-600 mb-1">ממוצע הזמנה</p>
              <h3 className="text-3xl font-bold text-gray-900">
                {loading ? '...' : `₪${(stats?.average_order_value || 0).toLocaleString('he-IL')}`}
              </h3>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <HiTrendingUp className="w-8 h-8 text-purple-600" />
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
        {/* Recent Orders */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">הזמנות אחרונות</h2>
              <Link
                href="/influencer/orders"
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                צפייה בכל ההזמנות →
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">#{order.order_number}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">
                        ₪{order.total_amount.toLocaleString('he-IL')}
                      </p>
                      <p className="text-xs text-gray-500">{order.coupon_code}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">אין הזמנות</div>
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
    </div>
  );
}

