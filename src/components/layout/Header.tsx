'use client';

import { HiShoppingCart, HiEye, HiBell, HiSearch, HiChevronDown, HiOfficeBuilding, HiMenu, HiCog, HiLogout, HiShoppingBag } from 'react-icons/hi';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { NotificationsDrawer } from './NotificationsDrawer';

export function Header() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // TODO: לקבל מהקונטקסט/API את החנויות שהמשתמש מקושר אליהן
  const userStores = [
    { id: 1, name: 'החנות שלי' },
    // אם יש יותר מחנות אחת, יוצג switcher
    // { id: 2, name: 'חנות נוספת' }, // דוגמה - אם יש יותר מחנות אחת
  ];
  const currentStore = userStores[0];
  const [showStoreSwitcher, setShowStoreSwitcher] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  // Close switcher when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setShowStoreSwitcher(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showStoreSwitcher || showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStoreSwitcher, showUserMenu]);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // Important: include cookies in request
      });
      
      if (response.ok) {
        // Use window.location for full page reload so middleware can see the cleared cookie
        window.location.href = '/login';
      } else {
        // Even if API fails, redirect to login
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Even on error, redirect to login
      window.location.href = '/login';
    }
  };

  const handleSettings = () => {
    // TODO: Navigate to settings page
    setShowUserMenu(false);
    router.push('/settings');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-4 md:px-6 flex items-center justify-between fixed top-0 left-0 right-0 z-50">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
      >
        <HiMenu className="w-6 h-6 text-gray-600" />
      </button>

      {/* Logo & Store Switcher */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl md:text-2xl font-logo text-gray-900">Quick Shop</h1>
        {userStores.length > 1 && (
          <div className="relative" ref={switcherRef}>
            <button
              onClick={() => setShowStoreSwitcher(!showStoreSwitcher)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <HiOfficeBuilding className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700">{currentStore.name}</span>
              <HiChevronDown className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${showStoreSwitcher ? 'rotate-180' : ''}`} />
            </button>
            {showStoreSwitcher && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                {userStores.map((store) => (
                  <button
                    key={store.id}
                    onClick={() => {
                      // TODO: עדכון החנות הנוכחית
                      setShowStoreSwitcher(false);
                    }}
                    className={`w-full text-right px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                      store.id === currentStore.id ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    {store.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search Bar - Hidden on mobile */}
      <div className="hidden md:flex flex-1 max-w-2xl mx-8">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="חיפוש מוצרים, הזמנות, לקוחות, תוספים..."
            className="w-full px-4 py-2 pr-12 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <HiSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 flex-shrink-0" />
        </div>
      </div>

      {/* Actions & Profile */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Marketplace (Coming Soon) */}
        <button 
          className="p-2 hover:bg-gray-100 rounded-lg transition-all group hidden md:flex md:items-center md:gap-2 relative"
          title="מרקט פלייס - בקרוב"
        >
          <HiShoppingBag className="w-6 h-6 text-gray-600 group-hover:text-primary-green transition-colors" />
          <span className="text-xs text-gray-500 hidden lg:block">בקרוב</span>
        </button>
        
        {/* View Store */}
        <button 
          onClick={() => {
            // TODO: Get store slug from context/API
            const storeSlug = 'nike'; // This should come from user context
            window.open(`/${storeSlug}`, '_blank');
          }}
          className="p-2 hover:bg-gray-100 rounded-lg transition-all group hidden md:block"
          title="צפייה בחנות"
        >
          <HiEye className="w-6 h-6 text-gray-600 group-hover:text-primary-green transition-colors" />
        </button>
        
        {/* Notifications */}
        <button 
          onClick={() => setShowNotifications(true)}
          className="p-2 hover:bg-gray-100 rounded-lg relative transition-all group"
          title="עדכונים"
        >
          <HiBell className="w-6 h-6 text-gray-600 group-hover:text-primary-green transition-colors" />
          <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full"></span>
        </button>
        {/* Desktop: User Profile with Dropdown */}
        <div className="hidden md:flex items-center gap-3 pr-4 border-r border-gray-200 relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
              יא
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">יוגב אביטן</div>
              <div className="text-xs text-gray-500">סופר אדמין</div>
            </div>
            <HiChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>
          {showUserMenu && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <button
                onClick={handleSettings}
                className="w-full text-right px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg transition-colors flex items-center gap-3"
              >
                <HiCog className="w-5 h-5 text-gray-500" />
                <span>הגדרות</span>
              </button>
              <div className="border-t border-gray-200"></div>
              <button
                onClick={handleLogout}
                className="w-full text-right px-4 py-3 text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg transition-colors flex items-center gap-3"
              >
                <HiLogout className="w-5 h-5 text-red-600" />
                <span>התנתקות</span>
              </button>
            </div>
          )}
        </div>
        {/* Mobile: User Avatar with Dropdown */}
        <div className="md:hidden relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold hover:bg-green-600 transition-colors"
          >
            יא
          </button>
          {showUserMenu && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="text-sm font-semibold text-gray-900">יוגב אביטן</div>
                <div className="text-xs text-gray-500">סופר אדמין</div>
              </div>
              <button
                onClick={handleSettings}
                className="w-full text-right px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
              >
                <HiCog className="w-5 h-5 text-gray-500" />
                <span>הגדרות</span>
              </button>
              <div className="border-t border-gray-200"></div>
              <button
                onClick={handleLogout}
                className="w-full text-right px-4 py-3 text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg transition-colors flex items-center gap-3"
              >
                <HiLogout className="w-5 h-5 text-red-600" />
                <span>התנתקות</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notifications Drawer */}
      <NotificationsDrawer 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </header>
  );
}

