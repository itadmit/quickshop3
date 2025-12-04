'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { HiMenu, HiX, HiSearch } from 'react-icons/hi';
import { SideCart } from '@/components/storefront/SideCart';

interface StorefrontHeaderProps {
  storeName?: string;
  storeLogo?: string;
}

export function StorefrontHeader({ storeName = 'החנות שלי', storeLogo }: StorefrontHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const params = useParams();
  const storeSlug = params?.storeSlug as string || '';

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/${storeSlug}`} className="flex items-center gap-3">
            {storeLogo ? (
              <img src={storeLogo} alt={storeName} className="h-10 w-auto" />
            ) : (
              <h1 className="text-xl font-bold text-gray-900">{storeName}</h1>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href={`/${storeSlug}`} className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
              בית
            </Link>
            <Link href={`/${storeSlug}/collections`} className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
              קטגוריות
            </Link>
            <Link href={`/${storeSlug}/products`} className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
              כל המוצרים
            </Link>
            <Link href={`/${storeSlug}/blog`} className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
              בלוג
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <button className="hidden md:flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors">
              <HiSearch className="w-5 h-5 text-gray-600" />
            </button>

            {/* Side Cart */}
            <SideCart storeId={1} /> {/* TODO: Get from props/context */}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <HiX className="w-5 h-5 text-gray-600" />
              ) : (
                <HiMenu className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col gap-4">
              <Link
                href={`/${storeSlug}`}
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                בית
              </Link>
              <Link
                href={`/${storeSlug}/collections`}
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                קטגוריות
              </Link>
              <Link
                href={`/${storeSlug}/products`}
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                כל המוצרים
              </Link>
              <Link
                href={`/${storeSlug}/blog`}
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                בלוג
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

