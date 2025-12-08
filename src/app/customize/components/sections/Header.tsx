'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';

interface HeaderProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
}

export function Header({ section, onUpdate }: HeaderProps) {
  const settings = section.settings || {};

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <div className="text-2xl font-bold text-gray-900">
              {settings.logo?.text || 'החנות שלי'}
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8 rtl:space-x-reverse">
            {settings.navigation?.menu_items?.map((item: any, index: number) => (
              <a
                key={index}
                href={item.url}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            {settings.search?.enabled && (
              <button className="text-gray-600 hover:text-gray-900">
                🔍
              </button>
            )}
            {settings.cart?.enabled && (
              <button className="text-gray-600 hover:text-gray-900">
                🛒
              </button>
            )}
            {settings.user_account?.enabled && (
              <button className="text-gray-600 hover:text-gray-900">
                👤
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
