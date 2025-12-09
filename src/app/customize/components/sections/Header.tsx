'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { HiSearch, HiShoppingCart, HiUser, HiMenu } from 'react-icons/hi';

export type DeviceType = 'desktop' | 'tablet' | 'mobile';

interface HeaderProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
  editorDevice?: DeviceType;
}

export function Header({ section, onUpdate, editorDevice = 'desktop' }: HeaderProps) {
  const settings = section.settings || {};
  const isMobileView = editorDevice === 'mobile' || editorDevice === 'tablet';

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {settings.logo?.image_url ? (
              <img 
                src={settings.logo.image_url} 
                alt={settings.logo.text || 'החנות שלי'} 
                className="h-8 w-auto" 
              />
            ) : (
              <h1 className={`font-bold text-gray-900 ${isMobileView ? 'text-base' : 'text-xl'}`}>
                {settings.logo?.text || 'החנות שלי'}
              </h1>
            )}
          </div>

          {/* Navigation - Only on Desktop */}
          {!isMobileView && (
            <nav className="flex items-center gap-6">
              {settings.navigation?.menu_items?.slice(0, 5).map((item: any, index: number) => (
                <a
                  key={index}
                  href={item.url}
                  className="text-gray-700 hover:text-gray-900 font-medium transition-colors text-sm"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {settings.search?.enabled !== false && (
              <button 
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="חיפוש"
              >
                <HiSearch className="w-5 h-5" />
              </button>
            )}
            {settings.cart?.enabled !== false && (
              <button 
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="עגלה"
              >
                <HiShoppingCart className="w-5 h-5" />
              </button>
            )}
            {!isMobileView && settings.user_account?.enabled !== false && (
              <button 
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="חשבון"
              >
                <HiUser className="w-5 h-5" />
              </button>
            )}
            {/* Mobile Menu Icon */}
            {isMobileView && (
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <HiMenu className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
