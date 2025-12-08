/**
 * Storefront Header from Customizer Settings
 * הדר לפרונט עם הגדרות מהקסטומייזר + עגלת צד אמיתית
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { HiSearch, HiUser, HiMenu, HiX } from 'react-icons/hi';
import { SideCart } from '@/components/storefront/SideCart';
import { SearchBar } from '@/components/storefront/SearchBar';
import { CountrySelector } from '@/components/storefront/CountrySelector';
import { MegaMenu } from '@/components/storefront/MegaMenu';
import { useStoreId } from '@/hooks/useStoreId';
import { SectionSettings } from '@/lib/customizer/types';

interface StorefrontCustomizerHeaderProps {
  section: SectionSettings;
}

export function StorefrontCustomizerHeader({ section }: StorefrontCustomizerHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const params = useParams();
  const storeSlug = params?.storeSlug as string || '';
  const storeId = useStoreId();
  
  const settings = section.settings || {};

  // Build collections from navigation items for MegaMenu
  const collections = settings.navigation?.menu_items
    ?.filter((item: any) => item.url?.includes('/collections/'))
    ?.map((item: any, index: number) => ({
      id: index,
      name: item.label,
      handle: item.url?.split('/collections/')[1] || ''
    })) || [];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/shops/${storeSlug}`} className="flex items-center gap-3">
            {settings.logo?.image_url ? (
              <img 
                src={settings.logo.image_url} 
                alt={settings.logo.text || 'החנות שלי'} 
                className="h-10 w-auto" 
              />
            ) : (
              <h1 className="text-xl font-bold text-gray-900">
                {settings.logo?.text || 'החנות שלי'}
              </h1>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {settings.navigation?.menu_items?.map((item: any, index: number) => (
              <Link
                key={index}
                href={item.url?.startsWith('/') ? `/shops/${storeSlug}${item.url}` : item.url || '#'}
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Search Bar */}
            {settings.search?.enabled !== false && (
              <SearchBar />
            )}
            
            {/* Country Selector */}
            <CountrySelector />

            {/* Side Cart - Real Cart Component */}
            {settings.cart?.enabled !== false && storeId && (
              <SideCart storeId={storeId} />
            )}

            {/* User Account */}
            {settings.user_account?.enabled !== false && (
              <Link
                href={`/shops/${storeSlug}/account`}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="חשבון"
              >
                <HiUser className="w-5 h-5" />
              </Link>
            )}

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
              {settings.navigation?.menu_items?.map((item: any, index: number) => (
                <Link
                  key={index}
                  href={item.url?.startsWith('/') ? `/shops/${storeSlug}${item.url}` : item.url || '#'}
                  className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

