'use client';

import React, { useEffect, useState, useRef } from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { HiStar, HiShoppingBag } from 'react-icons/hi';
import { useTranslation } from '@/hooks/useTranslation';
import { useStoreId } from '@/hooks/useStoreId';
import { useParams } from 'next/navigation';
import Link from 'next/link';

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

export function FeaturedProducts({ section, onUpdate, editorDevice, isPreview }: FeaturedProductsProps) {
  const settings = section.settings || {};
  const style = section.style || {};
  const { t } = useTranslation('storefront');
  const storeId = useStoreId();
  const params = useParams();
  const storeSlug = params?.storeSlug as string || '';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const loadedRef = useRef(false);

  // Load real products from API (only in storefront, not in customizer preview)
  useEffect(() => {
    if (isPreview || loadedRef.current || !storeId) return;
    
    const loadProducts = async () => {
      setLoading(true);
      try {
        const limit = settings.products_count || 8;
        const response = await fetch(`/api/storefront/products?storeId=${storeId}&limit=${limit}`);
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error('Error loading featured products:', error);
      } finally {
        setLoading(false);
        loadedRef.current = true;
      }
    };
    
    loadProducts();
  }, [storeId, isPreview, settings.products_count]);

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
        {/* Section Header with Title and View All Link */}
        <div className="flex items-center justify-between mb-8 md:mb-12">
          {settings.title && (
            <h2 
              className={`text-2xl md:text-3xl font-bold text-gray-900`}
              style={{ color: textColor }}
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
                  <div className="relative aspect-[3/4] bg-white border border-gray-100 rounded-lg overflow-hidden mb-4 shadow-sm group-hover:shadow-md transition-shadow">
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
                      className="font-medium text-gray-900 group-hover:text-gray-700 transition-colors line-clamp-2"
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
                        <p className="text-gray-900 font-medium">
                          ₪{product?.price?.toFixed(2) || '199.90'}
                        </p>
                        {(hasDiscount || isPlaceholder) && (
                          <p className="text-gray-400 text-sm line-through">
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
