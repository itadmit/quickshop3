'use client';

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

export default function DashboardPage() {
  const metrics = [
    { label: 'מוצרים פעילים', value: '6', total: 'סה"כ 6', icon: HiCube },
    { label: 'הזמנות ממתינות', value: '0', total: 'סה"כ 3', icon: HiClock },
    { label: 'הכנסות', value: '₪2K', total: '2K סה"כ', icon: HiCurrencyDollar },
    { label: 'הזמנות', value: '₪0', total: '0 הזמנות | ממוצע סעו', icon: HiShoppingCart },
  ];

  const notifications = [
    {
      type: 'review',
      title: 'ביקורת חדשה',
      message: 'ביקורת חדשה על נעליים נייק Air Max',
      time: 'לפני 5 דקות',
      icon: HiStar,
      color: 'green',
    },
    {
      type: 'order',
      title: 'הזמנה חדשה התקבלה',
      message: 'הזמנה 000001-ORD בסכום של ₪731.48',
      time: 'לפני 10 דקות',
      icon: HiCheckCircle,
      color: 'blue',
    },
    {
      type: 'inventory',
      title: 'מלאי נמוך',
      message: 'מוצר כובע אדידס - נותרו רק 20 יחידות',
      time: 'לפני 15 דקות',
      icon: HiExclamationCircle,
      color: 'orange',
    },
  ];

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
          שלום, יוגב אביטן
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
            <div className="text-center py-12 text-gray-500">
              אין נתוני מכירות להצגה
            </div>
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

