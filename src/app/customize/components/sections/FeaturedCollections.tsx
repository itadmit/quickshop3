'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { useTranslation } from '@/hooks/useTranslation';
import { useStoreId } from '@/hooks/useStoreId';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { HiPhotograph, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { areSectionsEqual } from './sectionMemoUtils';

interface FeaturedCollectionsProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
  editorDevice?: 'desktop' | 'tablet' | 'mobile';
  isPreview?: boolean;
  preloadedCollections?: Collection[]; // ✅ נתונים טעונים מראש בשרת (מהיר!)
  storeId?: number; // ✅ Store ID from server (מהיר!)
}

interface Collection {
  id: number;
  title: string;
  handle: string;
  image_url: string | null;
  products_count?: number;
  parent_id?: number | null;
}

function FeaturedCollectionsComponent({ section, onUpdate, editorDevice, isPreview, preloadedCollections, storeId: propStoreId }: FeaturedCollectionsProps) {
  console.log(`📁 [FeaturedCollections] Component render - section.id: ${section.id}`, preloadedCollections ? '✅ עם נתונים טעונים מראש' : '❌ ללא נתונים טעונים מראש');
  
  const settings = section.settings || {};
  const style = section.style || {};
  const { t } = useTranslation('storefront');
  const params = useParams();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isInCustomizer = pathname.startsWith('/customize');
  
  // ✅ Priority: Use propStoreId from server (fast!) or fallback to hook
  const hookStoreId = useStoreId();
  const storeId = propStoreId || hookStoreId;
  
  // Get storeSlug - try from URL params first, then from API if in customizer
  const [storeSlug, setStoreSlug] = useState<string>('');
  
  useEffect(() => {
    const urlSlug = params?.storeSlug as string;
    if (urlSlug) {
      setStoreSlug(urlSlug);
      return;
    }
    
    // If in customizer and no slug in URL, fetch from API
    if (isInCustomizer && storeId) {
      fetch(`/api/customizer/pages?pageType=home`)
        .then(res => res.json())
        .then(data => {
          if (data.store?.slug) {
            setStoreSlug(data.store.slug);
          }
        })
        .catch(() => {});
    }
  }, [params?.storeSlug, isInCustomizer, storeId]);
  
  // ✅ אם יש נתונים טעונים מראש (SSR) - השתמש בהם!
  // Initialize collections from preloaded data (SSR) or sessionStorage
  const sectionKey = `featured-collections-${section.id}`;
  const [collections, setCollections] = useState<Collection[]>(() => {
    // Priority 1: Preloaded data from server (fastest!)
    if (preloadedCollections && preloadedCollections.length > 0) {
      return preloadedCollections;
    }
    // Priority 2: SessionStorage cache
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(`${sectionKey}-data`);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          return [];
        }
      }
    }
    return [];
  });
  const [loading, setLoading] = useState(() => {
    // Don't show loading if we have preloaded data or cached data
    if (preloadedCollections && preloadedCollections.length > 0) {
      return false; // ✅ יש נתונים טעונים מראש - אין צורך בטעינה
    }
    if (typeof window === 'undefined') return true;
    const stored = sessionStorage.getItem(`${sectionKey}-data`);
    return !stored;
  });
  
  // Get settings - simple and direct
  const collectionSelectionMode = settings.collection_selection_mode || 'all';
  const selectedCollectionIds = Array.isArray(settings.selected_collection_ids) ? settings.selected_collection_ids : [];
  
  // Create stable key for settings - only reload when this changes
  const settingsKey = useMemo(() => {
    const idsStr = [...selectedCollectionIds].sort((a, b) => a - b).join(',');
    const key = `${storeId}-${collectionSelectionMode}-${idsStr}`;
    console.log(`📁 [FeaturedCollections] settingsKey calculated:`, key, {
      storeId,
      collectionSelectionMode,
      selectedCollectionIds,
      idsStr
    });
    return key;
  }, [storeId, collectionSelectionMode, JSON.stringify(selectedCollectionIds)]);
  
  // Track previous settingsKey - use ref + sessionStorage to persist across remounts
  const storedPrevKey = typeof window !== 'undefined' ? sessionStorage.getItem(`${sectionKey}-prevKey`) : null;
  const prevSettingsKeyRef = useRef<string>(storedPrevKey || '');
  const isLoadingRef = useRef<boolean>(false);
  
  // Load collections - simple: only when settingsKey changes
  useEffect(() => {
    // ✅ אם יש נתונים טעונים מראש (SSR) - אל תטען שוב!
    if (preloadedCollections && preloadedCollections.length > 0) {
      console.log(`📁 [FeaturedCollections] Skipping load - using preloaded data from server`);
      setLoading(false);
      return;
    }
    
    const prevKey = prevSettingsKeyRef.current;
    console.log(`📁 [FeaturedCollections] useEffect triggered`, {
      storeId,
      settingsKey,
      prevSettingsKey: prevKey,
      isLoading: isLoadingRef.current,
      willReload: settingsKey !== prevKey && storeId !== null && !isLoadingRef.current
    });
    
    // Don't load if storeId is null - wait for it to load
    if (!storeId) {
      setLoading(false);
      return;
    }
    
    // Skip if already loading
    if (isLoadingRef.current) {
      console.log(`📁 [FeaturedCollections] Skipping reload - already loading`);
      return;
    }
    
    // Skip if settingsKey hasn't changed (and we have collections)
    if (settingsKey === prevKey && collections.length > 0) {
      console.log(`📁 [FeaturedCollections] Skipping reload - settingsKey unchanged and have collections`);
      return;
    }
    
    // If settingsKey changed, update ref and sessionStorage
    if (settingsKey !== prevKey) {
      console.log(`📁 [FeaturedCollections] settingsKey changed from ${prevKey} to ${settingsKey}, loading new data`);
      prevSettingsKeyRef.current = settingsKey;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`${sectionKey}-prevKey`, settingsKey);
      }
    }
    
    let cancelled = false;
    
    const loadCollections = async () => {
      // Prevent duplicate calls
      if (isLoadingRef.current) {
        console.log(`📁 [FeaturedCollections] Already loading, skipping duplicate call`);
        return;
      }
      
      isLoadingRef.current = true;
      console.log(`📁 [FeaturedCollections] Starting load...`);
      setLoading(true);
      try {
        let collectionsData: Collection[] = [];
        
        if (collectionSelectionMode === 'manual' && selectedCollectionIds.length > 0) {
          const response = await fetch(`/api/storefront/collections?storeId=${storeId}&limit=100&includeUnpublished=true`);
          if (response.ok && !cancelled) {
            const data = await response.json();
            const allCollections = data.collections || [];
            collectionsData = selectedCollectionIds
              .map((id: number) => allCollections.find((c: Collection) => c.id === id))
              .filter((c): c is Collection => c !== undefined);
          }
        } else {
          const response = await fetch(`/api/storefront/collections?storeId=${storeId}&limit=100&includeUnpublished=true`);
          if (response.ok && !cancelled) {
            const data = await response.json();
            collectionsData = data.collections || [];
          }
        }
        
        if (!cancelled) {
          console.log(`📁 [FeaturedCollections] Loaded ${collectionsData.length} collections`);
          setCollections(collectionsData);
          // Save to sessionStorage
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(`${sectionKey}-data`, JSON.stringify(collectionsData));
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('[FeaturedCollections] Error loading collections:', error);
          setCollections([]);
        }
      } finally {
        if (!cancelled) {
          console.log(`📁 [FeaturedCollections] Loading finished`);
          setLoading(false);
          isLoadingRef.current = false;
        }
      }
    };
    
    loadCollections();
    
    return () => {
      console.log(`📁 [FeaturedCollections] Cleanup - cancelling load`);
      cancelled = true;
      isLoadingRef.current = false;
    };
  }, [settingsKey, storeId, sectionKey, preloadedCollections]); // Added preloadedCollections to dependencies
  
  const displayType = settings.display_type || 'grid';
  const itemsPerRow = settings.items_per_row || 3;
  const itemsPerRowMobile = settings.items_per_row_mobile || 2;
  const sliderItemsDesktop = settings.slider_items_desktop || 4.5;
  const sliderItemsMobile = settings.slider_items_mobile || 1.5;
  const showArrows = settings.show_arrows !== false;
  const showDots = settings.show_dots !== false;

  // Calculate item width for slider based on visible items
  const getSliderItemWidth = (visibleItems: number) => {
    // Account for gaps (24px gap = 1.5rem)
    const gapSize = 24;
    const totalGaps = (visibleItems - 1) * gapSize;
    return `calc((100% - ${totalGaps}px) / ${visibleItems})`;
  };

  const getGridCols = () => {
    // Mobile columns based on settings
    const mobileCols = itemsPerRowMobile === 1 ? 'grid-cols-1' : 'grid-cols-2';
    
    // If in editor with mobile/tablet view, force mobile layout
    if (editorDevice === 'mobile' || editorDevice === 'tablet') {
      return mobileCols;
    }
    
    // Desktop: based on settings (with responsive fallback for actual storefront)
    let desktopCols = 'md:grid-cols-3';
    switch (itemsPerRow) {
      case 2: desktopCols = 'md:grid-cols-2'; break;
      case 3: desktopCols = 'md:grid-cols-3'; break;
      case 4: desktopCols = 'md:grid-cols-4'; break;
      case 5: desktopCols = 'md:grid-cols-5'; break;
      case 6: desktopCols = 'md:grid-cols-3'; break; // 6 items = 2 rows of 3
      default: desktopCols = 'md:grid-cols-3';
    }
    
    return `${mobileCols} ${desktopCols}`;
  };

  // For grid: show ALL collections (not limited by itemsPerRow)
  // For slider: show ALL collections (they scroll)
  const collectionsToShow = collections; // Show all collections

  // Title alignment (separate from content)
  const titleAlignClass = settings.title_align === 'left' ? 'text-left' : settings.title_align === 'center' ? 'text-center' : 'text-right';
  
  // Content alignment (for collection cards)
  const contentAlignClass = settings.content_align === 'left' ? 'text-left' : settings.content_align === 'center' ? 'text-center' : 'text-right';
  const flexAlignClass = settings.content_align === 'left' ? 'items-end' : settings.content_align === 'center' ? 'items-center' : 'items-start';

  // Typography settings - use specific typography for heading
  const headingTypography = style.typography?.heading || {};
  
  const fontFamily = headingTypography.font_family || style.typography?.font_family || '"Noto Sans Hebrew", sans-serif';
  const textColor = headingTypography.color || style.typography?.color || '#111827';
  
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
              className={`${getTitleSizeClass()}`}
              style={{ 
                color: headingTypography.color || textColor,
                fontFamily: headingTypography.font_family || fontFamily,
                fontSize: headingTypography.font_size || undefined,
                fontWeight: headingTypography.font_weight || 'bold',
                lineHeight: headingTypography.line_height || undefined,
                letterSpacing: headingTypography.letter_spacing || undefined,
                textTransform: headingTypography.text_transform || undefined,
              }}
            >
              {settings.title || t('sections.featured_collections.title') || 'קטגוריות פופולריות'}
            </h2>
            {settings.show_view_all !== false && (
              <a 
                href={settings.view_all_url || `/shops/${storeSlug}/categories`}
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
          displayType === 'slider' || displayType === 'carousel' ? (
            <div className="relative" style={{ overflow: 'hidden', maxWidth: '100%' }}>
              <div className="overflow-x-auto scrollbar-hide" style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', overflowY: 'hidden' }}>
                <div className="inline-flex gap-4 pb-4" style={{ minWidth: '100%' }}>
                  {Array.from({ length: Math.max(4, Math.ceil((editorDevice === 'mobile' ? sliderItemsMobile : sliderItemsDesktop) * 2)) }).map((_, i) => (
                    <div key={i} className="flex-shrink-0 animate-pulse" style={{ width: getSliderItemWidth(editorDevice === 'mobile' ? sliderItemsMobile : sliderItemsDesktop), scrollSnapAlign: 'start' }}>
                      <div className="aspect-[4/3] bg-gray-200 rounded-lg mb-4" />
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className={`grid ${getGridCols()} gap-4 md:gap-6`}>
              {Array.from({ length: itemsPerRow || 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/3] bg-gray-200 rounded-lg mb-4" />
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          )
        )}

        {/* Real collections or placeholder */}
        {!loading && (
          displayType === 'slider' || displayType === 'carousel' ? (
            <div className="relative group" style={{ overflow: 'hidden', maxWidth: '100%' }}>
              {/* Carousel/Slider Layout */}
              <div 
                id={`carousel-${section.id}`}
                className="overflow-x-auto scrollbar-hide" 
                style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', overflowY: 'hidden' }}
              >
                <div className="inline-flex gap-4 pb-4" style={{ minWidth: '100%' }}>
                  {(collections.length === 0 ? 
                    Array.from({ length: 4 }, (_, i) => ({ id: i + 1, isPlaceholder: true })) : 
                    collectionsToShow
                  ).map((item: any, index: number) => {
                    const isPlaceholder = item.isPlaceholder;
                    const collection = isPlaceholder ? null : item as Collection;
                    const visibleItems = editorDevice === 'mobile' ? sliderItemsMobile : sliderItemsDesktop;
                    const cardWidth = getSliderItemWidth(visibleItems);
                    
                    // In customizer, links should navigate to customizer edit mode
                    const collectionUrl = collection 
                      ? (isInCustomizer 
                          ? `/customize?pageType=collection&pageHandle=${collection.handle}`
                          : `/shops/${storeSlug}/categories/${collection.handle}`)
                      : '#';

                    return (
                      <div
                        key={collection?.id || index}
                        className="flex-shrink-0"
                        style={{ 
                          width: cardWidth,
                          scrollSnapAlign: 'start'
                        }}
                      >
                        <Link 
                          href={collectionUrl}
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
                              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                <HiPhotograph className="w-16 h-16 text-gray-400" />
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
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Navigation Arrows */}
              {showArrows && collectionsToShow.length > (editorDevice === 'mobile' ? sliderItemsMobile : sliderItemsDesktop) && (
                <>
                  <button
                    onClick={() => {
                      const carousel = document.getElementById(`carousel-${section.id}`);
                      if (carousel) {
                        const visibleItems = editorDevice === 'mobile' ? sliderItemsMobile : sliderItemsDesktop;
                        const gap = 16; // gap-4 = 1rem = 16px
                        const containerWidth = carousel.offsetWidth;
                        const itemWidth = (containerWidth - (gap * (visibleItems - 1))) / visibleItems;
                        const scrollAmount = itemWidth + gap;
                        carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
                      }
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white shadow-lg rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    aria-label="Previous"
                  >
                    <HiChevronRight className="w-6 h-6 text-gray-700" />
                  </button>
                  <button
                    onClick={() => {
                      const carousel = document.getElementById(`carousel-${section.id}`);
                      if (carousel) {
                        const visibleItems = editorDevice === 'mobile' ? sliderItemsMobile : sliderItemsDesktop;
                        const gap = 16; // gap-4 = 1rem = 16px
                        const containerWidth = carousel.offsetWidth;
                        const itemWidth = (containerWidth - (gap * (visibleItems - 1))) / visibleItems;
                        const scrollAmount = itemWidth + gap;
                        carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                      }
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white shadow-lg rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    aria-label="Next"
                  >
                    <HiChevronLeft className="w-6 h-6 text-gray-700" />
                  </button>
                </>
              )}
              
              {/* Dots Indicator */}
              {showDots && collectionsToShow.length > (editorDevice === 'mobile' ? sliderItemsMobile : sliderItemsDesktop) && (
                <div className="flex justify-center gap-2 mt-4">
                  {Array.from({ length: Math.ceil(collectionsToShow.length / (editorDevice === 'mobile' ? sliderItemsMobile : sliderItemsDesktop)) }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        const carousel = document.getElementById(`carousel-${section.id}`);
                        if (carousel) {
                          const visibleItems = editorDevice === 'mobile' ? sliderItemsMobile : sliderItemsDesktop;
                          const gap = 16;
                          const containerWidth = carousel.offsetWidth;
                          const itemWidth = (containerWidth - (gap * (visibleItems - 1))) / visibleItems;
                          const scrollAmount = (itemWidth + gap) * visibleItems * i;
                          carousel.scrollTo({ left: scrollAmount, behavior: 'smooth' });
                        }
                      }}
                      className="w-2 h-2 rounded-full bg-gray-300 hover:bg-gray-400 transition-colors"
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className={`grid ${getGridCols()} gap-4 md:gap-6`}>
              {(collections.length === 0 ? 
                Array.from({ length: itemsPerRow || 3 }, (_, i) => ({ id: i + 1, isPlaceholder: true })) : 
                collectionsToShow
              ).map((item: any, index: number) => {
              const isPlaceholder = item.isPlaceholder;
              const collection = isPlaceholder ? null : item as Collection;
              // In customizer, links should navigate to customizer edit mode
              const collectionUrl = collection 
                ? (isInCustomizer 
                    ? `/customize?pageType=collection&pageHandle=${collection.handle}`
                    : `/shops/${storeSlug}/categories/${collection.handle}`)
                : '#';

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
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <HiPhotograph className="w-16 h-16 text-gray-400" />
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
          )
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

// Memoize FeaturedCollections - only re-render if relevant settings changed
export const FeaturedCollections = React.memo(FeaturedCollectionsComponent, (prevProps, nextProps) => {
  // Compare only relevant settings that affect data loading
  const prevSettings = prevProps.section?.settings || {};
  const nextSettings = nextProps.section?.settings || {};
  
  const relevantKeys = [
    'collection_selection_mode',
    'selected_collection_ids',
    'display_type',
    'items_per_row',
    'items_per_row_mobile',
    'slider_items_desktop',
    'slider_items_mobile',
    'show_arrows',
    'show_dots'
  ];
  
  const changes: string[] = [];
  
  for (const key of relevantKeys) {
    const prev = JSON.stringify(prevSettings[key]);
    const next = JSON.stringify(nextSettings[key]);
    if (prev !== next) {
      changes.push(`${key}: ${prev} -> ${next}`);
    }
  }
  
  // Compare other props
  if (prevProps.editorDevice !== nextProps.editorDevice) {
    changes.push(`editorDevice: ${prevProps.editorDevice} -> ${nextProps.editorDevice}`);
  }
  if (prevProps.isPreview !== nextProps.isPreview) {
    changes.push(`isPreview: ${prevProps.isPreview} -> ${nextProps.isPreview}`);
  }
  if (prevProps.section?.id !== nextProps.section?.id) {
    changes.push(`section.id: ${prevProps.section?.id} -> ${nextProps.section?.id}`);
  }
  
  // Check if section object reference changed (but content is the same)
  const sectionRefChanged = prevProps.section !== nextProps.section;
  if (sectionRefChanged && changes.length === 0) {
    console.log(`📁 [FeaturedCollections] React.memo: SKIP RE-RENDER - section ref changed but content same`);
    return true; // Skip re-render even if ref changed
  }
  
  if (changes.length > 0) {
    console.log(`📁 [FeaturedCollections] React.memo: WILL RE-RENDER`, changes);
    return false; // Settings changed, re-render
  }
  
  console.log(`📁 [FeaturedCollections] React.memo: SKIP RE-RENDER - no changes`);
  // Everything else is the same, skip re-render
  return true;
});
