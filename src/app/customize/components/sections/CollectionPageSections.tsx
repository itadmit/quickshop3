'use client';

import React from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { SectionSettings } from '@/lib/customizer/types';
import { useTranslation } from '@/hooks/useTranslation';
import { HiPhotograph, HiFilter, HiViewGrid, HiCollection } from 'react-icons/hi';
import Link from 'next/link';
import { ProductCard } from '@/components/storefront/ProductCard';
import { CollectionProductsClient } from './CollectionProductsClient';

interface CollectionSectionProps {
  section: SectionSettings;
  collection: any;
  products?: any[];
  onUpdate: (updates: Partial<SectionSettings>) => void;
  storeId?: number; // Store ID for loading products
}

// Collection Header Section
export function CollectionHeaderSection({ section, collection, onUpdate }: CollectionSectionProps) {
  const settings = section.settings || {};
  const { t } = useTranslation('storefront');
  
  if (!collection) {
    return (
      <div className="py-8 px-4 text-center text-gray-400 bg-gray-50 rounded-lg">
        <HiCollection className="w-12 h-12 mx-auto mb-2" />
        <p>כותרת קטגוריה</p>
        <p className="text-sm">יוצג כאשר ייטען קטגוריה</p>
      </div>
    );
  }

  // Get all settings
  const layout = settings.layout || 'banner';
  const showImage = settings.show_image !== false;
  const showDescription = settings.show_description !== false;
  const showProductCount = settings.show_product_count !== false;
  const textAlign = settings.text_align || 'right';
  const contentPosition = settings.content_position || 'center';
  const titleSize = settings.title_size || 'large';
  const titleColor = settings.title_color || '#111827';
  const descriptionColor = settings.description_color || '#4B5563';
  const overlayColor = settings.overlay_color || '#000000';
  const overlayOpacity = settings.overlay_opacity || '0.4';
  const bannerHeight = settings.banner_height || 'medium';

  // Title size classes
  const titleSizeClasses = {
    small: 'text-xl md:text-2xl',
    medium: 'text-2xl md:text-3xl',
    large: 'text-3xl md:text-4xl',
    xl: 'text-4xl md:text-5xl',
  }[titleSize] || 'text-3xl md:text-4xl';

  // Text alignment classes
  const textAlignClasses = {
    right: 'text-right',
    center: 'text-center',
    left: 'text-left',
  }[textAlign] || 'text-right';

  // Banner height classes
  const bannerHeightClasses = {
    small: 'py-8 md:py-12',
    medium: 'py-12 md:py-20',
    large: 'py-16 md:py-28',
    full: 'py-24 md:py-36',
  }[bannerHeight] || 'py-12 md:py-20';

  // Content position classes for vertical alignment
  const contentPositionClasses = {
    top: 'items-start',
    center: 'items-center',
    bottom: 'items-end',
  }[contentPosition] || 'items-center';

  if (layout === 'simple') {
    return (
      <div className={`py-6 ${textAlignClasses}`}>
        <h1 
          className={`${titleSizeClasses} font-bold mb-2`}
          style={{ color: titleColor }}
        >
          {collection.title}
        </h1>
        {showDescription && collection.description && (
          <p 
            className="text-lg mb-2"
            style={{ color: descriptionColor }}
          >
            {collection.description}
          </p>
        )}
        {showProductCount && collection.product_count !== undefined && (
          <p className="text-sm text-gray-500">
            {collection.product_count} {t('product.items') || 'פריטים'}
          </p>
        )}
      </div>
    );
  }

  if (layout === 'hero') {
    return (
      <div className={`relative ${bannerHeightClasses} flex ${contentPositionClasses}`}>
        {showImage && collection.image_url && (
          <div className="absolute inset-0 z-0">
            <img
              src={collection.image_url}
              alt={collection.title}
              className="w-full h-full object-cover"
            />
            <div 
              className="absolute inset-0" 
              style={{ backgroundColor: overlayColor, opacity: parseFloat(overlayOpacity) }}
            />
          </div>
        )}
        <div className={`relative z-10 w-full ${textAlignClasses} text-white px-4`}>
          <h1 
            className={`${titleSizeClasses} font-bold mb-4`}
            style={{ color: showImage ? '#FFFFFF' : titleColor }}
          >
            {collection.title}
          </h1>
          {showDescription && collection.description && (
            <p 
              className="text-lg md:text-xl mb-4 max-w-2xl mx-auto"
              style={{ color: showImage ? 'rgba(255,255,255,0.9)' : descriptionColor }}
            >
              {collection.description}
            </p>
          )}
          {showProductCount && collection.product_count !== undefined && (
            <p className="text-sm opacity-90">
              {collection.product_count} {t('product.items') || 'פריטים'}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Default: banner layout
  return (
    <div className={`py-8 ${textAlignClasses}`}>
      {showImage && collection.image_url && (
        <div className="mb-6">
          <img
            src={collection.image_url}
            alt={collection.title}
            className="w-full h-64 object-cover rounded-lg"
          />
        </div>
      )}
      <h1 
        className={`${titleSizeClasses} font-bold mb-4`}
        style={{ color: titleColor }}
      >
        {collection.title}
      </h1>
      {showDescription && collection.description && (
        <p 
          className="text-lg mb-2"
          style={{ color: descriptionColor }}
        >
          {collection.description}
        </p>
      )}
      {showProductCount && collection.product_count !== undefined && (
        <p className="text-sm text-gray-500">
          {collection.product_count} {t('product.items') || 'פריטים'}
        </p>
      )}
    </div>
  );
}

// Collection Description Section
export function CollectionDescriptionSection({ section, collection, onUpdate }: CollectionSectionProps) {
  const settings = section.settings || {};
  const { t } = useTranslation('storefront');
  const [showingFull, setShowingFull] = React.useState(false);
  
  if (!collection || !collection.description) {
    return null;
  }

  // Get all settings
  const showFull = settings.show_full === true;
  const maxChars = settings.max_characters || 200;
  const readMoreText = settings.read_more_text || t('common.read_more') || 'קרא עוד';
  const textSize = settings.text_size || 'medium';
  const textAlign = settings.text_align || 'right';
  const textColor = settings.text_color || '#4B5563';

  // Text size classes
  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  }[textSize] || 'text-base';

  // Text alignment classes
  const textAlignClasses = {
    right: 'text-right',
    center: 'text-center',
    left: 'text-left',
  }[textAlign] || 'text-right';

  const shouldTruncate = !showFull && collection.description.length > maxChars && !showingFull;
  const displayDescription = shouldTruncate
    ? collection.description.substring(0, maxChars) + '...'
    : collection.description;

  return (
    <div className={`py-4 ${textAlignClasses}`}>
      <div 
        className={`prose max-w-none ${textSizeClasses}`}
        style={{ color: textColor }}
        dangerouslySetInnerHTML={{ __html: displayDescription }}
      />
      {!showFull && collection.description.length > maxChars && (
        <button
          onClick={() => setShowingFull(!showingFull)}
          className="mt-2 text-sm font-medium text-gray-900 hover:text-gray-700 underline"
        >
          {showingFull ? (t('common.show_less') || 'הצג פחות') : readMoreText}
        </button>
      )}
    </div>
  );
}

// Collection Filters Section with real functionality
export function CollectionFiltersSection({ section, collection, onUpdate }: CollectionSectionProps) {
  const settings = section.settings || {};
  const { t } = useTranslation('storefront');
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get all settings
  const layout = settings.layout || 'horizontal';
  const showPriceFilter = settings.show_price_filter !== false;
  const showAvailabilityFilter = settings.show_availability_filter !== false;
  const showVendorFilter = settings.show_vendor_filter !== false;
  const showTypeFilter = settings.show_type_filter !== false;
  const showSort = settings.show_sort !== false;
  const defaultSort = settings.default_sort || 'newest';
  const filterBgColor = settings.filter_bg_color || '#FFFFFF';
  const filterTextColor = settings.filter_text_color || '#374151';
  const activeFilterColor = settings.active_filter_color || '#111827';

  // Get current filter values from URL
  const currentSort = searchParams.get('sort') || defaultSort;
  const currentPriceRange = searchParams.get('price') || 'all';
  const currentAvailability = searchParams.get('availability') || 'all';

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all' || value === defaultSort) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    // Reset to page 1 when filters change
    params.delete('page');
    router.push(`?${params.toString()}`);
  };

  const selectStyle = {
    backgroundColor: filterBgColor,
    color: filterTextColor,
    borderColor: '#D1D5DB',
  };

  return (
    <div 
      className="py-4 rounded-lg"
      style={{ backgroundColor: filterBgColor }}
    >
      <div className="flex flex-wrap items-center gap-4">
        {showSort && (
          <div className="flex items-center gap-2">
            <label 
              className="text-sm font-medium"
              style={{ color: filterTextColor }}
            >
              {t('collection.sort') || 'מיון'}:
            </label>
            <select 
              value={currentSort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
              style={selectStyle}
            >
              <option value="newest">{t('collection.sort_newest') || 'חדש ביותר'}</option>
              <option value="oldest">{t('collection.sort_oldest') || 'ישן ביותר'}</option>
              <option value="price-low">{t('collection.sort_price_low') || 'מחיר: נמוך לגבוה'}</option>
              <option value="price-high">{t('collection.sort_price_high') || 'מחיר: גבוה לנמוך'}</option>
              <option value="name-asc">{t('collection.sort_name_asc') || 'שם: א-ב'}</option>
              <option value="name-desc">{t('collection.sort_name_desc') || 'שם: ב-א'}</option>
              <option value="popularity">{t('collection.sort_popularity') || 'פופולריות'}</option>
            </select>
          </div>
        )}
        
        {showPriceFilter && (
          <div className="flex items-center gap-2">
            <label 
              className="text-sm font-medium"
              style={{ color: filterTextColor }}
            >
              {t('collection.price_range') || 'טווח מחירים'}:
            </label>
            <select 
              value={currentPriceRange}
              onChange={(e) => handleFilterChange('price', e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
              style={selectStyle}
            >
              <option value="all">{t('collection.all_prices') || 'כל המחירים'}</option>
              <option value="0-100">₪0 - ₪100</option>
              <option value="100-200">₪100 - ₪200</option>
              <option value="200-500">₪200 - ₪500</option>
              <option value="500+">₪500+</option>
            </select>
          </div>
        )}
        
        {showAvailabilityFilter && (
          <div className="flex items-center gap-2">
            <label 
              className="text-sm font-medium"
              style={{ color: filterTextColor }}
            >
              {t('collection.availability') || 'זמינות'}:
            </label>
            <select 
              value={currentAvailability}
              onChange={(e) => handleFilterChange('availability', e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
              style={selectStyle}
            >
              <option value="all">{t('collection.all') || 'הכל'}</option>
              <option value="in_stock">{t('product.in_stock') || 'במלאי'}</option>
              <option value="out_of_stock">{t('product.out_of_stock') || 'אזל מהמלאי'}</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

// Collection Products Section
export function CollectionProductsSection({ section, collection, products = [], onUpdate, storeId }: CollectionSectionProps) {
  const settings = section.settings || {};
  const { t } = useTranslation('storefront');
  const params = useParams();
  const storeSlug = params?.storeSlug as string || '';
  
  // Get all settings
  const productsPerRow = settings.products_per_row || 4;
  const productsPerRowTablet = settings.products_per_row_tablet || 3;
  const productsPerRowMobile = settings.products_per_row_mobile || 2;
  const productsPerPage = settings.products_per_page || 12;
  const cardStyle = settings.card_style || 'minimal';
  const showShadow = settings.show_shadow !== false;
  const showBorder = settings.show_border === true;
  const imageRatio = settings.image_ratio || 'square';
  const gap = settings.gap || 'medium';
  const showPrice = settings.show_price !== false;
  const showComparePrice = settings.show_compare_price !== false;
  const showVendor = settings.show_vendor === true;
  const showRating = settings.show_rating === true;
  const showBadges = settings.show_badges !== false;
  const showColorSwatches = settings.show_color_swatches !== false;
  const showQuickView = settings.show_quick_view !== false;
  const showAddToCart = settings.show_add_to_cart === true;
  const showWishlist = settings.show_wishlist === true;
  const emptyText = settings.empty_text || t('collection.no_products') || 'אין מוצרים בקטגוריה זו כרגע';

  // Gap classes
  const gapClasses = {
    small: 'gap-3',
    medium: 'gap-6',
    large: 'gap-8',
  }[gap] || 'gap-6';

  // Use client component for dynamic loading with filters
  if (collection?.handle && storeId) {
    return (
      <CollectionProductsClient
        collectionHandle={collection.handle}
        storeId={storeId}
        initialProducts={products}
        initialTotal={collection?.product_count || 0}
      />
    );
  }

  // Fallback to static products if no collection handle
  if (!products || products.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500 text-lg mb-4">
          {emptyText}
        </p>
      </div>
    );
  }

  // Responsive grid classes
  const gridCols = `grid-cols-${productsPerRowMobile} md:grid-cols-${productsPerRowTablet} lg:grid-cols-${productsPerRow}`;

  return (
    <div className="py-8">
      <div className={`grid ${gridCols} ${gapClasses}`}>
        {products.map((product: any) => {
          // Shopify logic: Every product has at least one variant
          // Price always comes from variants[0] (or from product.price if it's already calculated)
          const productForCard = {
            id: product.id,
            title: product.title,
            handle: product.handle,
            image: product.image,
            price: product.price || 0,
            compare_at_price: product.compare_at_price,
            colors: product.colors,
            vendor: product.vendor,
          };
          
          return (
            <ProductCard 
              key={product.id} 
              product={productForCard}
              storeSlug={storeSlug}
              variant={cardStyle === 'minimal' ? 'minimal' : cardStyle === 'detailed' ? 'card' : 'default'}
            />
          );
        })}
      </div>
    </div>
  );
}

// Collection Pagination Section with real functionality
export function CollectionPaginationSection({ section, collection, onUpdate }: CollectionSectionProps) {
  const settings = section.settings || {};
  const { t } = useTranslation('storefront');
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get all settings
  const style = settings.style || 'numbers';
  const loadMoreText = settings.load_more_text || t('collection.load_more') || 'טען עוד מוצרים';
  const showPageNumbers = settings.show_page_numbers !== false;
  const showPrevNext = settings.show_prev_next !== false;
  const nextText = settings.next_text || t('pagination.next') || 'הבא';
  const prevText = settings.prev_text || t('pagination.previous') || 'הקודם';
  const alignment = settings.alignment || 'center';
  const buttonBgColor = settings.button_bg_color || '#FFFFFF';
  const buttonTextColor = settings.button_text_color || '#374151';
  const activeButtonColor = settings.active_button_color || '#111827';

  // Alignment classes
  const alignmentClasses = {
    right: 'justify-end',
    center: 'justify-center',
    left: 'justify-start',
  }[alignment] || 'justify-center';

  // Get pagination data from props (passed from CustomizerLayout)
  // For now, we'll use URL params to determine current page
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  
  // Get total pages from collection data if available
  // This should be passed as a prop, but for now we'll calculate from product count
  const productsPerPage = 20;
  const totalProducts = collection?.product_count || 0;
  const totalPages = Math.ceil(totalProducts / productsPerPage);

  if (totalPages <= 1) {
    return null;
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete('page');
    } else {
      params.set('page', page.toString());
    }
    router.push(`?${params.toString()}`);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buttonStyle = {
    backgroundColor: buttonBgColor,
    color: buttonTextColor,
    borderColor: '#D1D5DB',
  };

  const activeButtonStyle = {
    backgroundColor: activeButtonColor,
    color: '#FFFFFF',
    borderColor: activeButtonColor,
  };

  if (style === 'load_more') {
    return (
      <div className={`py-8 flex ${alignmentClasses}`}>
        {currentPage < totalPages && (
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            className="px-6 py-3 border rounded-lg hover:opacity-80 transition-colors"
            style={buttonStyle}
          >
            {loadMoreText}
          </button>
        )}
      </div>
    );
  }

  if (style === 'infinite') {
    // Infinite scroll handled by client component
    return null;
  }

  // Default: numbers pagination
  const pages = [];
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className={`py-8 flex ${alignmentClasses} items-center gap-2`}>
      {showPrevNext && currentPage > 1 && (
        <button 
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-4 py-2 border rounded-lg hover:opacity-80 transition-colors"
          style={buttonStyle}
        >
          {prevText}
        </button>
      )}
      
      {showPageNumbers && pages.map((page) => (
        <button
          key={page}
          onClick={() => handlePageChange(page)}
          className="px-4 py-2 border rounded-lg transition-colors"
          style={page === currentPage ? activeButtonStyle : buttonStyle}
        >
          {page}
        </button>
      ))}
      
      {showPrevNext && currentPage < totalPages && (
        <button 
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-4 py-2 border rounded-lg hover:opacity-80 transition-colors"
          style={buttonStyle}
        >
          {nextText}
        </button>
      )}
    </div>
  );
}

