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
      <div className={`py-12 bg-white`}>
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${textAlignClasses}`}>
          <div className={`max-w-3xl ${textAlign === 'center' ? 'mx-auto' : ''}`}>
            <h1 
              className={`${titleSizeClasses} font-bold mb-4 tracking-tight`}
              style={{ color: titleColor }}
            >
              {collection.title}
            </h1>
            {showDescription && collection.description && (
              <div 
                className="text-lg mb-4 leading-relaxed"
                style={{ color: descriptionColor }}
                dangerouslySetInnerHTML={{ __html: collection.description }}
              />
            )}
            {showProductCount && collection.product_count !== undefined && (
              <p className="text-sm font-medium text-gray-500">
                {collection.product_count} {t('product.products') === 'product.products' ? 'מוצרים' : t('product.products')}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (layout === 'hero') {
    const hasImageToShow = showImage && collection.image_url;
    return (
      <div className={`relative ${bannerHeightClasses} flex ${contentPositionClasses} ${!hasImageToShow ? 'bg-gray-50' : ''}`}>
        {hasImageToShow && (
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
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`max-w-3xl ${textAlign === 'center' ? 'mx-auto' : textAlign === 'left' ? 'mr-auto' : 'ml-auto'} ${textAlignClasses}`}>
            <h1 
              className={`${titleSizeClasses} font-bold mb-4 tracking-tight`}
              style={{ color: hasImageToShow ? '#FFFFFF' : titleColor }}
            >
              {collection.title}
            </h1>
            {showDescription && collection.description && (
              <div 
                className="text-lg md:text-xl mb-6 leading-relaxed"
                style={{ color: hasImageToShow ? 'rgba(255,255,255,0.95)' : descriptionColor }}
                dangerouslySetInnerHTML={{ __html: collection.description }}
              />
            )}
            {showProductCount && collection.product_count !== undefined && (
              <p 
                className="text-sm font-medium"
                style={{ color: hasImageToShow ? 'rgba(255,255,255,0.9)' : '#6B7280' }}
              >
                {collection.product_count} {t('product.items') || 'מוצרים'}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default: banner layout
  return (
    <div className={`py-12 bg-white`}>
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${textAlignClasses}`}>
        {showImage && collection.image_url && (
          <div className="mb-8 overflow-hidden rounded-2xl bg-gray-100 aspect-[21/9]">
            <img
              src={collection.image_url}
              alt={collection.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className={`max-w-3xl ${textAlign === 'center' ? 'mx-auto' : ''}`}>
          <h1 
            className={`${titleSizeClasses} font-bold mb-4 tracking-tight`}
            style={{ color: titleColor }}
          >
            {collection.title}
          </h1>
          {showDescription && collection.description && (
            <div 
              className="text-lg mb-4 leading-relaxed"
              style={{ color: descriptionColor }}
              dangerouslySetInnerHTML={{ __html: collection.description }}
            />
          )}
          {showProductCount && collection.product_count !== undefined && (
            <p className="text-sm font-medium text-gray-500">
              {collection.product_count} {t('product.products') === 'product.products' ? 'מוצרים' : t('product.products')}
            </p>
          )}
        </div>
      </div>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
    backgroundColor: 'transparent',
    color: filterTextColor,
    border: 'none',
    paddingRight: '0',
    paddingLeft: '1.5rem', // For chevron space
    fontSize: '0.95rem',
    fontWeight: '500',
    cursor: 'pointer',
    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
    backgroundPosition: 'left center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '1.5em 1.5em',
    appearance: 'none',
    WebkitAppearance: 'none'
  };

  return (
    <div 
      className="sticky top-0 z-20 border-b border-gray-100 backdrop-blur-md bg-white/90"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            {showSort && (
              <div className="relative group">
                <span className="absolute -top-2.5 right-0 text-[10px] text-gray-500 bg-white px-1">
                  {t('collection.sort') || 'מיון'}
                </span>
                <select 
                  value={currentSort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="focus:ring-0 focus:outline-none py-2"
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
              <div className="relative group">
                <span className="absolute -top-2.5 right-0 text-[10px] text-gray-500 bg-white px-1">
                  {t('collection.price_range') || 'מחיר'}
                </span>
                <select 
                  value={currentPriceRange}
                  onChange={(e) => handleFilterChange('price', e.target.value)}
                  className="focus:ring-0 focus:outline-none py-2"
                  style={selectStyle}
                >
                  <option value="all">{t('collection.all_prices') || 'הכל'}</option>
                  <option value="0-100">₪0 - ₪100</option>
                  <option value="100-200">₪100 - ₪200</option>
                  <option value="200-500">₪200 - ₪500</option>
                  <option value="500+">₪500+</option>
                </select>
              </div>
            )}
            
            {showAvailabilityFilter && (
              <div className="relative group">
                <span className="absolute -top-2.5 right-0 text-[10px] text-gray-500 bg-white px-1">
                  {t('collection.availability') || 'זמינות'}
                </span>
                <select 
                  value={currentAvailability}
                  onChange={(e) => handleFilterChange('availability', e.target.value)}
                  className="focus:ring-0 focus:outline-none py-2"
                  style={selectStyle}
                >
                  <option value="all">{t('collection.all') || 'הכל'}</option>
                  <option value="in_stock">{t('product.in_stock') || 'במלאי'}</option>
                  <option value="out_of_stock">{t('product.out_of_stock') || 'אזל מהמלאי'}</option>
                </select>
              </div>
            )}
          </div>
          
          <div className="hidden md:block text-sm text-gray-500">
            {collection?.product_count || 0} {t('product.products') === 'product.products' ? 'מוצרים' : t('product.products')}
          </div>
        </div>
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

  // Use client component for dynamic loading with filters (only in storefront, not in customizer)
  if (collection?.handle && storeId) {
    return (
      <CollectionProductsClient
        collectionHandle={collection.handle}
        storeId={storeId}
        initialProducts={products}
        initialTotal={collection?.product_count || 0}
        settings={{
          productsPerRow,
          productsPerRowTablet,
          productsPerRowMobile,
          cardStyle,
          showShadow,
          showBorder,
          imageRatio,
          gap,
          showPrice,
          showComparePrice,
          showVendor,
          showRating,
          showBadges,
          showColorSwatches,
          showQuickView,
          showAddToCart,
          showWishlist,
          emptyText
        }}
      />
    );
  }

  // For customizer or fallback: use static products display
  if (!products || products.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500 text-lg mb-4">
          {emptyText}
        </p>
      </div>
    );
  }

  // Map settings to actual Tailwind classes (safe for JIT)
  const gridColsClasses = {
    mobile: {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
    }[productsPerRowMobile] || 'grid-cols-2',
    tablet: {
      2: 'md:grid-cols-2',
      3: 'md:grid-cols-3',
      4: 'md:grid-cols-4',
    }[productsPerRowTablet] || 'md:grid-cols-3',
    desktop: {
      2: 'lg:grid-cols-2',
      3: 'lg:grid-cols-3',
      4: 'lg:grid-cols-4',
      5: 'lg:grid-cols-5',
      6: 'lg:grid-cols-6',
    }[productsPerRow] || 'lg:grid-cols-4',
  };

  const gridClasses = `${gridColsClasses.mobile} ${gridColsClasses.tablet} ${gridColsClasses.desktop}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8">
        <div className={`grid ${gridClasses} ${gapClasses}`}>
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
              showPrice={showPrice}
              showComparePrice={showComparePrice}
              showWishlist={showWishlist}
              showBadges={showBadges}
              showColorSwatches={showColorSwatches}
              showVendor={showVendor}
              showRating={showRating}
              showQuickView={showQuickView}
              showAddToCart={showAddToCart}
              showShadow={showShadow}
              showBorder={showBorder}
              imageRatio={imageRatio}
            />
          );
        })}
        </div>
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
      <div className={`py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex ${alignmentClasses}`}>
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
    <div className={`py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex ${alignmentClasses} items-center gap-2`}>
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

