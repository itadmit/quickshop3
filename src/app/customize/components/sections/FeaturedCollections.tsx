'use client';

import React, { useEffect, useState, useRef } from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { useTranslation } from '@/hooks/useTranslation';
import { useStoreId } from '@/hooks/useStoreId';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { HiPhotograph } from 'react-icons/hi';

interface FeaturedCollectionsProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
  editorDevice?: 'desktop' | 'tablet' | 'mobile';
  isPreview?: boolean;
}

interface Collection {
  id: number;
  title: string;
  handle: string;
  image_url: string | null;
  products_count?: number;
}

export function FeaturedCollections({ section, onUpdate, editorDevice, isPreview }: FeaturedCollectionsProps) {
  const settings = section.settings || {};
  const style = section.style || {};
  const { t } = useTranslation('storefront');
  const storeId = useStoreId();
  const params = useParams();
  const storeSlug = params?.storeSlug as string || '';
  
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const loadedRef = useRef(false);

  // Load real collections from API (only in storefront, not in customizer preview)
  useEffect(() => {
    if (isPreview || loadedRef.current || !storeId) return;
    
    const loadCollections = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/storefront/collections?storeId=${storeId}&limit=6`);
        if (response.ok) {
          const data = await response.json();
          setCollections(data.collections || []);
        }
      } catch (error) {
        console.error('Error loading featured collections:', error);
      } finally {
        setLoading(false);
        loadedRef.current = true;
      }
    };
    
    loadCollections();
  }, [storeId, isPreview]);
  
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
            {settings.title || t('sections.featured_collections.title') || 'קטגוריות פופולריות'}
          </h2>
          {settings.show_view_all !== false && (
            <a 
              href={settings.view_all_url || '/collections'}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
            >
              {settings.view_all_text || t('sections.featured_collections.view_all') || 'לכל הקטגוריות'}
              <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          )}
        </div>

        {/* Loading state */}
        {loading && !isPreview && (
          <div className={`grid ${getGridCols()} gap-4 md:gap-6`}>
            {Array.from({ length: getGridItemCount() }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-gray-200 rounded-lg mb-4" />
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Real collections (storefront) or placeholder (preview) */}
        {!loading && (
          <div className={`grid ${getGridCols()} gap-4 md:gap-6`}>
            {(isPreview || collections.length === 0 ? 
              Array.from({ length: getGridItemCount() }, (_, i) => ({ id: i + 1, isPlaceholder: true })) : 
              collections.slice(0, getGridItemCount())
            ).map((item: any, index: number) => {
              const isPlaceholder = item.isPlaceholder;
              const collection = isPlaceholder ? null : item as Collection;
              const collectionUrl = collection ? `/shops/${storeSlug}/categories/${collection.handle}` : '#';

              return (
                <Link 
                  href={collectionUrl}
                  key={collection?.id || index} 
                  className="group cursor-pointer block"
                >
                  <div className="relative aspect-[4/3] bg-gray-200 rounded-lg overflow-hidden mb-3 md:mb-4 shadow-sm group-hover:shadow-md transition-all">
                    {collection?.image_url ? (
                      <img 
                        src={collection.image_url} 
                        alt={collection.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-100">
                        <HiPhotograph className="w-12 h-12 opacity-20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <div className={`flex flex-col ${flexAlignClass} ${contentAlignClass}`}>
                    <h3 
                      className="text-lg md:text-xl font-bold mb-1 group-hover:text-gray-700 transition-colors" 
                      style={{ color: textColor }}
                    >
                      {collection?.title || t('sections.featured_collections.sample_collection', { number: index + 1 }) || `קטגוריה ${index + 1}`}
                    </h3>
                    {settings.show_description !== false && collection?.products_count !== undefined && (
                      <p className="text-gray-500 text-xs md:text-sm">
                        {collection.products_count} {t('product.items') || 'מוצרים'}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
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
