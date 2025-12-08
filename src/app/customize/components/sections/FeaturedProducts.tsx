'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { HiStar, HiShoppingBag } from 'react-icons/hi';

interface FeaturedProductsProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
}

export function FeaturedProducts({ section, onUpdate }: FeaturedProductsProps) {
  const settings = section.settings || {};
  const itemsPerRow = settings.items_per_row || 4;
  
  const getGridCols = () => {
    switch (itemsPerRow) {
      case 2: return 'md:grid-cols-2';
      case 3: return 'md:grid-cols-3';
      case 5: return 'md:grid-cols-5';
      default: return 'md:grid-cols-4';
    }
  };

  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        {settings.title && (
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            {settings.title}
            </h2>
        )}

        <div className={`grid grid-cols-1 ${getGridCols()} gap-8`}>
          {/* Placeholder products */}
          {[1, 2, 3, 4, 5, 6, 7, 8].slice(0, itemsPerRow * 2).map((i) => (
            <div key={i} className="group">
              <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-4">
                <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                   <HiShoppingBag className="w-12 h-12 opacity-20" />
                </div>
                {settings.show_badges && (
                    <div className="absolute top-2 right-2 bg-white px-2 py-1 text-xs font-bold uppercase tracking-wider rounded-sm shadow-sm">
                        חדש
                    </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <div className="space-y-1">
                <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    מוצר לדוגמה {i}
                </h3>
                
                {settings.show_rating && (
                    <div className="flex items-center text-yellow-400 text-sm">
                        <HiStar className="w-4 h-4 fill-current" />
                        <span className="text-gray-400 mr-1 text-xs">4.8</span>
                    </div>
                )}

                {settings.show_price && (
                    <p className="text-gray-900 font-medium">₪199.90</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
