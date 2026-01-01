'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { MenuIcons } from '@/components/icons/MenuIcons';
import { IconType } from 'react-icons';
import { HiCog, HiLogout } from 'react-icons/hi';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';

interface MenuItem {
  label: string;
  href: string;
  icon: IconType;
  badge?: number;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { label: 'בית', href: '/dashboard', icon: MenuIcons.home },
  { label: 'אנליטיקס', href: '/analytics', icon: MenuIcons.analytics },
  { label: 'דוחות', href: '/reports', icon: MenuIcons.reports },
  { label: 'עיצוב ותבניות', href: '/themes', icon: MenuIcons.themes },
  { label: 'התראות', href: '/notifications', icon: MenuIcons.notifications },
  {
    label: 'מכירות',
    href: '#',
    icon: MenuIcons.sales,
    children: [
      { label: 'מוצרים', href: '/products', icon: MenuIcons.products },
      { label: 'קטגוריות', href: '/categories', icon: MenuIcons.categories },
      { label: 'הזמנות', href: '/orders', icon: MenuIcons.orders },
      { label: 'אנשי קשר', href: '/contacts', icon: MenuIcons.customers },
      { label: 'מלאי', href: '/inventory', icon: MenuIcons.products },
      { label: 'עריכה קבוצתית', href: '/bulk-edit', icon: MenuIcons.bulkEdit },
    ],
  },
  {
    label: 'תשלומים ומשלוחים',
    href: '#',
    icon: MenuIcons.payments,
    children: [
      { label: 'תשלומים', href: '/settings/payments', icon: MenuIcons.payments },
      { label: 'משלוחים', href: '/settings/shipping', icon: MenuIcons.shipping },
    ],
  },
  {
    label: 'שיווק והנחות',
    href: '#',
    icon: MenuIcons.discounts,
    children: [
      { label: 'יועץ חכם', href: '/smart-advisor', icon: MenuIcons.sparkles },
      { label: 'סטוריז מוצרים', href: '/settings/stories', icon: MenuIcons.media },
      { label: 'הנחות אוטומטיות', href: '/automatic-discounts', icon: MenuIcons.discounts },
      { label: 'קופונים', href: '/discounts', icon: MenuIcons.coupons },
      { label: 'משפיענים', href: '/marketing/influencers', icon: MenuIcons.customers },
      { label: 'נאמנות פרימיום', href: '/settings/premium-club', icon: MenuIcons.loyalty },
      { label: 'גיפט קארד', href: '/gift-cards', icon: MenuIcons.giftCards },
      { label: 'עגלות נטושות', href: '/abandoned-carts', icon: MenuIcons.abandonedCarts },
      { label: 'רשימת המתנה', href: '/wishlist', icon: MenuIcons.wishlist },
    ],
  },
  {
    label: 'תוכן',
    href: '#',
    icon: MenuIcons.pages,
    children: [
      { label: 'דפים', href: '/pages', icon: MenuIcons.pages },
      { label: 'תפריט ניווט', href: '/navigation', icon: MenuIcons.navigation },
      { label: 'בלוג', href: '/blog', icon: MenuIcons.blog },
      { label: 'פופאפים', href: '/popups', icon: MenuIcons.popups },
      { label: 'מדיה', href: '/media', icon: MenuIcons.media },
    ],
  },
  {
    label: 'שירות לקוחות',
    href: '#',
    icon: MenuIcons.reviews,
    children: [
      { label: 'ביקורות', href: '/reviews', icon: MenuIcons.reviews },
      { label: 'החזרות והחלפות', href: '/returns', icon: MenuIcons.returns },
      { label: 'קרדיט בחנות', href: '/store-credits', icon: MenuIcons.storeCredits },
    ],
  },
  {
    label: 'ניהול',
    href: '#',
    icon: MenuIcons.customers,
    children: [
      { label: 'ניהול צוות', href: '/team', icon: MenuIcons.customers },
    ],
  },
  {
    label: 'תוספות',
    href: '#',
    icon: MenuIcons.addons,
    children: [
      { label: 'שדות מטא', href: '/settings/meta-fields', icon: MenuIcons.metaFields },
      { label: 'טבלאות מידות', href: '/settings/size-charts', icon: MenuIcons.sizeCharts },
      { label: 'תוספות למוצרים', href: '/settings/product-addons', icon: MenuIcons.productAddons },
      { label: 'סטטוסי הזמנות', href: '/settings/order-statuses', icon: MenuIcons.orders },
    ],
  },
  {
    label: 'אינטגרציות',
    href: '#',
    icon: MenuIcons.webhooks,
    children: [
      { label: 'פיקסלים ומעקב', href: '/settings/tracking', icon: MenuIcons.analytics },
      { label: 'Webhooks', href: '/webhooks', icon: MenuIcons.webhooks },
      { label: 'מרקטפלייס תוספים', href: '/settings/plugins', icon: MenuIcons.plugins },
      { label: 'אוטומציות', href: '/automations', icon: MenuIcons.automations },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['מכירות', 'שיווק והנחות', 'תוכן', 'שירות לקוחות', 'ניהול', 'תוספות', 'אינטגרציות']);
  const [clickedLink, setClickedLink] = useState<string | null>(null);
  
  // Use shared hook for unread counts - prevents duplicate API calls
  const { notificationsCount: unreadNotificationsCount, ordersCount: unreadOrdersCount, returnsCount: pendingReturnsCount, refreshCounts } = useUnreadCounts();

  const isActive = (href: string) => pathname === href;
  
  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Don't prevent default - let Next.js handle navigation
    // Just set visual feedback
    setClickedLink(href);
    
    // Clear feedback after animation
    setTimeout(() => {
      if (pathname !== href) {
        setClickedLink(null);
      }
    }, 300);
  };
  
  // Clear clicked link when route changes
  useEffect(() => {
    setClickedLink(null);
  }, [pathname]);

  // Listen for events to refresh counts
  useEffect(() => {
    const handleRefresh = () => refreshCounts();
    window.addEventListener('orderMarkedAsRead', handleRefresh);
    window.addEventListener('notificationMarkedAsRead', handleRefresh);
    window.addEventListener('returnStatusChanged', handleRefresh); // ✅ הוספת event listener להחזרות
    
    return () => {
      window.removeEventListener('orderMarkedAsRead', handleRefresh);
      window.removeEventListener('notificationMarkedAsRead', handleRefresh);
      window.removeEventListener('returnStatusChanged', handleRefresh); // ✅ ניקוי event listener
    };
  }, [refreshCounts]);
  
  const toggleMenu = (label: string) => {
    setExpandedMenus(prev =>
      prev.includes(label)
        ? prev.filter(m => m !== label)
        : [...prev, label]
    );
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        window.location.href = '/login';
      } else {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/login';
    }
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  return (
    <aside className="w-64 bg-white border-l border-gray-200 fixed right-0 top-16 bottom-0 flex flex-col z-40 md:flex hidden">
      <nav className="p-4 flex-1 overflow-y-auto">
        {menuItems.map((item) => (
          <div key={item.label} className="mb-2">
            {item.children ? (
              <div>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className="w-full px-4 py-2 text-sm font-semibold text-gray-700 flex items-center justify-between hover:bg-gray-50 rounded-lg transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="w-5 h-5 flex-shrink-0 text-gray-500 transition-all" />
                    <span>{item.label}</span>
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform ${expandedMenus.includes(item.label) ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedMenus.includes(item.label) && (
                  <div className="pr-8 mt-1">
                    {item.children.map((child) => {
                      const isOrdersLink = child.href === '/orders';
                      const isReturnsLink = child.href === '/returns'; // ✅ בדיקה אם זה קישור להחזרות
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={(e) => handleNavigation(e, child.href)}
                          className={`
                            flex items-center justify-between px-4 py-2 text-sm rounded-lg transition-all duration-150 group
                            ${isActive(child.href)
                              ? 'bg-gradient-primary text-white font-semibold shadow-sm'
                              : clickedLink === child.href
                              ? 'bg-emerald-50 border border-emerald-200'
                              : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <child.icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive(child.href) ? 'text-white' : 'text-gray-500'}`} />
                            <span>{child.label}</span>
                          </div>
                          {isOrdersLink && unreadOrdersCount > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                              {unreadOrdersCount}
                            </span>
                          )}
                          {isReturnsLink && pendingReturnsCount > 0 && (
                            <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                              {pendingReturnsCount}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={item.href}
                onClick={(e) => handleNavigation(e, item.href)}
                className={`
                  flex items-center justify-between px-4 py-2 text-sm rounded-lg transition-all duration-150 group
                  ${isActive(item.href)
                    ? 'bg-gradient-primary text-white font-semibold shadow-sm'
                    : clickedLink === item.href
                    ? 'bg-emerald-50 border border-emerald-200'
                    : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive(item.href) ? 'text-white' : 'text-gray-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.href === '/notifications' && unreadNotificationsCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                    {unreadNotificationsCount}
                  </span>
                )}
                {item.badge && item.href !== '/notifications' && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                    {item.badge}
                  </span>
                )}
              </Link>
            )}
          </div>
        ))}
      </nav>
      
      {/* Bottom Actions - הגדרות והתנתקות */}
      <div className="p-4 border-t border-gray-200 mt-auto">
        <button
          onClick={handleSettings}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-all group"
        >
          <HiCog className="w-5 h-5 text-gray-500" />
          <span>הגדרות</span>
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all group mt-2"
        >
          <HiLogout className="w-5 h-5 text-red-600" />
          <span>התנתקות</span>
        </button>
      </div>
    </aside>
  );
}

