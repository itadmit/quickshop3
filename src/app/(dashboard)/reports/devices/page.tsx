'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  HiArrowLeft,
  HiDownload,
  HiDeviceMobile,
  HiDesktopComputer,
  HiDeviceTablet,
  HiTrendingUp,
} from 'react-icons/hi';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface DeviceData {
  device_type: string;
  visits: number;
  orders: number;
  revenue: number;
  conversion_rate: number;
  avg_session_duration: number;
}

interface BrowserData {
  browser: string;
  visits: number;
  percentage: number;
}

interface OSData {
  os: string;
  visits: number;
  percentage: number;
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const deviceIcons: Record<string, React.ReactNode> = {
  mobile: <HiDeviceMobile className="w-8 h-8" />,
  desktop: <HiDesktopComputer className="w-8 h-8" />,
  tablet: <HiDeviceTablet className="w-8 h-8" />,
};

const deviceNames: Record<string, string> = {
  mobile: 'מובייל',
  desktop: 'דסקטופ',
  tablet: 'טאבלט',
};

export default function DevicesReportPage() {
  const { toast } = useOptimisticToast();
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [browsers, setBrowsers] = useState<BrowserData[]>([]);
  const [operatingSystems, setOperatingSystems] = useState<OSData[]>([]);
  const [totals, setTotals] = useState({
    total_visits: 0,
    total_orders: 0,
    total_revenue: 0,
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

      const response = await fetch(`/api/reports/devices?${params.toString()}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);
        setBrowsers(data.browsers || []);
        setOperatingSystems(data.operating_systems || []);
        setTotals(data.totals || totals);
      }
    } catch (error: any) {
      console.error('Error loading devices report:', error);
      toast({ title: 'שגיאה', description: 'לא ניתן לטעון נתונים', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const devicePieData = devices.map((d) => ({
    name: deviceNames[d.device_type] || d.device_type,
    value: d.visits,
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
            <h1 className="text-2xl font-bold text-gray-900">דוח מכשירים</h1>
            <p className="text-gray-500 mt-1">התפלגות גולשים לפי סוג מכשיר</p>
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

      {/* Device Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {devices.map((device, index) => (
          <Card key={device.device_type}>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-xl text-white`} style={{ backgroundColor: COLORS[index] }}>
                  {deviceIcons[device.device_type] || <HiDeviceMobile className="w-8 h-8" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {deviceNames[device.device_type] || device.device_type}
                  </h3>
                  <div className="text-sm text-gray-500">
                    {totals.total_visits > 0 ? ((device.visits / totals.total_visits) * 100).toFixed(1) : 0}% מהתנועה
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">ביקורים</div>
                  <div className="text-lg font-bold text-gray-900">{device.visits.toLocaleString('he-IL')}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">הזמנות</div>
                  <div className="text-lg font-bold text-gray-900">{device.orders.toLocaleString('he-IL')}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">הכנסות</div>
                  <div className="text-lg font-bold text-emerald-600">₪{device.revenue.toLocaleString('he-IL')}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">שיעור המרה</div>
                  <div className="text-lg font-bold text-purple-600">{device.conversion_rate.toFixed(2)}%</div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Distribution */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">התפלגות לפי מכשיר</h2>
            {loading ? (
              <div className="h-80 animate-pulse bg-gray-200 rounded"></div>
            ) : devicePieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={devicePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {devicePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">אין נתונים</div>
            )}
          </div>
        </Card>

        {/* Revenue by Device */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">הכנסות לפי מכשיר</h2>
            {loading ? (
              <div className="h-80 animate-pulse bg-gray-200 rounded"></div>
            ) : devices.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={devices.map((d) => ({
                  name: deviceNames[d.device_type] || d.device_type,
                  revenue: d.revenue,
                  orders: d.orders,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number, name: string) => {
                    if (name === 'revenue') return [`₪${value.toLocaleString('he-IL')}`, 'הכנסות'];
                    return [value, name];
                  }} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#22c55e" name="הכנסות" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">אין נתונים</div>
            )}
          </div>
        </Card>
      </div>

      {/* Browsers & OS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Browsers */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">דפדפנים</h2>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 animate-pulse bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : browsers.length > 0 ? (
              <div className="space-y-3">
                {browsers.slice(0, 8).map((browser, index) => (
                  <div key={browser.browser} className="flex items-center gap-3">
                    <div className="w-32 text-sm text-gray-700 truncate">{browser.browser}</div>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${browser.percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                    </div>
                    <div className="w-20 text-left text-sm">
                      <span className="font-medium">{browser.visits.toLocaleString('he-IL')}</span>
                      <span className="text-gray-400 text-xs mr-1">({browser.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">אין נתונים</div>
            )}
          </div>
        </Card>

        {/* Operating Systems */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">מערכות הפעלה</h2>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 animate-pulse bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : operatingSystems.length > 0 ? (
              <div className="space-y-3">
                {operatingSystems.slice(0, 8).map((os, index) => (
                  <div key={os.os} className="flex items-center gap-3">
                    <div className="w-32 text-sm text-gray-700 truncate">{os.os}</div>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${os.percentage}%`,
                          backgroundColor: COLORS[(index + 2) % COLORS.length],
                        }}
                      />
                    </div>
                    <div className="w-20 text-left text-sm">
                      <span className="font-medium">{os.visits.toLocaleString('he-IL')}</span>
                      <span className="text-gray-400 text-xs mr-1">({os.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">אין נתונים</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

