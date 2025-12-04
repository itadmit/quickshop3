'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { 
  HiOfficeBuilding, 
  HiCube, 
  HiShoppingCart, 
  HiCreditCard,
  HiLightningBolt,
  HiChartBar,
  HiBell,
  HiClock,
  HiCurrencyDollar,
  HiStar,
  HiExclamationCircle,
  HiCheckCircle
} from 'react-icons/hi';

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
  };
  recentOrders: Array<{
    id: number;
    order_number: string;
    order_name: string;
    total_price: string;
    financial_status: string;
    fulfillment_status: string | null;
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

export function DashboardContent() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/stats', {
        credentials: 'include',
      });
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
    
    if (diffInSeconds < 60) return 'לפני רגע';
    if (diffInSeconds < 3600) return `לפני ${Math.floor(diffInSeconds / 60)} דקות`;
    if (diffInSeconds < 86400) return `לפני ${Math.floor(diffInSeconds / 3600)} שעות`;
    return `לפני ${Math.floor(diffInSeconds / 86400)} ימים`;
  };

  const getNotificationIcon = (type: string) => {
    if (type.includes('review')) return HiStar;
    if (type.includes('order')) return HiCheckCircle;
    if (type.includes('inventory')) return HiExclamationCircle;
    return HiBell;
  };

  const getNotificationColor = (type: string) => {
    if (type.includes('review')) return 'green';
    if (type.includes('order')) return 'blue';
    if (type.includes('inventory')) return 'orange';
    return 'green';
  };

  const metrics = stats ? [
    { 
      label: 'מוצרים פעילים', 
      value: stats.metrics.activeProducts.toString(), 
      total: `סה"כ ${stats.metrics.totalProducts}`, 
      icon: HiCube 
    },
    { 
      label: 'הזמנות ממתינות', 
      value: stats.metrics.pendingOrders.toString(), 
      total: `סה"כ ${stats.metrics.totalOrders}`, 
      icon: HiClock 
    },
    { 
      label: 'הכנסות', 
      value: formatCurrency(stats.metrics.revenue), 
      total: `${stats.metrics.revenueCount} הזמנות משולמות`, 
      icon: HiCurrencyDollar 
    },
    { 
      label: 'הזמנות', 
      value: stats.metrics.totalOrders.toString(), 
      total: `ממוצע ${formatCurrency(stats.metrics.averageOrderValue)}`, 
      icon: HiShoppingCart 
    },
  ] : [
    { label: 'מוצרים פעילים', value: '0', total: 'סה"כ 0', icon: HiCube },
    { label: 'הזמנות ממתינות', value: '0', total: 'סה"כ 0', icon: HiClock },
    { label: 'הכנסות', value: '₪0', total: '0 הזמנות', icon: HiCurrencyDollar },
    { label: 'הזמנות', value: '0', total: 'ממוצע ₪0', icon: HiShoppingCart },
  ];

  const notifications = stats?.notifications.map(n => ({
    type: n.notification_type,
    title: n.title,
    message: n.message,
    time: formatTimeAgo(n.created_at),
    icon: getNotificationIcon(n.notification_type),
    color: getNotificationColor(n.notification_type),
  })) || [];

  // Add low stock notifications
  if (stats?.lowStockProducts && stats.lowStockProducts.length > 0) {
    stats.lowStockProducts.forEach(product => {
      notifications.push({
        type: 'inventory.low',
        title: 'מלאי נמוך',
        message: `${product.title} - נותרו רק ${product.available} יחידות`,
        time: 'עכשיו',
        icon: HiExclamationCircle,
        color: 'orange',
      });
    });
  }

  const quickActions = [
    {
      title: 'צרו חנות חדשה',
      description: 'התחילו עם תבנית מוכנה או צרו מאפס',
      icon: HiOfficeBuilding,
    },
    {
      title: 'הוסיפו מוצרים',
      description: 'התחילו למכור עם קטלוג מוצרים מקצועי',
      icon: HiCube,
    },
    {
      title: 'הגדירו תשלומים',
      description: 'חברו את שיטת התשלום שלכם',
      icon: HiCreditCard,
    },
    {
      title: 'נהלו הזמנות',
      description: 'צפו וטפלו בהזמנות שלכם',
      icon: HiShoppingCart,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          שלום, {stats?.userName || 'משתמש'}
        </h1>
        <p className="text-base text-gray-600">
          איך אני יכול לעזור לך היום?
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <Card key={index}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600">{metric.label}</div>
                  <IconComponent className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {metric.value}
                </div>
                <div className="text-xs text-gray-400">{metric.total}</div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">מכירות אחרונות</h2>
              <HiChartBar className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </div>
            {loading ? (
              <div className="text-center py-12 text-gray-500">טוען...</div>
            ) : stats && stats.recentOrders.length > 0 ? (
              <div className="space-y-3">
                {stats.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-gray-900">
                        {order.order_name || order.order_number || `#${order.id}`}
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(order.total_price)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{formatTimeAgo(order.created_at)}</span>
                      <span>•</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        order.financial_status === 'paid' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.financial_status === 'paid' ? 'שולם' : 'ממתין לתשלום'}
                      </span>
                    </div>
                  </div>
                ))}
                <a 
                  href="/orders" 
                  className="block text-sm text-green-600 hover:text-green-700 mt-4 font-medium transition-colors text-center py-2 hover:bg-green-50 border border-gray-200 rounded-lg"
                >
                  ראה כל ההזמנות →
                </a>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                אין נתוני מכירות להצגה
              </div>
            )}
          </div>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">התראות אחרונות</h2>
              <HiBell className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </div>
            <div className="space-y-3">
              {notifications.map((notification, index) => {
                const IconComponent = notification.icon;
                const borderColorClass = {
                  green: 'border-r-green-500',
                  blue: 'border-r-blue-500',
                  orange: 'border-r-orange-500',
                }[notification.color] || 'border-r-green-500';
                
                const iconColorClass = {
                  green: 'text-green-500',
                  blue: 'text-blue-500',
                  orange: 'text-orange-500',
                }[notification.color] || 'text-green-500';
                
                return (
                  <div
                    key={index}
                    className={`group relative p-4 bg-white border-r-4 ${borderColorClass} border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-gray-50`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex-shrink-0 ${iconColorClass}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-base text-gray-900 mb-1.5 group-hover:text-gray-800 transition-colors">
                          {notification.title}
                        </div>
                        <div className="text-sm text-gray-600 mb-2 leading-relaxed">
                          {notification.message}
                        </div>
                        <div className="text-xs text-gray-400 font-medium">{notification.time}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <a 
                href="/notifications" 
                className="block text-sm text-green-600 hover:text-green-700 mt-6 font-medium transition-colors text-center py-2 hover:bg-green-50 border border-gray-200"
              >
                ראה הכל →
              </a>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HiLightningBolt className="w-6 h-6 flex-shrink-0" />
          <span>פעולות מהירות</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Card key={index} className="hover:shadow-md transition-all cursor-pointer group hover:border-primary-green">
                <div className="p-6">
                  <IconComponent className="w-10 h-10 text-primary-green mb-3 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary-green transition-colors">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

