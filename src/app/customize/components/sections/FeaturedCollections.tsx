'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { useTranslation } from '@/hooks/useTranslation';
import { useStoreId } from '@/hooks/useStoreId';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { HiPhotograph } from 'react-icons/hi';
import { areSectionsEqual } from './sectionMemoUtils';

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
  parent_id?: number | null;
}

function FeaturedCollectionsComponent({ section, onUpdate, editorDevice, isPreview }: FeaturedCollectionsProps) {
  const settings = section.settings || {};
  const style = section.style || {};
  const { t } = useTranslation('storefront');
  const storeId = useStoreId();
  const params = useParams();
  const storeSlug = params?.storeSlug as string || '';
  
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Use a stable key based on section ID to persist refs across remounts
  const sectionKey = `featured-collections-${section.id}`;
  const loadedRef = useRef<string>('');
  const prevSettingsRef = useRef<{ mode: string; ids: string }>({ mode: '', ids: '' });
  const renderCountRef = useRef(0);
  
  // Initialize refs and collections from sessionStorage if available (to persist across remounts)
  useEffect(() => {
    const storedLoadedKey = sessionStorage.getItem(`${sectionKey}-loaded`);
    const storedPrevSettings = sessionStorage.getItem(`${sectionKey}-prevSettings`);
    const storedCollections = sessionStorage.getItem(`${sectionKey}-collections`);
    
    if (storedLoadedKey) {
      loadedRef.current = storedLoadedKey;
    }
    if (storedPrevSettings) {
      try {
        prevSettingsRef.current = JSON.parse(storedPrevSettings);
      } catch (e) {
        // Ignore parse errors
      }
    }
    if (storedCollections) {
      try {
        const parsedCollections = JSON.parse(storedCollections);
        setCollections(parsedCollections);
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [sectionKey]);

  // Track renders (for debugging if needed)
  renderCountRef.current += 1;

  // Extract settings values - memoize to prevent unnecessary re-renders
  const collectionSelectionMode = useMemo(() => {
    return settings.collection_selection_mode || 'all';
  }, [settings.collection_selection_mode]);
  
  // Create stable string representation of IDs
  const selectedIdsString = useMemo(() => {
    const ids = settings.selected_collection_ids || [];
    if (!Array.isArray(ids) || ids.length === 0) {
      return '';
    }
    return [...ids].sort((a, b) => a - b).join(',');
  }, [settings.selected_collection_ids]);

  // Load real collections from API - only when settings actually change
  useEffect(() => {
    if (!storeId) {
      return;
    }
    
    // Create a unique key for this load
    const loadKey = `${storeId}-${collectionSelectionMode}-${selectedIdsString}`;
    
    // Skip if already loaded with same settings (check this FIRST)
    if (loadedRef.current === loadKey) {
      return;
    }
    
    // Check if settings actually changed
    const currentSettings = { mode: collectionSelectionMode, ids: selectedIdsString };
    if (
      prevSettingsRef.current.mode === currentSettings.mode &&
      prevSettingsRef.current.ids === currentSettings.ids &&
      loadedRef.current !== ''
    ) {
      return; // Settings haven't changed, skip reload
    }
    
    // Update refs BEFORE starting async operation
    prevSettingsRef.current = currentSettings;
    loadedRef.current = loadKey; // Set immediately to prevent duplicate calls
    
    // Persist to sessionStorage to survive remounts
    sessionStorage.setItem(`${sectionKey}-loaded`, loadKey);
    sessionStorage.setItem(`${sectionKey}-prevSettings`, JSON.stringify(currentSettings));
    
    const loadCollections = async () => {
      setLoading(true);
      try {
        let collectionsData: Collection[] = [];
        
        // Get current selected IDs from settings (inside effect to avoid stale closure)
        const currentSelectedIds = settings.selected_collection_ids || [];
        const idsArray = Array.isArray(currentSelectedIds) ? currentSelectedIds : [];
        
        if (collectionSelectionMode === 'manual' && idsArray.length > 0) {
          // Load all collections and filter by selected IDs
          const response = await fetch(`/api/storefront/collections?storeId=${storeId}&limit=100`);
          if (response.ok) {
            const data = await response.json();
            const allCollections = data.collections || [];
            // Filter to only selected collections and maintain order
            // ✅ מסנן תת-קטגוריות - מציג רק קטגוריות ראשיות (ללא parent_id)
            collectionsData = idsArray
              .map((id: number) => allCollections.find((c: Collection) => c.id === id))
              .filter((c): c is Collection => c !== undefined)
              .filter((c: any) => !c.parent_id || c.parent_id === null); // רק קטגוריות ראשיות
          }
        } else {
          // Load all collections (default behavior) - load more to show real data
          const response = await fetch(`/api/storefront/collections?storeId=${storeId}&limit=100`);
          if (response.ok) {
            const data = await response.json();
            // ✅ מסנן תת-קטגוריות - מציג רק קטגוריות ראשיות (ללא parent_id)
            collectionsData = (data.collections || []).filter((c: any) => !c.parent_id || c.parent_id === null);
          }
        }
        
        // If no collections found, try loading from /api/collections as fallback
        if (collectionsData.length === 0 && storeId) {
          try {
            const fallbackResponse = await fetch(`/api/collections?limit=100`, {
              credentials: 'include',
            });
            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              const fallbackCollections = fallbackData.collections || [];
              // Map to Collection format
              collectionsData = fallbackCollections.map((c: any) => ({
                id: c.id,
                title: c.title,
                handle: c.handle,
                image_url: c.image_url,
                products_count: 0,
              }));
            }
          } catch (fallbackError) {
            console.error('Error loading collections from fallback API:', fallbackError);
          }
        }
        
        setCollections(collectionsData);
        // loadedRef.current already set before async call
        // Persist collections to sessionStorage
        sessionStorage.setItem(`${sectionKey}-collections`, JSON.stringify(collectionsData));
      } catch (error) {
        console.error('[FeaturedCollections] Error loading featured collections:', error);
        loadedRef.current = loadKey; // Mark as attempted even on error
      } finally {
        setLoading(false);
      }
    };
    
    loadCollections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, collectionSelectionMode, selectedIdsString]);
  
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
  
  // Title font size
  const getTitleSizeClass = () => {
    const size = settings.title_font_size || 'large';
    const sizeMap: Record<string, string> = {
      small: 'text-xl md:text-2xl',
      medium: 'text-2xl md:text-3xl',
      large: 'text-2xl md:text-3xl',
      xlarge: 'text-3xl md:text-4xl',
    };
    return sizeMap[size] || 'text-2xl md:text-3xl';
  };
  
  // Collection title font size
  const getCollectionTitleSizeClass = () => {
    const size = settings.collection_title_font_size || 'medium';
    const sizeMap: Record<string, string> = {
      small: 'text-sm md:text-base',
      medium: 'text-lg md:text-xl',
      large: 'text-xl md:text-2xl',
      xlarge: 'text-2xl md:text-3xl',
    };
    return sizeMap[size] || 'text-lg md:text-xl';
  };

  return (
    <div className="w-full py-8 md:py-12" style={{ fontFamily }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Title and View All Link */}
        <div className={`mb-8 md:mb-12 ${titleAlignClass}`}>
          <div className={`flex items-center gap-4 ${
            settings.title_align === 'center' ? 'justify-center' : 
            settings.title_align === 'left' ? 'justify-start flex-row-reverse' : 
            'justify-between'
          }`}>
            <h2 
              className={`${getTitleSizeClass()} font-bold`}
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
        </div>

        {/* Loading state */}
        {loading && (
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

        {/* Real collections or placeholder */}
        {!loading && (
          <div className={`grid ${getGridCols()} gap-4 md:gap-6`}>
            {(collections.length === 0 ? 
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
                      className={`${getCollectionTitleSizeClass()} font-bold mb-1 group-hover:text-gray-700 transition-colors`}
                      style={{ color: textColor }}
                    >
                      {collection?.title || t('sections.featured_collections.sample_collection', { number: index + 1 }) || `קטגוריה ${index + 1}`}
                    </h3>
                    {settings.show_products_count !== false && collection?.products_count !== undefined && (
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

// Memoize component to prevent re-renders when parent re-renders
export const FeaturedCollections = React.memo(FeaturedCollectionsComponent, (prevProps, nextProps) => {
  // Use the utility function for comparison
  const sectionsEqual = areSectionsEqual(prevProps.section, nextProps.section);
  
  // Compare other props
  const otherPropsEqual = (
    prevProps.isPreview === nextProps.isPreview &&
    prevProps.editorDevice === nextProps.editorDevice
  );
  
  return sectionsEqual && otherPropsEqual;
});
