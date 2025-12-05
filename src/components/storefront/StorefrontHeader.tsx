'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { HiMenu, HiX } from 'react-icons/hi';
import { SideCart } from '@/components/storefront/SideCart';
import { SearchBar } from '@/components/storefront/SearchBar';
import { CountrySelector } from '@/components/storefront/CountrySelector';
import { MegaMenu } from '@/components/storefront/MegaMenu';
import { useTranslation } from '@/hooks/useTranslation';
import { TextSkeleton } from '@/components/ui/Skeleton';
import { useStoreId } from '@/hooks/useStoreId';

interface Collection {
  id: number;
  name: string;
  handle: string;
  children?: Collection[];
}

interface StorefrontHeaderProps {
  storeName?: string;
  storeLogo?: string;
  collections?: Collection[];
}

export function StorefrontHeader({ storeName = 'החנות שלי', storeLogo, collections = [] }: StorefrontHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const params = useParams();
  const storeSlug = params?.storeSlug as string || '';
  const storeId = useStoreId(); // Get storeId dynamically from URL
  
  // Translations
  const { t, loading: translationsLoading } = useTranslation('storefront');

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/shops/${storeSlug}`} className="flex items-center gap-3">
            {storeLogo ? (
              <img src={storeLogo} alt={storeName} className="h-10 w-auto" />
            ) : (
              <h1 className="text-xl font-bold text-gray-900">{storeName}</h1>
            )}
          </Link>

          {/* Desktop Navigation with Mega Menu */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href={`/shops/${storeSlug}`} className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
              {translationsLoading ? (
                <TextSkeleton width="w-12" height="h-4" />
              ) : (
                t('navigation.home')
              )}
            </Link>
            {collections.length > 0 && (
              <MegaMenu categories={collections} />
            )}
            <Link href={`/shops/${storeSlug}/collections`} className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
              {translationsLoading ? (
                <TextSkeleton width="w-16" height="h-4" />
              ) : (
                t('navigation.collections')
              )}
            </Link>
            <Link href={`/shops/${storeSlug}/products`} className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
              {translationsLoading ? (
                <TextSkeleton width="w-16" height="h-4" />
              ) : (
                t('navigation.products')
              )}
            </Link>
            <Link href={`/shops/${storeSlug}/blog`} className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
              {translationsLoading ? (
                <TextSkeleton width="w-12" height="h-4" />
              ) : (
                t('navigation.blog')
              )}
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <SearchBar />
            
            {/* Country Selector */}
            <CountrySelector />

            {/* Side Cart */}
            {storeId && <SideCart storeId={storeId} />}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="תפריט"
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
                href={`/shops/${storeSlug}`}
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {translationsLoading ? (
                  <TextSkeleton width="w-12" height="h-4" />
                ) : (
                  t('navigation.home')
                )}
              </Link>
              <Link
                href={`/shops/${storeSlug}/collections`}
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {translationsLoading ? (
                  <TextSkeleton width="w-16" height="h-4" />
                ) : (
                  t('navigation.collections')
                )}
              </Link>
              <Link
                href={`/shops/${storeSlug}/products`}
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {translationsLoading ? (
                  <TextSkeleton width="w-16" height="h-4" />
                ) : (
                  t('navigation.products')
                )}
              </Link>
              <Link
                href={`/shops/${storeSlug}/blog`}
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {translationsLoading ? (
                  <TextSkeleton width="w-12" height="h-4" />
                ) : (
                  t('navigation.blog')
                )}
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
