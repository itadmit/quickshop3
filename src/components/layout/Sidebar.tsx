'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
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
  { label: 'התראות', href: '/notifications', icon: MenuIcons.notifications, badge: 3 },
  {
    label: 'מכירות',
    href: '#',
    icon: MenuIcons.sales,
    children: [
      { label: 'מוצרים', href: '/products', icon: MenuIcons.products },
      { label: 'קטגוריות', href: '/categories', icon: MenuIcons.categories },
      { label: 'הזמנות', href: '/orders', icon: MenuIcons.orders },
      { label: 'אנשי קשר', href: '/customers', icon: MenuIcons.customers },
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
      { label: 'הנחות', href: '/discounts', icon: MenuIcons.discounts },
      { label: 'קופונים', href: '/coupons', icon: MenuIcons.coupons },
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
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['מכירות', 'שיווק והנחות', 'תוכן', 'שירות לקוחות']);

  const isActive = (href: string) => pathname === href;
  
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
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`
                          flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all group
                          ${isActive(child.href)
                            ? 'bg-gradient-primary text-white font-semibold shadow-sm'
                            : 'text-gray-700 hover:bg-gray-50'
                          }
                        `}
                      >
                        <child.icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive(child.href) ? 'text-white' : 'text-gray-500'}`} />
                        <span>{child.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={item.href}
                className={`
                  flex items-center justify-between px-4 py-2 text-sm rounded-lg transition-all group
                  ${isActive(item.href)
                    ? 'bg-gradient-primary text-white font-semibold shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive(item.href) ? 'text-white' : 'text-gray-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
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

