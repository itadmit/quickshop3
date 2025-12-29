'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { HiStar, HiPhotograph } from 'react-icons/hi';
import { useTranslation } from '@/hooks/useTranslation';
import { useStoreId } from '@/hooks/useStoreId';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { areSectionsEqual } from './sectionMemoUtils';

interface FeaturedProductsProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
  editorDevice?: 'desktop' | 'tablet' | 'mobile';
  isPreview?: boolean; // true when in customizer preview
}

interface Product {
  id: number;
  title: string;
  handle: string;
  image: string | null;
  price: number;
  compare_at_price: number | null;
  vendor?: string;
}

function FeaturedProductsComponent({ section, onUpdate, editorDevice, isPreview }: FeaturedProductsProps) {
  console.log(`🛍️ [FeaturedProducts] Component render - section.id: ${section.id}`);
  
  const settings = section.settings || {};
  const style = section.style || {};
  const { t } = useTranslation('storefront');
  const params = useParams();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isInCustomizer = pathname.startsWith('/customize');
  
  // Get storeId from user session (for customizer) or from URL (for storefront)
  const storeId = useStoreId();
  
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
  // Initialize products from sessionStorage if available
  const sectionKey = `featured-products-${section.id}`;
  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window === 'undefined') return [];
    const stored = sessionStorage.getItem(`${sectionKey}-data`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [loading, setLoading] = useState(() => {
    // Don't show loading if we have cached data
    if (typeof window === 'undefined') return true;
    const stored = sessionStorage.getItem(`${sectionKey}-data`);
    return !stored;
  });
  
  // Get settings - simple and direct
  const productsCount = settings.products_count || 8;
  const productSelectionMode = settings.product_selection_mode || 'all';
  const selectedCollectionIds = Array.isArray(settings.selected_collection_ids) ? settings.selected_collection_ids : [];
  const selectedProductIds = Array.isArray(settings.selected_product_ids) ? settings.selected_product_ids : [];
  
  // Create stable key for settings - only reload when this changes
  const collectionIdsStr = useMemo(() => 
    [...selectedCollectionIds].sort((a, b) => a - b).join(','), 
    [selectedCollectionIds.join(',')]
  );
  const productIdsStr = useMemo(() => 
    [...selectedProductIds].sort((a, b) => a - b).join(','), 
    [selectedProductIds.join(',')]
  );
  
  const settingsKey = useMemo(() => {
    let idsStr = '';
    if (productSelectionMode === 'manual' && selectedProductIds.length > 0) {
      idsStr = productIdsStr;
    } else if (productSelectionMode === 'collection' && selectedCollectionIds.length > 0) {
      idsStr = collectionIdsStr;
    }
    const key = `${storeId}-${productsCount}-${productSelectionMode}-${idsStr}`;
    console.log(`🛍️ [FeaturedProducts] settingsKey calculated:`, key, {
      storeId,
      productsCount,
      productSelectionMode,
      selectedCollectionIds,
      selectedProductIds,
      idsStr
    });
    return key;
  }, [storeId, productsCount, productSelectionMode, collectionIdsStr, productIdsStr]);
  
  // Track previous settingsKey - use ref + sessionStorage to persist across remounts
  const storedPrevKey = typeof window !== 'undefined' ? sessionStorage.getItem(`${sectionKey}-prevKey`) : null;
  const prevSettingsKeyRef = useRef<string>(storedPrevKey || '');
  const isLoadingRef = useRef<boolean>(false);
  
  // Load products - simple: only when settingsKey changes
  useEffect(() => {
    const prevKey = prevSettingsKeyRef.current;
    console.log(`🛍️ [FeaturedProducts] useEffect triggered`, {
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
      console.log(`🛍️ [FeaturedProducts] Skipping reload - already loading`);
      return;
    }
    
    // Skip if settingsKey hasn't changed (and we have products)
    if (settingsKey === prevKey && products.length > 0) {
      console.log(`🛍️ [FeaturedProducts] Skipping reload - settingsKey unchanged and have products`);
      return;
    }
    
    // If settingsKey changed, update ref and sessionStorage
    if (settingsKey !== prevKey) {
      console.log(`🛍️ [FeaturedProducts] settingsKey changed from ${prevKey} to ${settingsKey}, loading new data`);
      prevSettingsKeyRef.current = settingsKey;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`${sectionKey}-prevKey`, settingsKey);
      }
    }
    
    let cancelled = false;
    
    const loadProducts = async () => {
      // Prevent duplicate calls
      if (isLoadingRef.current) {
        console.log(`🛍️ [FeaturedProducts] Already loading, skipping duplicate call`);
        return;
      }
      
      isLoadingRef.current = true;
      console.log(`🛍️ [FeaturedProducts] Starting load...`);
      setLoading(true);
      try {
        let loadedProducts: Product[] = [];
        
        if (productSelectionMode === 'manual' && selectedProductIds.length > 0) {
          const idsParam = selectedProductIds.join(',');
          console.log(`🛍️ [FeaturedProducts] Loading manual products with IDs: ${idsParam}`);
          const response = await fetch(`/api/products/by-ids?ids=${idsParam}&storeId=${storeId}`, {
            credentials: 'include' // Important: include cookies for authentication
          });
          if (response.ok && !cancelled) {
            const data = await response.json();
            console.log(`🛍️ [FeaturedProducts] API response:`, data);
            loadedProducts = (data.products || []).map((p: any) => ({
              id: p.id,
              title: p.title,
              handle: p.handle,
              image: p.image || null,
              price: p.price || 0,
              compare_at_price: null,
              vendor: p.vendor
            }));
            console.log(`🛍️ [FeaturedProducts] Mapped ${loadedProducts.length} products from manual selection`);
          } else if (!cancelled) {
            console.error(`🛍️ [FeaturedProducts] Failed to load products: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.error(`🛍️ [FeaturedProducts] Error details:`, errorText);
          }
        } else {
          let url = `/api/storefront/products?storeId=${storeId}&limit=${productsCount}`;
          
          if (productSelectionMode === 'collection' && selectedCollectionIds.length > 0) {
            const collectionResponse = await fetch(`/api/storefront/collections?storeId=${storeId}&limit=100&includeUnpublished=true`);
            if (collectionResponse.ok) {
              const collectionsData = await collectionResponse.json();
              const selectedCollections = collectionsData.collections?.filter((c: any) => 
                selectedCollectionIds.includes(c.id)
              ) || [];
              
              // Load products from all selected collections and merge them
              if (selectedCollections.length > 0) {
                console.log(`🛍️ [FeaturedProducts] Loading products from ${selectedCollections.length} collections`);
                const allProducts: Product[] = [];
                const seenProductIds = new Set<number>();
                
                // Fetch products from each collection
                for (const collection of selectedCollections) {
                  if (collection.handle && !cancelled) {
                    const collectionUrl = `/api/storefront/products?storeId=${storeId}&collection=${collection.handle}&limit=${productsCount * 2}`;
                    const collectionResponse = await fetch(collectionUrl);
                    if (collectionResponse.ok) {
                      const collectionData = await collectionResponse.json();
                      const collectionProducts = collectionData.products || [];
                      
                      // Add products that haven't been seen yet (avoid duplicates)
                      for (const product of collectionProducts) {
                        if (!seenProductIds.has(product.id)) {
                          seenProductIds.add(product.id);
                          allProducts.push(product);
                        }
                      }
                    }
                  }
                }
                
                // Limit to requested number of products
                loadedProducts = allProducts.slice(0, productsCount);
                console.log(`🛍️ [FeaturedProducts] Loaded ${loadedProducts.length} unique products from ${selectedCollections.length} collections`);
              }
            }
          }
          
          // If no products loaded yet (not collection mode or no collections selected), load all products
          if (loadedProducts.length === 0) {
            const response = await fetch(url);
            if (response.ok && !cancelled) {
              const data = await response.json();
              loadedProducts = data.products || [];
            }
          }
        }
        
        if (!cancelled) {
          console.log(`🛍️ [FeaturedProducts] Loaded ${loadedProducts.length} products`);
          setProducts(loadedProducts);
          // Save to sessionStorage
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(`${sectionKey}-data`, JSON.stringify(loadedProducts));
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('[FeaturedProducts] Error loading products:', error);
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          console.log(`🛍️ [FeaturedProducts] Loading finished`);
          setLoading(false);
          isLoadingRef.current = false;
        }
      }
    };
    
    loadProducts();
    
    return () => {
      console.log(`🛍️ [FeaturedProducts] Cleanup - cancelling load`);
      cancelled = true;
      isLoadingRef.current = false;
    };
  }, [settingsKey, storeId, sectionKey]); // Removed products.length to prevent re-runs when products change

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
  
  // Typography settings - use specific typography for heading
  const headingTypography = (style.typography as any)?.heading || {};
  
  const fontFamily = headingTypography.font_family || (style.typography as any)?.font_family || '"Noto Sans Hebrew", sans-serif';
  const textColor = headingTypography.color || (style.typography as any)?.color || '#111827';
  
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
  
  // Product title font size
  const getProductTitleSizeClass = () => {
    const size = settings.product_title_font_size || 'medium';
    const sizeMap: Record<string, string> = {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg',
      xlarge: 'text-xl',
    };
    return sizeMap[size] || 'text-base';
  };
  
  // Price font size
  const getPriceSizeClass = () => {
    const size = settings.price_font_size || 'medium';
    const sizeMap: Record<string, string> = {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg',
      xlarge: 'text-xl',
    };
    return sizeMap[size] || 'text-base';
  };

  // Helper function to format price safely
  const formatPrice = (price: any): string => {
    if (!price) return '0.00';
    const numPrice = typeof price === 'number' ? price : parseFloat(String(price));
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
  };

  return (
    <div className="w-full" style={{ fontFamily }}>
      <div className="container mx-auto px-4">
        {/* Section Header with Title and View All Link */}
        <div className={`mb-8 md:mb-12 ${titleAlignClass}`}>
          <div className={`flex items-center gap-4 ${
            settings.title_align === 'center' ? 'justify-center' : 
            settings.title_align === 'left' ? 'justify-start flex-row-reverse' : 
            'justify-between'
          }`}>
            {settings.title && (
              <h2 
                className={`${getTitleSizeClass()} text-gray-900`}
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
                {settings.title}
              </h2>
            )}
            {settings.show_view_all !== false && (
              <a 
                href={settings.view_all_url || '/categories/all'}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
              >
                {settings.view_all_text || t('sections.featured_products.view_all') || 'לכל המוצרים'}
              <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          )}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className={`grid ${getGridCols()} gap-4 md:gap-8`}>
            {Array.from({ length: productsToShow }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            ))}
          </div>
        )}

        {/* Real products (both storefront and preview) */}
        {!loading && (
          <div className={`grid ${getGridCols()} gap-4 md:gap-8`}>
            {/* Use real products if available, otherwise show placeholders */}
            {(products.length === 0 ? 
              Array.from({ length: productsToShow }, (_, i) => ({ id: i + 1, isPlaceholder: true })) : 
              products.slice(0, productsToShow)
            ).map((item: any, index: number) => {
              const isPlaceholder = item.isPlaceholder;
              const product = isPlaceholder ? null : item as Product;
              // In customizer, links should navigate to customizer edit mode
              const productUrl = product 
                ? (isInCustomizer 
                    ? `/customize?pageType=product&pageHandle=${product.handle}`
                    : `/shops/${storeSlug}/products/${product.handle}`)
                : '#';
              const hasDiscount = product && product.compare_at_price && product.compare_at_price > product.price;

              return (
                <Link 
                  href={productUrl}
                  key={product?.id || index} 
                  className="group flex flex-col"
                >
                  <div 
                    className="relative aspect-[3/4] bg-white overflow-hidden mb-4 shadow-sm group-hover:shadow-md transition-shadow"
                    style={{
                      border: settings.card_border_width && settings.card_border_width > 0 
                        ? `${settings.card_border_width}px solid ${settings.card_border_color || '#e5e7eb'}` 
                        : 'none',
                      borderRadius: settings.card_border_radius ? `${settings.card_border_radius}px` : '8px'
                    }}
                  >
                    {product?.image ? (
                      <img 
                        src={product.image} 
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                        <HiPhotograph className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    
                    {settings.show_badges !== false && hasDiscount && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs font-bold rounded-sm">
                        {t('product.badge.sale') || 'מבצע'}
                      </div>
                    )}
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <div className={`space-y-1 flex flex-col ${flexAlignClass} ${contentAlignClass}`}>
                    <h3 
                      className={`${getProductTitleSizeClass()} font-medium text-gray-900 group-hover:text-gray-700 transition-colors line-clamp-2`}
                      style={{ color: textColor }}
                    >
                      {product?.title || t('sections.featured_products.sample_product', { number: index + 1 }) || `מוצר לדוגמה ${index + 1}`}
                    </h3>
                    
                    {settings.show_rating !== false && (
                      <div className="flex items-center text-yellow-400 text-sm">
                        <HiStar className="w-4 h-4 fill-current" />
                        <span className="text-gray-400 mr-1 text-xs">4.8</span>
                      </div>
                    )}

                    {settings.show_price !== false && (
                      <div className="flex items-center gap-2">
                        <p className={`${getPriceSizeClass()} text-gray-900 font-medium`}>
                          ₪{product?.price ? formatPrice(product.price) : '199.90'}
                        </p>
                        {(hasDiscount || isPlaceholder) && (
                          <p className={`${getPriceSizeClass()} text-gray-400 line-through`}>
                            ₪{product?.compare_at_price ? formatPrice(product.compare_at_price) : '249.90'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Memoize FeaturedProducts - only re-render if relevant settings changed
export const FeaturedProducts = React.memo(FeaturedProductsComponent, (prevProps, nextProps) => {
  // Compare only relevant settings that affect data loading
  const prevSettings = prevProps.section?.settings || {};
  const nextSettings = nextProps.section?.settings || {};
  
  const relevantKeys = [
    'products_count',
    'product_selection_mode',
    'selected_collection_ids',
    'selected_product_ids'
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
    console.log(`🛍️ [FeaturedProducts] React.memo: SKIP RE-RENDER - section ref changed but content same`);
    return true; // Skip re-render even if ref changed
  }
  
  if (changes.length > 0) {
    console.log(`🛍️ [FeaturedProducts] React.memo: WILL RE-RENDER`, changes);
    return false; // Settings changed, re-render
  }
  
  console.log(`🛍️ [FeaturedProducts] React.memo: SKIP RE-RENDER - no changes`);
  // Everything else is the same, skip re-render
  return true;
});
