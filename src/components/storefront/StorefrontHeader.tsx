'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { HiShoppingCart, HiUser, HiMenu } from 'react-icons/hi';
import { useState } from 'react';

interface StorefrontHeaderProps {
  storeName: string;
  storeLogo?: string;
  cartItemCount?: number;
  isLoggedIn?: boolean;
}

export function StorefrontHeader({ 
  storeName, 
  storeLogo, 
  cartItemCount = 0,
  isLoggedIn = false 
}: StorefrontHeaderProps) {
  const params = useParams();
  const storeSlug = params.storeSlug as string;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            href={`/shops/${storeSlug}`}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            {storeLogo && (
              <img 
                src={storeLogo} 
                alt={storeName} 
                className="h-10 w-10 object-contain"
              />
            )}
            <span className="text-xl font-bold text-gray-900">{storeName}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href={`/shops/${storeSlug}/products`}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              מוצרים
            </Link>
            <Link 
              href={`/shops/${storeSlug}/categories`}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              קטגוריות
            </Link>
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-4">
            {/* Cart */}
            <Link 
              href={`/shops/${storeSlug}/cart`}
              className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <HiShoppingCart className="w-6 h-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white text-xs rounded-full flex items-center justify-center">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Link>

            {/* Account */}
            <Link 
              href={`/shops/${storeSlug}/account`}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <HiUser className="w-6 h-6" />
            </Link>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <HiMenu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col gap-2">
              <Link 
                href={`/shops/${storeSlug}/products`}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                מוצרים
              </Link>
              <Link 
                href={`/shops/${storeSlug}/categories`}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                קטגוריות
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
