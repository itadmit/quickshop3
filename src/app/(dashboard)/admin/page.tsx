'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  HiShoppingBag, 
  HiCreditCard, 
  HiCurrencyDollar, 
  HiUsers,
  HiChartBar,
  HiCog,
  HiExclamation,
  HiCheckCircle,
  HiClock
} from 'react-icons/hi';

interface DashboardStats {
  total_stores: number;
  active_stores: number;
  trial_stores: number;
  blocked_stores: number;
  total_subscriptions: number;
  monthly_revenue: number;
  pending_commissions: number;
  total_commissions_collected: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          if (data.user?.is_super_admin) {
            setIsSuperAdmin(true);
            // טעינת סטטיסטיקות
            const statsRes = await fetch('/api/admin/stats', { credentials: 'include' });
            if (statsRes.ok) {
              const statsData = await statsRes.json();
              setStats(statsData);
            }
          } else {
            router.push('/dashboard');
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error checking admin:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    checkAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  const statCards = [
    {
      title: 'סה"כ חנויות',
      value: stats?.total_stores || 0,
      icon: HiShoppingBag,
      color: 'bg-blue-500',
      href: '/admin/stores'
    },
    {
      title: 'חנויות פעילות',
      value: stats?.active_stores || 0,
      icon: HiCheckCircle,
      color: 'bg-green-500',
      href: '/admin/stores?status=active'
    },
    {
      title: 'בתקופת ניסיון',
      value: stats?.trial_stores || 0,
      icon: HiClock,
      color: 'bg-yellow-500',
      href: '/admin/stores?status=trial'
    },
    {
      title: 'חנויות חסומות',
      value: stats?.blocked_stores || 0,
      icon: HiExclamation,
      color: 'bg-red-500',
      href: '/admin/stores?status=blocked'
    },
    {
      title: 'הכנסה חודשית',
      value: `₪${(stats?.monthly_revenue || 0).toLocaleString()}`,
      icon: HiCreditCard,
      color: 'bg-purple-500',
      href: '/admin/subscriptions'
    },
    {
      title: 'עמלות בהמתנה',
      value: `₪${(stats?.pending_commissions || 0).toLocaleString()}`,
      icon: HiCurrencyDollar,
      color: 'bg-orange-500',
      href: '/admin/commissions'
    },
  ];

  const quickLinks = [
    { title: 'ניהול חנויות', href: '/admin/stores', icon: HiShoppingBag, desc: 'צפייה ועריכה של כל החנויות במערכת' },
    { title: 'מנויים וסליקה', href: '/admin/subscriptions', icon: HiCreditCard, desc: 'ניהול מנויים, היסטוריית תשלומים' },
    { title: 'דוח עמלות', href: '/admin/commissions', icon: HiCurrencyDollar, desc: 'מעקב אחרי עמלות עסקאות' },
    { title: 'סטטיסטיקות', href: '/admin/analytics', icon: HiChartBar, desc: 'נתונים וגרפים על הפלטפורמה' },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">לוח בקרה - סופר אדמין</h1>
        <p className="text-gray-600 mt-1">ניהול מרכזי של QuickShop</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className={`${stat.color} p-3 rounded-xl`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Links */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">גישה מהירה</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.title}
              href={link.href}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-primary transition-colors group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-100 rounded-xl group-hover:bg-primary/10 transition-colors">
                  <link.icon className="w-6 h-6 text-gray-600 group-hover:text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary">
                    {link.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{link.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity would go here */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">פעילות אחרונה</h2>
        <p className="text-gray-500 text-center py-8">טוען פעילות...</p>
      </div>
    </div>
  );
}

