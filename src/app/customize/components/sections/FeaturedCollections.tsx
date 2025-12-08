'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';

interface FeaturedCollectionsProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
}

export function FeaturedCollections({ section, onUpdate }: FeaturedCollectionsProps) {
  const settings = section.settings || {};

  return (
    <div className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          {settings.title || 'קטגוריות פופולריות'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">קטגוריה {i}</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">שם הקטגוריה {i}</h3>
                <p className="text-gray-600">תיאור קצר של הקטגוריה</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
