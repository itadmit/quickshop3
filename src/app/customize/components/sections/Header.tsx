'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { HiSearch, HiShoppingCart, HiUser } from 'react-icons/hi';

interface HeaderProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
}

export function Header({ section, onUpdate }: HeaderProps) {
  const settings = section.settings || {};

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
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
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {settings.navigation?.menu_items?.map((item: any, index: number) => (
              <a
                key={index}
                href={item.url}
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {settings.search?.enabled && (
              <button 
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="חיפוש"
              >
                <HiSearch className="w-5 h-5" />
              </button>
            )}
            {settings.cart?.enabled && (
              <button 
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="עגלה"
              >
                <HiShoppingCart className="w-5 h-5" />
              </button>
            )}
            {settings.user_account?.enabled && (
              <button 
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="חשבון"
              >
                <HiUser className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
