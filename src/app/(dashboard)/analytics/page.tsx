'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HiTrendingUp, HiShoppingCart, HiUsers, HiCurrencyDollar, HiGlobeAlt, HiDownload, HiChartBar } from 'react-icons/hi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

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
  const { toast } = useOptimisticToast();
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
  const [conversionData, setConversionData] = useState<any>(null);
  const [customerAnalytics, setCustomerAnalytics] = useState<any>(null);
  const [productPerformance, setProductPerformance] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'products' | 'conversion'>('overview');

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
      const [salesResponse, productsResponse, visitsResponse, conversionResponse, customersResponse, productsPerfResponse] = await Promise.all([
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
        fetch(`/api/analytics/conversion?${params.toString()}`, {
          credentials: 'include',
          signal,
        }),
        fetch(`/api/analytics/customers?${params.toString()}`, {
          credentials: 'include',
          signal,
        }),
        fetch(`/api/analytics/products?${params.toString()}&limit=20`, {
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

      if (conversionResponse.ok) {
        const conversionResult = await conversionResponse.json();
        setConversionData(conversionResult);
      }

      if (customersResponse.ok) {
        const customersResult = await customersResponse.json();
        setCustomerAnalytics(customersResult);
      }

      if (productsPerfResponse.ok) {
        const productsPerfResult = await productsPerfResponse.json();
        setProductPerformance(productsPerfResult.products || []);
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

  const handleExport = async (reportType: 'sales' | 'products' | 'customers') => {
    try {
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          report_type: reportType,
          format: 'csv',
          start_date: dateRange.start_date,
          end_date: dateRange.end_date,
        }),
      });

      if (!response.ok) throw new Error('Failed to export');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report-${dateRange.start_date}-${dateRange.end_date}.csv`;
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
        description: error.message || 'שגיאה בייצוא הדוח',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200">
        <div className="flex gap-2">
          {[
            { id: 'overview', label: 'סקירה כללית' },
            { id: 'customers', label: 'לקוחות' },
            { id: 'products', label: 'מוצרים' },
            { id: 'conversion', label: 'המרות' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={`${dateRange.start_date}_${dateRange.end_date}`}
            onValueChange={(value) => {
              const [start, end] = value.split('_');
              setDateRange({ start_date: start, end_date: end });
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={`${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}_${new Date().toISOString().split('T')[0]}`}>
                7 ימים אחרונים
              </SelectItem>
              <SelectItem value={`${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}_${new Date().toISOString().split('T')[0]}`}>
                30 ימים אחרונים
              </SelectItem>
              <SelectItem value={`${new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}_${new Date().toISOString().split('T')[0]}`}>
                90 ימים אחרונים
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleExport('sales')}
          >
            <HiDownload className="w-4 h-4 ml-1" />
            ייצא דוח
          </Button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
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
            <div className="text-2xl font-bold text-gray-900">{totals.total_orders || 0}</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">סה"כ הכנסות</div>
              <HiCurrencyDollar className="w-6 h-6 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              ₪{(parseFloat(totals.total_revenue) || 0).toLocaleString('he-IL')}
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
              ₪{(parseFloat(totals.average_order_value) || 0).toLocaleString('he-IL')}
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
        </>
      )}

      {activeTab === 'conversion' && (
        <div className="space-y-6">
          {conversionData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <div className="p-6">
                    <div className="text-sm text-gray-500 mb-2">שיעור המרה כללי</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {parseFloat(conversionData.overall_conversion_rate).toFixed(2)}%
                    </div>
                  </div>
                </Card>
                <Card>
                  <div className="p-6">
                    <div className="text-sm text-gray-500 mb-2">שיעור המרה מבקרים</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {parseFloat(conversionData.visitor_conversion_rate).toFixed(2)}%
                    </div>
                  </div>
                </Card>
                <Card>
                  <div className="p-6">
                    <div className="text-sm text-gray-500 mb-2">שיעור נטישת עגלות</div>
                    <div className="text-3xl font-bold text-red-600">
                      {parseFloat(conversionData.cart_abandonment_rate).toFixed(2)}%
                    </div>
                  </div>
                </Card>
              </div>

              {conversionData.conversion_by_date && conversionData.conversion_by_date.length > 0 && (
                <Card>
                  <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">שיעור המרה לפי תאריך</h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={conversionData.conversion_by_date.map((item: any) => ({
                        date: new Date(item.date).toLocaleDateString('he-IL', { month: 'short', day: 'numeric' }),
                        conversion_rate: parseFloat(item.conversion_rate),
                        visits: item.visits,
                        orders: item.orders,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="conversion_rate" stroke="#10b981" strokeWidth={2} name="שיעור המרה (%)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'customers' && (
        <div className="space-y-6">
          {customerAnalytics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <div className="p-6">
                    <div className="text-sm text-gray-500 mb-2">לקוחות חדשים</div>
                    <div className="text-3xl font-bold text-gray-900">{customerAnalytics.new_customers}</div>
                  </div>
                </Card>
                <Card>
                  <div className="p-6">
                    <div className="text-sm text-gray-500 mb-2">לקוחות חוזרים</div>
                    <div className="text-3xl font-bold text-gray-900">{customerAnalytics.returning_customers}</div>
                  </div>
                </Card>
                <Card>
                  <div className="p-6">
                    <div className="text-sm text-gray-500 mb-2">ערך הזמנה ממוצע</div>
                    <div className="text-3xl font-bold text-gray-900">
                      ₪{parseFloat(customerAnalytics.average_order_value || '0').toLocaleString('he-IL')}
                    </div>
                  </div>
                </Card>
              </div>

              {customerAnalytics.top_customers && customerAnalytics.top_customers.length > 0 && (
                <Card>
                  <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">לקוחות מובילים</h2>
                    <div className="space-y-3">
                      {customerAnalytics.top_customers.map((customer: any, index: number) => (
                        <div key={customer.customer_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center font-bold text-gray-600">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{customer.customer_name || customer.customer_email}</div>
                              <div className="text-sm text-gray-500">{customer.customer_email}</div>
                              <div className="text-xs text-gray-400 mt-1">{customer.order_count} הזמנות</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">
                              ₪{parseFloat(customer.total_spent).toLocaleString('he-IL')}
                            </div>
                            <div className="text-sm text-gray-500">סה"כ הוצאות</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'products' && (
        <div className="space-y-6">
          {productPerformance.length > 0 && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">ביצועי מוצרים</h2>
                <div className="space-y-3">
                  {productPerformance.map((product: any, index: number) => (
                    <div key={product.product_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center font-bold text-gray-600">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{product.product_title}</div>
                          <div className="text-sm text-gray-500">
                            {product.order_count} הזמנות • {product.total_quantity} יחידות • {product.views} צפיות
                          </div>
                          {product.conversion_rate && (
                            <div className="text-xs text-gray-400 mt-1">
                              שיעור המרה: {product.conversion_rate}%
                            </div>
                          )}
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
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

