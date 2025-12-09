'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { HiStar, HiShoppingBag } from 'react-icons/hi';

interface FeaturedProductsProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
  editorDevice?: 'desktop' | 'tablet' | 'mobile';
}

export function FeaturedProducts({ section, onUpdate, editorDevice }: FeaturedProductsProps) {
  const settings = section.settings || {};
  const style = section.style || {};

  // Responsive items per row logic
  const getItemsPerRow = () => {
    if (editorDevice === 'mobile' || editorDevice === 'tablet') {
        return settings.items_per_row_mobile || 2;
    }
    return settings.items_per_row || 4;
  };

  const itemsPerRow = getItemsPerRow();
  
  // Number of products to show (mobile shows less)
  const getProductsToShow = () => {
    if (editorDevice === 'mobile' || editorDevice === 'tablet') {
      return settings.products_count_mobile || 2; // Default 2 products on mobile
    }
    return settings.products_count || itemsPerRow * 2; // Default 2 rows on desktop
  };
  
  const productsToShow = getProductsToShow();
  
  const getGridCols = () => {
    // If in editor with mobile/tablet view, force mobile layout (2 columns for products)
    if (editorDevice === 'mobile' || editorDevice === 'tablet') {
      const mobileColsSetting = settings.items_per_row_mobile || 2;
      return mobileColsSetting >= 2 ? 'grid-cols-2' : 'grid-cols-1';
    }
    
    // Desktop view or actual storefront (with responsive CSS)
    const mobileColsSetting = settings.items_per_row_mobile || 2;
    const mobileCols = mobileColsSetting >= 2 ? 'grid-cols-2' : 'grid-cols-1';
    
    let desktopCols = 'md:grid-cols-4';
    switch (settings.items_per_row) {
      case 2: desktopCols = 'md:grid-cols-2'; break;
      case 3: desktopCols = 'md:grid-cols-3'; break;
      case 5: desktopCols = 'md:grid-cols-5'; break;
      default: desktopCols = 'md:grid-cols-4';
    }

    return `${mobileCols} ${desktopCols}`;
  };

  // Title alignment (separate from content)
  const titleAlignClass = settings.title_align === 'left' ? 'text-left' : settings.title_align === 'center' ? 'text-center' : 'text-right';
  
  // Content alignment (for product cards)
  const contentAlignClass = settings.content_align === 'left' ? 'text-left' : settings.content_align === 'center' ? 'text-center' : 'text-right';
  const flexAlignClass = settings.content_align === 'left' ? 'items-end' : settings.content_align === 'center' ? 'items-center' : 'items-start';
  
  const fontFamily = style.typography?.font_family || '"Noto Sans Hebrew", sans-serif';
  const textColor = style.typography?.color || '#111827';

  return (
    <div className="w-full" style={{ fontFamily }}>
      <div className="container mx-auto px-4">
        {settings.title && (
            <h2 
                className={`text-3xl font-bold mb-12 text-gray-900 ${titleAlignClass}`}
                style={{ color: textColor }}
            >
            {settings.title}
            </h2>
        )}

        {settings.display_type === 'carousel' ? (
          <div className="overflow-x-auto scrollbar-hide" style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
            <div className="flex gap-8 pb-4" style={{ width: 'max-content' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].slice(0, productsToShow).map((i) => {
                const cardWidth = `calc((100vw - 2rem) / ${Math.min(itemsPerRow, 4)})`;
                return (
            <div 
              key={i} 
              className="group flex flex-col flex-shrink-0"
              style={{ 
                width: settings.display_type === 'carousel' ? cardWidth : undefined,
                scrollSnapAlign: settings.display_type === 'carousel' ? 'start' : undefined
              }}
            >
              <div className="relative aspect-[3/4] bg-white border border-gray-100 rounded-lg overflow-hidden mb-4 shadow-sm group-hover:shadow-md transition-shadow">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-100">
                   <HiShoppingBag className="w-12 h-12 opacity-30" />
                </div>
                {settings.show_badges && (
                    <div className="absolute top-2 right-2 bg-black text-white px-2 py-1 text-xs font-bold uppercase tracking-wider rounded-sm">
                        חדש
                    </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Quick Add Button (Optional visual enhancement) */}
                <div className="absolute bottom-4 left-0 right-0 px-4 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                    <button className="w-full bg-white text-black py-2 rounded shadow text-sm font-medium hover:bg-gray-100">
                        הוסף לסל
                    </button>
                </div>
              </div>
              
              <div className={`space-y-1 flex flex-col ${flexAlignClass} ${contentAlignClass}`}>
                <h3 
                    className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors"
                    style={{ color: textColor }}
                >
                    מוצר לדוגמה {i}
                </h3>
                
                {settings.show_rating && (
                    <div className="flex items-center text-yellow-400 text-sm">
                        <HiStar className="w-4 h-4 fill-current" />
                        <span className="text-gray-400 mr-1 text-xs">4.8</span>
                    </div>
                )}

                {settings.show_price && (
                    <div className="flex items-center gap-2">
                        <p className="text-gray-900 font-medium">₪199.90</p>
                        <p className="text-gray-400 text-sm line-through">₪249.90</p>
                    </div>
                )}
              </div>
            </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className={`grid ${getGridCols()} gap-4 md:gap-8`}>
            {/* Placeholder products */}
            {[1, 2, 3, 4, 5, 6, 7, 8].slice(0, productsToShow).map((i) => (
              <div key={i} className="group flex flex-col">
                <div className="relative aspect-[3/4] bg-white border border-gray-100 rounded-lg overflow-hidden mb-4 shadow-sm group-hover:shadow-md transition-shadow">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-200 bg-gray-50">
                     <HiShoppingBag className="w-12 h-12 opacity-20" />
                  </div>
                  {settings.show_badges && (
                      <div className="absolute top-2 right-2 bg-black text-white px-2 py-1 text-xs font-bold uppercase tracking-wider rounded-sm">
                          חדש
                      </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Quick Add Button (Optional visual enhancement) */}
                  <div className="absolute bottom-4 left-0 right-0 px-4 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                      <button className="w-full bg-white text-black py-2 rounded shadow text-sm font-medium hover:bg-gray-100">
                          הוסף לסל
                      </button>
                  </div>
                </div>
                
                <div className={`space-y-1 flex flex-col ${flexAlignClass} ${contentAlignClass}`}>
                  <h3 
                      className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors"
                      style={{ color: textColor }}
                  >
                      מוצר לדוגמה {i}
                  </h3>
                  
                  {settings.show_rating && (
                      <div className="flex items-center text-yellow-400 text-sm">
                          <HiStar className="w-4 h-4 fill-current" />
                          <span className="text-gray-400 mr-1 text-xs">4.8</span>
                      </div>
                  )}

                  {settings.show_price && (
                      <div className="flex items-center gap-2">
                          <p className="text-gray-900 font-medium">₪199.90</p>
                          <p className="text-gray-400 text-sm line-through">₪249.90</p>
                      </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
