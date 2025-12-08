'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';

interface ImageWithTextProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
}

export function ImageWithText({ section, onUpdate }: ImageWithTextProps) {
  const settings = section.settings || {};
  const blocks = section.blocks || [];

  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">תמונה</span>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-3xl font-bold mb-6">כותרת הסקשן</h2>
            <p className="text-gray-600 mb-6">
              תוכן הסקשן כאן. זהו טקסט דמה שמתאר את התוכן של הסקשן.
            </p>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
              קרא עוד
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
