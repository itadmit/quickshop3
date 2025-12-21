'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import {
  HiArrowLeft,
  HiDownload,
  HiLocationMarker,
  HiGlobeAlt,
  HiCurrencyDollar,
  HiShoppingCart,
} from 'react-icons/hi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface LocationData {
  country: string;
  country_code: string;
  city: string;
  visits: number;
  orders: number;
  revenue: number;
  conversion_rate: number;
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function SalesByLocationPage() {
  const { toast } = useOptimisticToast();
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState<LocationData[]>([]);
  const [cities, setCities] = useState<LocationData[]>([]);
  const [totals, setTotals] = useState({
    total_visits: 0,
    total_orders: 0,
    total_revenue: 0,
    countries_count: 0,
    cities_count: 0,
  });
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('start_date', dateRange.start_date);
      params.append('end_date', dateRange.end_date);

      const response = await fetch(`/api/reports/sales-by-location?${params.toString()}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setCountries(data.countries || []);
        setCities(data.cities || []);
        setTotals(data.totals || totals);
      }
    } catch (error: any) {
      console.error('Error loading location report:', error);
      toast({ title: 'שגיאה', description: 'לא ניתן לטעון נתונים', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const countryPieData = countries.slice(0, 6).map((c) => ({
    name: c.country,
    value: c.revenue,
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
            <h1 className="text-2xl font-bold text-gray-900">מכירות לפי מיקום</h1>
            <p className="text-gray-500 mt-1">ניתוח מכירות לפי מדינה ועיר</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
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
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">מדינות פעילות</div>
              <HiGlobeAlt className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{totals.countries_count}</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">ערים פעילות</div>
              <HiLocationMarker className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{totals.cities_count}</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">סה"כ הזמנות</div>
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
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Countries Pie Chart */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">הכנסות לפי מדינה</h2>
            {loading ? (
              <div className="h-80 animate-pulse bg-gray-200 rounded"></div>
            ) : countryPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={countryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {countryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`₪${value.toLocaleString('he-IL')}`, 'הכנסות']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">אין נתונים</div>
            )}
          </div>
        </Card>

        {/* Top Cities Bar Chart */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ערים מובילות</h2>
            {loading ? (
              <div className="h-80 animate-pulse bg-gray-200 rounded"></div>
            ) : cities.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cities.slice(0, 10).map((c) => ({
                  name: c.city,
                  revenue: c.revenue,
                  orders: c.orders,
                }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip formatter={(value: number, name: string) => {
                    if (name === 'revenue') return [`₪${value.toLocaleString('he-IL')}`, 'הכנסות'];
                    return [value, name];
                  }} />
                  <Bar dataKey="revenue" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">אין נתונים</div>
            )}
          </div>
        </Card>
      </div>

      {/* Countries Table */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">פירוט מדינות</h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 animate-pulse bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : countries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">מדינה</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">ביקורים</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">הזמנות</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">הכנסות</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">שיעור המרה</th>
                  </tr>
                </thead>
                <tbody>
                  {countries.map((country, index) => (
                    <tr key={country.country_code || index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{country.country_code === 'IL' ? '🇮🇱' : '🌍'}</span>
                          <span className="font-medium text-gray-900">{country.country}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-900">{country.visits.toLocaleString('he-IL')}</td>
                      <td className="py-4 px-4 text-gray-900">{country.orders.toLocaleString('he-IL')}</td>
                      <td className="py-4 px-4 text-emerald-600 font-medium">₪{country.revenue.toLocaleString('he-IL')}</td>
                      <td className="py-4 px-4 text-purple-600">{country.conversion_rate.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">אין נתונים</div>
          )}
        </div>
      </Card>

      {/* Cities Table */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">פירוט ערים</h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 animate-pulse bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : cities.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">עיר</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">מדינה</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">ביקורים</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">הזמנות</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">הכנסות</th>
                  </tr>
                </thead>
                <tbody>
                  {cities.slice(0, 20).map((city, index) => (
                    <tr key={`${city.city}-${index}`} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <HiLocationMarker className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{city.city}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-500">{city.country}</td>
                      <td className="py-4 px-4 text-gray-900">{city.visits.toLocaleString('he-IL')}</td>
                      <td className="py-4 px-4 text-gray-900">{city.orders.toLocaleString('he-IL')}</td>
                      <td className="py-4 px-4 text-emerald-600 font-medium">₪{city.revenue.toLocaleString('he-IL')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">אין נתונים</div>
          )}
        </div>
      </Card>
    </div>
  );
}

