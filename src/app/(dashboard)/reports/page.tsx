'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import {
  HiTrendingUp,
  HiShoppingCart,
  HiUsers,
  HiCurrencyDollar,
  HiGlobeAlt,
  HiDeviceMobile,
  HiTag,
  HiRefresh,
  HiDocumentReport,
  HiCube,
  HiChartPie,
  HiLocationMarker,
  HiClock,
  HiCollection,
  HiCreditCard,
  HiShoppingBag,
  HiUserGroup,
  HiChartBar,
  HiEye,
  HiArrowNarrowLeft,
  HiFilter,
} from 'react-icons/hi';

interface ReportCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  reports: ReportItem[];
}

interface ReportItem {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  isNew?: boolean;
  isPro?: boolean;
}

const reportCategories: ReportCategory[] = [
  {
    id: 'traffic',
    title: 'תנועה ומקורות',
    description: 'נתונים על מקורות התנועה לחנות',
    icon: <HiGlobeAlt className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    reports: [
      {
        id: 'traffic-sources',
        title: 'מקורות תנועה',
        description: 'אינסטגרם, פייסבוק, גוגל ועוד',
        href: '/reports/traffic-sources',
        icon: <HiGlobeAlt className="w-5 h-5" />,
      },
      {
        id: 'utm-analysis',
        title: 'ניתוח UTM',
        description: 'מעקב קמפיינים שיווקיים',
        href: '/reports/utm-analysis',
        icon: <HiTag className="w-5 h-5" />,
      },
      {
        id: 'referrers',
        title: 'אתרים מפנים',
        description: 'מאילו אתרים הגיעו לקוחות',
        href: '/reports/referrers',
        icon: <HiArrowNarrowLeft className="w-5 h-5" />,
      },
      {
        id: 'landing-pages',
        title: 'דפי נחיתה',
        description: 'לאילו דפים הגיעו קודם',
        href: '/reports/landing-pages',
        icon: <HiDocumentReport className="w-5 h-5" />,
      },
    ],
  },
  {
    id: 'sales',
    title: 'מכירות',
    description: 'דוחות מכירות והכנסות',
    icon: <HiCurrencyDollar className="w-6 h-6" />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    reports: [
      {
        id: 'sales-overview',
        title: 'סקירת מכירות',
        description: 'מכירות לפי תאריך וזמן',
        href: '/reports/sales',
        icon: <HiChartBar className="w-5 h-5" />,
      },
      {
        id: 'sales-by-product',
        title: 'מכירות לפי מוצר',
        description: 'מוצרים הכי נמכרים',
        href: '/reports/sales-by-product',
        icon: <HiCube className="w-5 h-5" />,
      },
      {
        id: 'sales-by-category',
        title: 'מכירות לפי קטגוריה',
        description: 'ביצועי קולקציות',
        href: '/reports/sales-by-category',
        icon: <HiCollection className="w-5 h-5" />,
      },
      {
        id: 'sales-by-channel',
        title: 'מכירות לפי ערוץ',
        description: 'השוואה בין ערוצי מכירה',
        href: '/reports/sales-by-channel',
        icon: <HiShoppingBag className="w-5 h-5" />,
      },
      {
        id: 'sales-by-location',
        title: 'מכירות לפי מיקום',
        description: 'מכירות לפי עיר ואזור',
        href: '/reports/sales-by-location',
        icon: <HiLocationMarker className="w-5 h-5" />,
      },
      {
        id: 'sales-by-discount',
        title: 'מכירות לפי הנחה',
        description: 'ביצועי קופונים והנחות',
        href: '/reports/sales-by-discount',
        icon: <HiTag className="w-5 h-5" />,
      },
    ],
  },
  {
    id: 'customers',
    title: 'לקוחות',
    description: 'ניתוח התנהגות לקוחות',
    icon: <HiUsers className="w-6 h-6" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    reports: [
      {
        id: 'customer-overview',
        title: 'סקירת לקוחות',
        description: 'לקוחות חדשים וחוזרים',
        href: '/reports/customers',
        icon: <HiUserGroup className="w-5 h-5" />,
      },
      {
        id: 'first-vs-returning',
        title: 'לקוחות חדשים vs חוזרים',
        description: 'השוואת ערך לפי סוג לקוח',
        href: '/reports/first-vs-returning',
        icon: <HiRefresh className="w-5 h-5" />,
      },
      {
        id: 'customer-lifetime-value',
        title: 'ערך חיי לקוח (CLV)',
        description: 'ערך לקוח לאורך זמן',
        href: '/reports/customer-ltv',
        icon: <HiCurrencyDollar className="w-5 h-5" />,
        isPro: true,
      },
      {
        id: 'customer-cohorts',
        title: 'ניתוח קוהורטות',
        description: 'התנהגות לפי תאריך הצטרפות',
        href: '/reports/customer-cohorts',
        icon: <HiChartPie className="w-5 h-5" />,
        isPro: true,
      },
      {
        id: 'top-customers',
        title: 'לקוחות מובילים',
        description: 'הלקוחות הכי רווחיים',
        href: '/reports/top-customers',
        icon: <HiTrendingUp className="w-5 h-5" />,
      },
      {
        id: 'customer-at-risk',
        title: 'לקוחות בסיכון',
        description: 'לקוחות שלא קנו זמן רב',
        href: '/reports/customers-at-risk',
        icon: <HiUsers className="w-5 h-5" />,
        isNew: true,
      },
    ],
  },
  {
    id: 'behavior',
    title: 'התנהגות',
    description: 'איך גולשים מתנהגים באתר',
    icon: <HiEye className="w-6 h-6" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    reports: [
      {
        id: 'conversion-funnel',
        title: 'משפך המרה',
        description: 'מביקור ועד רכישה',
        href: '/reports/conversion-funnel',
        icon: <HiFilter className="w-5 h-5" />,
      },
      {
        id: 'cart-analysis',
        title: 'ניתוח עגלות',
        description: 'נטישת עגלות ושיעורי המרה',
        href: '/reports/cart-analysis',
        icon: <HiShoppingCart className="w-5 h-5" />,
      },
      {
        id: 'top-pages',
        title: 'דפים פופולריים',
        description: 'הדפים הכי נצפים',
        href: '/reports/top-pages',
        icon: <HiDocumentReport className="w-5 h-5" />,
      },
      {
        id: 'session-duration',
        title: 'זמן בשהייה באתר',
        description: 'כמה זמן גולשים באתר',
        href: '/reports/session-duration',
        icon: <HiClock className="w-5 h-5" />,
      },
      {
        id: 'search-terms',
        title: 'חיפושים באתר',
        description: 'מה לקוחות מחפשים',
        href: '/reports/search-terms',
        icon: <HiEye className="w-5 h-5" />,
        isNew: true,
      },
    ],
  },
  {
    id: 'devices',
    title: 'מכשירים',
    description: 'ניתוח לפי סוג מכשיר',
    icon: <HiDeviceMobile className="w-6 h-6" />,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    reports: [
      {
        id: 'device-breakdown',
        title: 'התפלגות מכשירים',
        description: 'מובייל, דסקטופ, טאבלט',
        href: '/reports/devices',
        icon: <HiDeviceMobile className="w-5 h-5" />,
      },
      {
        id: 'browser-os',
        title: 'דפדפנים ומערכות הפעלה',
        description: 'Chrome, Safari, iOS, Android',
        href: '/reports/browsers',
        icon: <HiGlobeAlt className="w-5 h-5" />,
      },
    ],
  },
  {
    id: 'finances',
    title: 'פיננסים',
    description: 'דוחות כספיים',
    icon: <HiCreditCard className="w-6 h-6" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    reports: [
      {
        id: 'revenue',
        title: 'הכנסות',
        description: 'סה"כ הכנסות לאורך זמן',
        href: '/reports/revenue',
        icon: <HiCurrencyDollar className="w-5 h-5" />,
      },
      {
        id: 'taxes',
        title: 'מיסים',
        description: 'דוח מע"מ ומיסים',
        href: '/reports/taxes',
        icon: <HiDocumentReport className="w-5 h-5" />,
      },
      {
        id: 'shipping',
        title: 'משלוחים',
        description: 'עלויות והכנסות משלוח',
        href: '/reports/shipping',
        icon: <HiCube className="w-5 h-5" />,
      },
      {
        id: 'refunds',
        title: 'החזרים וביטולים',
        description: 'דוח החזרות כספיות',
        href: '/reports/refunds',
        icon: <HiRefresh className="w-5 h-5" />,
      },
      {
        id: 'discounts',
        title: 'הנחות',
        description: 'ביצועי קופונים והנחות',
        href: '/reports/discounts-performance',
        icon: <HiTag className="w-5 h-5" />,
      },
    ],
  },
  {
    id: 'inventory',
    title: 'מלאי',
    description: 'דוחות מלאי ומוצרים',
    icon: <HiCube className="w-6 h-6" />,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    reports: [
      {
        id: 'inventory-levels',
        title: 'רמות מלאי',
        description: 'מצב מלאי נוכחי',
        href: '/reports/inventory-levels',
        icon: <HiCube className="w-5 h-5" />,
      },
      {
        id: 'low-stock',
        title: 'מוצרים במלאי נמוך',
        description: 'מוצרים שעומדים להיגמר',
        href: '/reports/low-stock',
        icon: <HiCube className="w-5 h-5" />,
      },
      {
        id: 'sold-out',
        title: 'מוצרים אזלו',
        description: 'מוצרים שנגמרו מהמלאי',
        href: '/reports/sold-out',
        icon: <HiCube className="w-5 h-5" />,
      },
      {
        id: 'product-performance',
        title: 'ביצועי מוצרים',
        description: 'ניתוח מעמיק לפי מוצר',
        href: '/reports/product-performance',
        icon: <HiChartBar className="w-5 h-5" />,
      },
    ],
  },
];

export default function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = reportCategories.map((category) => ({
    ...category,
    reports: category.reports.filter(
      (report) =>
        report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((category) => category.reports.length > 0);

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">דוחות</h1>
          <p className="text-gray-500 mt-1">דוחות מתקדמים לניתוח מעמיק של החנות שלך</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/analytics/realtime"
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <HiGlobeAlt className="w-5 h-5" />
            <span>אנליטיקה בזמן אמת</span>
          </Link>
          <Link
            href="/analytics"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <HiChartBar className="w-5 h-5" />
            <span>סקירה כללית</span>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="חפש דוח..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
        <HiEye className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      </div>

      {/* Report Categories Grid */}
      <div className="space-y-8">
        {filteredCategories.map((category) => (
          <Card key={category.id}>
            <div className="p-6">
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-xl ${category.bgColor} ${category.color}`}>
                  {category.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{category.title}</h2>
                  <p className="text-sm text-gray-500">{category.description}</p>
                </div>
              </div>

              {/* Reports Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.reports.map((report) => (
                  <Link
                    key={report.id}
                    href={report.href}
                    className="group relative p-4 border border-gray-200 rounded-xl hover:border-green-500 hover:shadow-md transition-all duration-200"
                  >
                    {report.isNew && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        חדש
                      </span>
                    )}
                    {report.isPro && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                        Pro
                      </span>
                    )}
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${category.bgColor} ${category.color} group-hover:scale-110 transition-transform`}>
                        {report.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                          {report.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Stats Footer */}
      <Card>
        <div className="p-6 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <HiDocumentReport className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {reportCategories.reduce((acc, cat) => acc + cat.reports.length, 0)}
                </div>
                <div className="text-sm text-gray-500">דוחות זמינים</div>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              כל הדוחות ניתנים לייצוא ל-CSV
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

