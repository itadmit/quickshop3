'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { HiStar, HiShoppingBag } from 'react-icons/hi';
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
  const settings = section.settings || {};
  const style = section.style || {};
  const { t } = useTranslation('storefront');
  const storeId = useStoreId();
  const params = useParams();
  const storeSlug = params?.storeSlug as string || '';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  
  
  // Use a stable key based on section ID to persist refs across remounts
  const sectionKey = `featured-products-${section.id}`;
  const loadedRef = useRef<string>('');
  const prevSettingsRef = useRef<{ productsCount: number; productSelectionMode: string; selectedIdsString: string }>({ 
    productsCount: 0, 
    productSelectionMode: '', 
    selectedIdsString: '' 
  });
  
  // Initialize refs and products from sessionStorage if available (to persist across remounts)
  useEffect(() => {
    const storedLoadedKey = sessionStorage.getItem(`${sectionKey}-loaded`);
    const storedPrevSettings = sessionStorage.getItem(`${sectionKey}-prevSettings`);
    const storedProducts = sessionStorage.getItem(`${sectionKey}-products`);
    
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
    if (storedProducts) {
      try {
        const parsedProducts = JSON.parse(storedProducts);
        setProducts(parsedProducts);
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [sectionKey]);

  // Memoize settings to prevent unnecessary re-renders
  const productsCount = useMemo(() => {
    return settings.products_count || 8;
  }, [settings.products_count]);
  
  const productSelectionMode = useMemo(() => {
    return settings.product_selection_mode || 'all';
  }, [settings.product_selection_mode]);
  
  const selectedCollectionIds = useMemo(() => {
    const ids = settings.selected_collection_ids || [];
    return Array.isArray(ids) ? ids : [];
  }, [settings.selected_collection_ids]);
  
  const selectedProductIds = useMemo(() => {
    const ids = settings.selected_product_ids || [];
    return Array.isArray(ids) ? ids : [];
  }, [settings.selected_product_ids]);
  
  // Create stable string representation of IDs for comparison
  const selectedIdsString = useMemo(() => {
    if (productSelectionMode === 'manual' && selectedProductIds.length > 0) {
      return [...selectedProductIds].sort((a, b) => a - b).join(',');
    }
    if (!Array.isArray(selectedCollectionIds) || selectedCollectionIds.length === 0) {
      return '';
    }
    return [...selectedCollectionIds].sort((a, b) => a - b).join(',');
  }, [selectedCollectionIds, selectedProductIds, productSelectionMode]);

  // Load real products from API (only in storefront, not in customizer preview)
  useEffect(() => {
    // In preview mode, don't load real products - just show placeholders
    if (isPreview || !storeId) return;
    
    // Create a stable key for this load attempt
    const loadKey = `${storeId}-${productsCount}-${productSelectionMode}-${selectedIdsString || 'all'}`;
    
    // Check if we already loaded with these exact settings
    if (loadedRef.current === loadKey) {
      const currentSettings = { productsCount, productSelectionMode, selectedIdsString };
      const prevSettings = prevSettingsRef.current;
      
      // Deep compare settings
      if (
        prevSettings.productsCount === currentSettings.productsCount &&
        prevSettings.productSelectionMode === currentSettings.productSelectionMode &&
        prevSettings.selectedIdsString === currentSettings.selectedIdsString
      ) {
        return;
      }
    }
    
    const loadProducts = async () => {
      setLoading(true);
      try {
        let loadedProducts: Product[] = [];
        
        // If manual mode is selected, load specific products by IDs
        if (productSelectionMode === 'manual' && selectedProductIds.length > 0) {
          const idsParam = selectedProductIds.join(',');
          const response = await fetch(`/api/products/by-ids?ids=${idsParam}`);
          if (response.ok) {
            const data = await response.json();
            loadedProducts = (data.products || []).map((p: any) => ({
              id: p.id,
              title: p.title,
              handle: p.handle,
              image: p.image || null,
              price: p.price || 0,
              compare_at_price: null, // API doesn't return compare_at_price yet
              vendor: p.vendor
            }));
          }
        } else {
          // Otherwise, use the existing logic
          let url = `/api/storefront/products?storeId=${storeId}&limit=${productsCount}`;
          
          // If collection mode is selected, filter by collections
          if (productSelectionMode === 'collection' && selectedCollectionIds.length > 0) {
            // Get all collection handles
            const collectionResponse = await fetch(`/api/collections?storeId=${storeId}&limit=100`);
            if (collectionResponse.ok) {
              const collectionsData = await collectionResponse.json();
              const selectedCollections = collectionsData.collections?.filter((c: any) => 
                selectedCollectionIds.includes(c.id)
              ) || [];
              
              // If we have collections, use the first one's handle (or combine them)
              // For now, we'll use the first collection
              if (selectedCollections.length > 0 && selectedCollections[0]?.handle) {
                url = `/api/storefront/products?storeId=${storeId}&collectionHandle=${selectedCollections[0].handle}&limit=${productsCount}`;
              }
            }
          }
          
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            loadedProducts = data.products || [];
          }
        }
        
        if (loadedProducts.length > 0) {
          setProducts(loadedProducts);
          
          // Save to sessionStorage
          sessionStorage.setItem(`${sectionKey}-products`, JSON.stringify(loadedProducts));
          sessionStorage.setItem(`${sectionKey}-loaded`, loadKey);
          sessionStorage.setItem(`${sectionKey}-prevSettings`, JSON.stringify({ 
            productsCount, 
            productSelectionMode, 
            selectedIdsString 
          }));
          
          loadedRef.current = loadKey;
          prevSettingsRef.current = { productsCount, productSelectionMode, selectedIdsString };
        }
      } catch (error) {
        console.error('Error loading featured products:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, [storeId, isPreview, productsCount, productSelectionMode, selectedIdsString, sectionKey, selectedCollectionIds, selectedProductIds]);
  
  // In preview mode, clear products when settings change to show updated placeholder count
  useEffect(() => {
    if (isPreview) {
      // Clear products so the component re-renders with new placeholder count
      setProducts([]);
    }
  }, [isPreview, productsCount, productSelectionMode, selectedIdsString, selectedProductIds]);

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
        {loading && !isPreview && (
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

        {/* Real products (storefront) or placeholder (preview) */}
        {!loading && (
          <div className={`grid ${getGridCols()} gap-4 md:gap-8`}>
            {/* Use real products in storefront, placeholder in preview */}
            {(isPreview || products.length === 0 ? 
              Array.from({ length: productsToShow }, (_, i) => ({ id: i + 1, isPlaceholder: true })) : 
              products.slice(0, productsToShow)
            ).map((item: any, index: number) => {
              const isPlaceholder = item.isPlaceholder;
              const product = isPlaceholder ? null : item as Product;
              const productUrl = product ? `/shops/${storeSlug}/products/${product.handle}` : '#';
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
                      <div className="absolute inset-0 flex items-center justify-center text-gray-200 bg-gray-50">
                        <HiShoppingBag className="w-12 h-12 opacity-20" />
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
                          ₪{product?.price?.toFixed(2) || '199.90'}
                        </p>
                        {(hasDiscount || isPlaceholder) && (
                          <p className={`${getPriceSizeClass()} text-gray-400 line-through`}>
                            ₪{product?.compare_at_price?.toFixed(2) || '249.90'}
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

// Memoize FeaturedProducts to prevent re-renders when parent re-renders
export const FeaturedProducts = React.memo(FeaturedProductsComponent, (prevProps, nextProps) => {
  // Use areSectionsEqual for deep comparison of section
  if (!areSectionsEqual(prevProps.section, nextProps.section)) {
    return false; // Will re-render
  }
  
  // Compare other props
  if (
    prevProps.editorDevice !== nextProps.editorDevice ||
    prevProps.isPreview !== nextProps.isPreview
  ) {
    return false; // Will re-render
  }
  
  // onUpdate is intentionally ignored - it's a callback function
  return true; // Skip re-render
});
