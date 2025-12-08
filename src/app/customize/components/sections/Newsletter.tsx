'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';

interface NewsletterProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
}

export function Newsletter({ section, onUpdate }: NewsletterProps) {
  const settings = section.settings || {};

  return (
    <div className="py-16 bg-gray-900 text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">הישאר מעודכן</h2>
        <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
          הירשם לניוזלטר שלנו וקבל עדכונים על מוצרים חדשים והנחות מיוחדות
        </p>
        <div className="max-w-md mx-auto flex gap-4">
          <input
            type="email"
            placeholder="הכנס את כתובת המייל"
            className="flex-1 px-4 py-3 rounded-lg text-gray-900"
          />
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            הירשם
          </button>
        </div>
      </div>
    </div>
  );
}
