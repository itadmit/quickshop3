'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';

interface FeaturedCollectionsProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
  editorDevice?: 'desktop' | 'tablet' | 'mobile';
}

export function FeaturedCollections({ section, onUpdate, editorDevice }: FeaturedCollectionsProps) {
  const settings = section.settings || {};
  const style = section.style || {};
  
  const itemsPerRow = settings.items_per_row || 3;
  const sliderItemsDesktop = settings.slider_items_desktop || 4.5;
  const sliderItemsMobile = settings.slider_items_mobile || 1.5;

  // Calculate item width for slider based on visible items
  const getSliderItemWidth = (visibleItems: number) => {
    // Account for gaps (24px gap = 1.5rem)
    const gapSize = 24;
    const totalGaps = (visibleItems - 1) * gapSize;
    return `calc((100% - ${totalGaps}px) / ${visibleItems})`;
  };

  const getGridCols = () => {
    // If in editor with mobile/tablet view, force mobile layout
    if (editorDevice === 'mobile' || editorDevice === 'tablet') {
      return 'grid-cols-2';
    }
    // Desktop: based on settings (with responsive fallback for actual storefront)
    switch (itemsPerRow) {
      case 2: return 'grid-cols-2 md:grid-cols-2';
      case 3: return 'grid-cols-2 md:grid-cols-3';
      case 4: return 'grid-cols-2 md:grid-cols-4';
      case 5: return 'grid-cols-2 md:grid-cols-5';
      case 6: return 'grid-cols-2 md:grid-cols-3'; // 6 items = 2 rows of 3
      default: return 'grid-cols-2 md:grid-cols-3';
    }
  };

  // Number of items to show in grid
  const getGridItemCount = () => {
    if (itemsPerRow === 6) return 6; // 2 rows of 3
    return itemsPerRow;
  };

  // Title alignment (separate from content)
  const titleAlignClass = settings.title_align === 'left' ? 'text-left' : settings.title_align === 'center' ? 'text-center' : 'text-right';
  
  // Content alignment (for collection cards)
  const contentAlignClass = settings.content_align === 'left' ? 'text-left' : settings.content_align === 'center' ? 'text-center' : 'text-right';
  const flexAlignClass = settings.content_align === 'left' ? 'items-end' : settings.content_align === 'center' ? 'items-center' : 'items-start';

  const fontFamily = style.typography?.font_family || '"Noto Sans Hebrew", sans-serif';
  const textColor = style.typography?.color || '#111827';

  return (
    <div className="w-full py-8 md:py-12" style={{ fontFamily }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Title and View All Link */}
        <div className="flex items-center justify-between mb-8 md:mb-12">
          <h2 
            className={`text-2xl md:text-3xl font-bold`}
            style={{ color: textColor }}
          >
            {settings.title || 'קטגוריות פופולריות'}
          </h2>
          {settings.show_view_all !== false && (
            <a 
              href={settings.view_all_url || '/collections'}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
            >
              {settings.view_all_text || 'לכל הקטגוריות'}
              <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          )}
        </div>

        {(settings.display_type === 'slider' || settings.display_type === 'carousel') ? (
          <>
            {/* Desktop Slider */}
            <div className="hidden md:block overflow-x-auto scrollbar-hide" style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
              <div className="flex gap-6 pb-4" style={{ width: 'max-content' }}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div 
                      key={i} 
                      className="group cursor-pointer flex-shrink-0"
                      style={{ 
                        width: getSliderItemWidth(sliderItemsDesktop),
                        minWidth: '200px',
                        scrollSnapAlign: 'start'
                      }}
                    >
                      <div className="relative aspect-[4/3] bg-gray-200 rounded-lg overflow-hidden mb-4 shadow-sm group-hover:shadow-md transition-all">
                         <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-100">
                            <span>קטגוריה {i}</span>
                         </div>
                         <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      
                      <div className={`flex flex-col ${flexAlignClass} ${contentAlignClass}`}>
                        <h3 className="text-xl font-bold mb-1 group-hover:text-blue-600 transition-colors" style={{ color: textColor }}>
                            שם הקטגוריה {i}
                        </h3>
                        {settings.show_description !== false && (
                            <p className="text-gray-500 text-sm">תיאור קצר של הקטגוריה</p>
                        )}
                      </div>
                    </div>
                ))}
              </div>
            </div>

            {/* Mobile Slider */}
            <div className="md:hidden overflow-x-auto scrollbar-hide" style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
              <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div 
                      key={i} 
                      className="group cursor-pointer flex-shrink-0"
                      style={{ 
                        width: getSliderItemWidth(sliderItemsMobile),
                        minWidth: '200px',
                        scrollSnapAlign: 'start'
                      }}
                    >
                      <div className="relative aspect-[4/3] bg-gray-200 rounded-lg overflow-hidden mb-3 shadow-sm">
                         <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-100">
                            <span>קטגוריה {i}</span>
                         </div>
                      </div>
                      
                      <div className={`flex flex-col ${flexAlignClass} ${contentAlignClass}`}>
                        <h3 className="text-lg font-bold mb-1" style={{ color: textColor }}>
                            שם הקטגוריה {i}
                        </h3>
                        {settings.show_description !== false && (
                            <p className="text-gray-500 text-xs">תיאור קצר של הקטגוריה</p>
                        )}
                      </div>
                    </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className={`grid ${getGridCols()} gap-4 md:gap-6`}>
            {Array.from({ length: getGridItemCount() }, (_, i) => i + 1).map((i) => (
              <div key={i} className="group cursor-pointer">
                <div className="relative aspect-[4/3] bg-gray-200 rounded-lg overflow-hidden mb-3 md:mb-4 shadow-sm group-hover:shadow-md transition-all">
                   <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-100">
                      <span>קטגוריה {i}</span>
                   </div>
                   <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <div className={`flex flex-col ${flexAlignClass} ${contentAlignClass}`}>
                  <h3 className="text-lg md:text-xl font-bold mb-1 group-hover:text-blue-600 transition-colors" style={{ color: textColor }}>
                      שם הקטגוריה {i}
                  </h3>
                  {settings.show_description !== false && (
                      <p className="text-gray-500 text-xs md:text-sm">תיאור קצר של הקטגוריה</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
