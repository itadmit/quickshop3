'use client';

import { ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { HiLogout, HiChartBar, HiShoppingCart } from 'react-icons/hi';
import Link from 'next/link';

export default function InfluencerLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/influencers/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        router.push('/influencer/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/influencer/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/influencer/dashboard" className="text-xl font-bold text-gray-900">
                דשבורד משפיענים
              </Link>
              
              <nav className="hidden md:flex items-center gap-6">
                <Link
                  href="/influencer/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/influencer/dashboard'
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <HiChartBar className="w-4 h-4" />
                    <span>דשבורד</span>
                  </div>
                </Link>
                <Link
                  href="/influencer/orders"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/influencer/orders'
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <HiShoppingCart className="w-4 h-4" />
                    <span>הזמנות</span>
                  </div>
                </Link>
              </nav>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
            >
              <HiLogout className="w-4 h-4" />
              <span>התנתקות</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

