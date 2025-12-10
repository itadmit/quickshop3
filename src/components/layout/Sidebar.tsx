'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { MenuIcons } from '@/components/icons/MenuIcons';
import { IconType } from 'react-icons';
import { HiCog, HiLogout } from 'react-icons/hi';

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
      { label: 'תשלומים', href: '/payments', icon: MenuIcons.payments },
      { label: 'משלוחים', href: '/shipping', icon: MenuIcons.shipping },
    ],
  },
  {
    label: 'שיווק והנחות',
    href: '#',
    icon: MenuIcons.discounts,
    children: [
      { label: 'הנחות אוטומטיות', href: '/automatic-discounts', icon: MenuIcons.discounts },
      { label: 'קופונים', href: '/discounts', icon: MenuIcons.coupons },
      { label: 'משפיענים', href: '/marketing/influencers', icon: MenuIcons.customers },
      { label: 'מועדון לקוחות', href: '/loyalty', icon: MenuIcons.loyalty },
      { label: 'כרטיסי מתנה', href: '/gift-cards', icon: MenuIcons.giftCards },
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
    label: 'אינטגרציות',
    href: '#',
    icon: MenuIcons.webhooks,
    children: [
      { label: 'Webhooks', href: '/webhooks', icon: MenuIcons.webhooks },
      { label: 'מרקטפלייס תוספים', href: '/settings/plugins', icon: MenuIcons.plugins },
      { label: 'אוטומציות', href: '/automations', icon: MenuIcons.automations },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['מכירות', 'שיווק והנחות', 'תוכן', 'שירות לקוחות', 'אינטגרציות']);
  const [clickedLink, setClickedLink] = useState<string | null>(null);
  const [unreadOrdersCount, setUnreadOrdersCount] = useState<number>(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);

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

  // Load unread orders count
  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const response = await fetch('/api/orders/unread-count', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setUnreadOrdersCount(data.count || 0);
        }
      } catch (error) {
        console.error('Error loading unread orders count:', error);
      }
    };

    loadUnreadCount();
    // Refresh every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    
    // Listen for order marked as read event
    const handleOrderMarkedAsRead = () => {
      loadUnreadCount();
    };
    window.addEventListener('orderMarkedAsRead', handleOrderMarkedAsRead);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('orderMarkedAsRead', handleOrderMarkedAsRead);
    };
  }, [pathname]);

  // Load unread notifications count
  useEffect(() => {
    const loadUnreadNotificationsCount = async () => {
      try {
        const response = await fetch('/api/notifications/unread-count', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setUnreadNotificationsCount(data.count || 0);
        }
      } catch (error) {
        console.error('Error loading unread notifications count:', error);
      }
    };

    loadUnreadNotificationsCount();
    // Refresh every 30 seconds
    const interval = setInterval(loadUnreadNotificationsCount, 30000);
    
    // Listen for notification marked as read event
    const handleNotificationMarkedAsRead = () => {
      loadUnreadNotificationsCount();
    };
    window.addEventListener('notificationMarkedAsRead', handleNotificationMarkedAsRead);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('notificationMarkedAsRead', handleNotificationMarkedAsRead);
    };
  }, [pathname]);
  
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

