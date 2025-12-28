'use client';

import { useState, useEffect } from 'react';
import { 
  HiOfficeBuilding, 
  HiCube, 
  HiCreditCard,
  HiLightningBolt,
  HiChartBar,
  HiBell,
  HiCurrencyDollar,
  HiExclamationCircle,
  HiCheckCircle,
  HiArrowSmUp,
  HiArrowSmDown,
  HiStar,
  HiShoppingCart,
  HiExternalLink
} from 'react-icons/hi';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  userName: string;
  metrics: {
    activeProducts: number;
    totalProducts: number;
    pendingOrders: number;
    totalOrders: number;
    revenue: string;
    revenueCount: number;
    averageOrderValue: string;
    salesToday: string;
    ordersToday: number;
    monthlySales: string;
    monthlyTransactions: number;
    trends: {
      salesToday: number;
      ordersToday: number;
      monthlySales: number;
      aov: number;
    };
  };
  weeklyData: Array<{
    date: string;
    orders: number;
    revenue: string;
  }>;
  recentOrders: Array<{
    id: number;
    order_number: string;
    order_name: string;
    total_price: string;
    financial_status: string;
    fulfillment_status: string | null;
    fulfillment_status_display: string | null;
    fulfillment_status_color: string | null;
    created_at: string;
    customer_id: number | null;
  }>;
  notifications: Array<{
    id: number;
    notification_type: string;
    title: string;
    message: string;
    link_url: string | null;
    is_read: boolean;
    created_at: string;
  }>;
  lowStockProducts: Array<{
    id: number;
    title: string;
    available: number;
  }>;
}

// Custom Card Component for consistent Apple-like design
const DashboardCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${className}`}>
    {children}
  </div>
);

export function DashboardContent() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [customStatuses, setCustomStatuses] = useState<Array<{ name: string; display_name: string; color: string }>>([]);

  useEffect(() => {
    loadStats();
    loadCustomStatuses();
  }, []);

  const loadCustomStatuses = async () => {
    try {
      const response = await fetch('/api/order-statuses');
      if (response.ok) {
        const data = await response.json();
        setCustomStatuses(data.statuses || []);
      }
    } catch (error) {
      console.error('Error loading custom statuses:', error);
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (num >= 1000) {
      return `₪${(num / 1000).toFixed(1)}K`;
    }
    return `₪${num.toLocaleString('he-IL')}`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'כרגע';
    if (diffInSeconds < 3600) return `לפני ${Math.floor(diffInSeconds / 60)} דק׳`;
    if (diffInSeconds < 86400) return `לפני ${Math.floor(diffInSeconds / 3600)} שע׳`;
    return `לפני ${Math.floor(diffInSeconds / 86400)} ימים`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });
  };

  // ✅ Chart Data Preparation
  const chartData = stats?.weeklyData?.map(item => ({
    date: formatDate(item.date),
    orders: item.orders,
    revenue: parseFloat(item.revenue || '0'),
    // שמות בעברית לטולטיפ
    'הזמנות': item.orders,
    'הכנסות': parseFloat(item.revenue || '0')
  })) || [];

  const metrics = stats ? [
    { 
      label: 'מכירות היום', 
      value: `₪${parseFloat(stats.metrics.salesToday || '0').toLocaleString('he-IL')}`, 
      subtext: `${stats.metrics.ordersToday} הזמנות`,
      icon: HiCurrencyDollar,
      trend: stats.metrics.trends?.salesToday || 0
    },
    { 
      label: 'סה״כ הזמנות', 
      value: stats.metrics.ordersToday.toString(), 
      subtext: 'היום', 
      icon: HiShoppingCart,
      trend: stats.metrics.trends?.ordersToday || 0
    },
    { 
      label: 'הכנסה חודשית', 
      value: `₪${parseFloat(stats.metrics.monthlySales || '0').toLocaleString('he-IL')}`, 
      subtext: `${stats.metrics.monthlyTransactions} עסקאות`, 
      icon: HiChartBar,
      trend: stats.metrics.trends?.monthlySales || 0
    },
    { 
      label: 'ממוצע להזמנה', 
      value: `₪${parseFloat(stats.metrics.averageOrderValue || '0').toLocaleString('he-IL')}`,
      subtext: '30 ימים אחרונים', 
      icon: HiCreditCard,
      trend: stats.metrics.trends?.aov || 0
    },
  ] : [
    { label: 'מכירות היום', value: '₪0', subtext: '0 הזמנות', icon: HiCurrencyDollar, trend: 0 },
    { label: 'סה״כ הזמנות', value: '0', subtext: 'היום', icon: HiShoppingCart, trend: 0 },
    { label: 'הכנסה חודשית', value: '₪0', subtext: '0 עסקאות', icon: HiChartBar, trend: 0 },
    { label: 'ממוצע להזמנה', value: '₪0', subtext: '0', icon: HiCreditCard, trend: 0 },
  ];

  const notifications = stats?.notifications.map(n => ({
    type: n.notification_type,
    title: n.title,
    message: n.message,
    time: formatTimeAgo(n.created_at),
    icon: n.notification_type.includes('review') ? HiStar : 
          n.notification_type.includes('order') ? HiCheckCircle : 
          n.notification_type.includes('inventory') ? HiExclamationCircle : HiBell,
  })) || [];

  if (stats?.lowStockProducts && stats.lowStockProducts.length > 0) {
    stats.lowStockProducts.forEach(product => {
      notifications.push({
        type: 'inventory.low',
        title: 'מלאי נמוך',
        message: `${product.title} - נותרו ${product.available} יחידות`,
        time: 'עכשיו',
        icon: HiExclamationCircle,
      });
    });
  }

  const quickActions = [
    { title: 'הוספת מוצר', description: 'יצירת מוצר חדש בקטלוג', icon: HiCube, href: '/products/new', color: 'bg-blue-50 text-blue-600' },
    { title: 'עיצוב החנות', description: 'שינוי מראה האתר', icon: HiOfficeBuilding, href: '/customize', color: 'bg-purple-50 text-purple-600' },
    { title: 'הגדרות', description: 'משלוחים ותשלומים', icon: HiCreditCard, href: '/settings', color: 'bg-gray-50 text-gray-600' },
  ];

  const getFulfillmentStatusLabel = (status: string | null) => {
     if (!status) return null;
     const customStatus = customStatuses.find(s => s.name === status);
     if (customStatus) return customStatus.display_name;
     
     const labels: Record<string, string> = {
       'pending': 'ממתין', 'approved': 'מאושר', 'paid': 'שולם', 'processing': 'בטיפול',
       'shipped': 'נשלח', 'delivered': 'נמסר', 'canceled': 'בוטל', 'returned': 'הוחזר',
       'fulfilled': 'סופק', 'unfulfilled': 'לא סופק'
     };
     return labels[status] || status;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6 md:p-10 font-sans text-gray-900 bg-gray-50/50 min-h-screen">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            סקירה כללית
          </h1>
          <p className="text-gray-500 mt-1.5 text-lg">
            ברוך הבא, {stats?.userName || 'מנהל'} 👋
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium text-gray-600 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
            {new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const isPositive = metric.trend >= 0;
          return (
            <DashboardCard key={index} className="p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex justify-between items-start mb-5">
                <div className="p-2.5 bg-gray-50 rounded-xl">
                  <Icon className="w-5 h-5 text-gray-700" />
                </div>
                {metric.trend !== 0 && (
                  <span className={`flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    isPositive 
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-100' 
                      : 'text-rose-700 bg-rose-50 border-rose-100'
                  }`}>
                    {isPositive ? <HiArrowSmUp className="w-3.5 h-3.5 mr-0.5" /> : <HiArrowSmDown className="w-3.5 h-3.5 mr-0.5" />}
                    {Math.abs(metric.trend)}%
                  </span>
                )}
                {metric.trend === 0 && (
                  <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                    - 0%
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-500">{metric.label}</h3>
                <div className="text-3xl font-bold text-gray-900 tracking-tight">{metric.value}</div>
                <div className="text-sm text-gray-400 mt-1">{metric.subtext}</div>
              </div>
            </DashboardCard>
          );
        })}
      </div>

      {/* Charts Section */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <DashboardCard className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-lg font-bold text-gray-900">ביצועי מכירות</h2>
                <p className="text-sm text-gray-500 mt-1">הכנסות ב-7 ימים האחרונים</p>
              </div>
            </div>
            <div className="h-[300px] w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                    reversed={true} // היפוך ציר ה-X לתצוגה נכונה מימין לשמאל
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => `₪${val}`}
                    orientation="right" // ציר Y מימין
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: 'none', 
                      borderRadius: '12px', 
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      padding: '12px'
                    }}
                    labelStyle={{ color: '#64748b', marginBottom: '8px', textAlign: 'right', fontSize: '13px' }}
                    itemStyle={{ color: '#0f172a', fontSize: '14px', fontWeight: 600, textAlign: 'right' }}
                    formatter={(value: any) => [`₪${Number(value).toLocaleString()}`, 'הכנסות']}
                    labelFormatter={(label) => `תאריך: ${label}`}
                    cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#2563eb" 
                    strokeWidth={3} 
                    dot={false} 
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }} 
                    fill="url(#colorRevenue)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>

          <DashboardCard className="p-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-lg font-bold text-gray-900">הזמנות יומיות</h2>
                <p className="text-sm text-gray-500 mt-1">כמות הזמנות</p>
              </div>
            </div>
            <div className="h-[300px] w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10} 
                    reversed={true} // היפוך ציר X
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    orientation="right" // ציר Y מימין
                  />
                  <Tooltip 
                     contentStyle={{ 
                       backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                       border: 'none', 
                       borderRadius: '12px',
                       boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                       padding: '12px'
                     }}
                     labelStyle={{ color: '#64748b', marginBottom: '8px', textAlign: 'right', fontSize: '13px' }}
                     itemStyle={{ color: '#0f172a', fontSize: '14px', fontWeight: 600, textAlign: 'right' }}
                     formatter={(value: any) => [value, 'הזמנות']}
                     labelFormatter={(label) => `תאריך: ${label}`}
                     cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar 
                    dataKey="orders" 
                    fill="#3b82f6" 
                    radius={[6, 6, 0, 0]} 
                    barSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <DashboardCard className="lg:col-span-2 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
            <h2 className="text-lg font-bold text-gray-900">הזמנות אחרונות</h2>
            <a href="/orders" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 hover:underline">
              לכל ההזמנות <HiExternalLink className="w-4 h-4" />
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-medium whitespace-nowrap">מס׳ הזמנה</th>
                  <th className="px-6 py-4 font-medium whitespace-nowrap">לקוח</th>
                  <th className="px-6 py-4 font-medium whitespace-nowrap">סטטוס</th>
                  <th className="px-6 py-4 font-medium whitespace-nowrap">סכום</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats?.recentOrders.length ? stats.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/80 transition-colors group cursor-pointer">
                    <td className="px-6 py-4 font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {order.order_name || `#${order.id}`}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {order.customer_id ? `לקוח רשום` : 'לקוח מזדמן'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
                        ${!order.fulfillment_status 
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-100' 
                          : order.fulfillment_status === 'fulfilled' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-gray-50 text-gray-700 border-gray-100'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ml-1.5 ${
                           !order.fulfillment_status ? 'bg-yellow-400' : 
                           order.fulfillment_status === 'fulfilled' ? 'bg-emerald-400' : 'bg-gray-400'
                        }`}></span>
                        {getFulfillmentStatusLabel(order.fulfillment_status) || 'בהמתנה'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-semibold tracking-tight">
                      {formatCurrency(order.total_price)}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <HiShoppingCart className="w-8 h-8 text-gray-300" />
                        <p>עדיין אין הזמנות חדשות</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DashboardCard>

        {/* Notifications & Quick Actions */}
        <div className="space-y-6">
           {/* Notifications */}
          <DashboardCard className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">עדכונים אחרונים</h2>
            <div className="space-y-0">
              {notifications.length > 0 ? notifications.slice(0, 4).map((notif, idx) => {
                const Icon = notif.icon;
                return (
                  <div key={idx} className="flex gap-4 items-start py-3 border-b border-gray-50 last:border-0 last:pb-0 first:pt-0">
                    <div className="bg-gray-50 p-2.5 rounded-xl flex-shrink-0">
                      <Icon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 font-semibold">{notif.title}</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{notif.message}</p>
                      <span className="text-[11px] text-gray-400 mt-1.5 block font-medium">{notif.time}</span>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-sm text-gray-500 text-center py-8">
                   <HiBell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                   אין התראות חדשות
                </div>
              )}
            </div>
            {notifications.length > 0 && (
              <button className="w-full mt-6 text-xs text-gray-500 hover:text-gray-900 font-medium transition-colors border-t border-gray-100 pt-4">
                נקה את כל ההתראות
              </button>
            )}
          </DashboardCard>

          {/* Quick Actions - iOS Widget Style */}
          <div className="grid grid-cols-1 gap-3">
             {quickActions.map((action, i) => (
                <a key={i} href={action.href} className="group block">
                  <DashboardCard className="p-4 hover:border-blue-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${action.color}`}>
                        <action.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {action.description}
                        </p>
                      </div>
                      <HiExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-400" />
                    </div>
                  </DashboardCard>
                </a>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
