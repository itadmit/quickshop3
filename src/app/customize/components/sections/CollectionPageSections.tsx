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

  const layout = settings.layout || 'banner';
  const showImage = settings.show_image !== false;
  const showDescription = settings.show_description !== false;
  const showProductCount = settings.show_product_count !== false;

  if (layout === 'simple') {
    return (
      <div className="py-6">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          {collection.title}
        </h1>
        {showDescription && collection.description && (
          <p className="text-lg text-gray-600 mb-2">{collection.description}</p>
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
      <div className="relative py-16 md:py-24">
        {showImage && collection.image_url && (
          <div className="absolute inset-0 z-0">
            <img
              src={collection.image_url}
              alt={collection.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>
        )}
        <div className="relative z-10 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {collection.title}
          </h1>
          {showDescription && collection.description && (
            <p className="text-lg md:text-xl mb-4 max-w-2xl mx-auto">
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
    <div className="py-8">
      {showImage && collection.image_url && (
        <div className="mb-6">
          <img
            src={collection.image_url}
            alt={collection.title}
            className="w-full h-64 object-cover rounded-lg"
          />
        </div>
      )}
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
        {collection.title}
      </h1>
      {showDescription && collection.description && (
        <p className="text-lg text-gray-600 mb-2">{collection.description}</p>
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
  
  if (!collection || !collection.description) {
    return null;
  }

  const showFull = settings.show_full === true;
  const maxChars = settings.max_characters || 200;
  const description = showFull 
    ? collection.description 
    : collection.description.substring(0, maxChars) + (collection.description.length > maxChars ? '...' : '');

  return (
    <div className="py-4">
      <div 
        className="prose prose-sm max-w-none text-gray-600"
        dangerouslySetInnerHTML={{ __html: description }}
      />
    </div>
  );
}

// Collection Filters Section with real functionality
export function CollectionFiltersSection({ section, collection, onUpdate }: CollectionSectionProps) {
  const settings = section.settings || {};
  const { t } = useTranslation('storefront');
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const layout = settings.layout || 'sidebar';
  const showPriceFilter = settings.show_price_filter !== false;
  const showAvailabilityFilter = settings.show_availability_filter !== false;
  const showVendorFilter = settings.show_vendor_filter !== false;
  const showSort = settings.show_sort !== false;

  // Get current filter values from URL
  const currentSort = searchParams.get('sort') || 'newest';
  const currentPriceRange = searchParams.get('price') || 'all';
  const currentAvailability = searchParams.get('availability') || 'all';

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all' || value === 'newest') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    // Reset to page 1 when filters change
    params.delete('page');
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="py-4">
      <div className="flex flex-wrap items-center gap-4">
        {showSort && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              {t('collection.sort') || 'מיון'}:
            </label>
            <select 
              value={currentSort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="newest">{t('collection.sort_newest') || 'חדש ביותר'}</option>
              <option value="oldest">{t('collection.sort_oldest') || 'ישן ביותר'}</option>
              <option value="price-low">{t('collection.sort_price_low') || 'מחיר: נמוך לגבוה'}</option>
              <option value="price-high">{t('collection.sort_price_high') || 'מחיר: גבוה לנמוך'}</option>
              <option value="name-asc">{t('collection.sort_name_asc') || 'שם: א-ב'}</option>
              <option value="name-desc">{t('collection.sort_name_desc') || 'שם: ב-א'}</option>
            </select>
          </div>
        )}
        
        {showPriceFilter && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              {t('collection.price_range') || 'טווח מחירים'}:
            </label>
            <select 
              value={currentPriceRange}
              onChange={(e) => handleFilterChange('price', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
            <label className="text-sm font-medium text-gray-700">
              {t('collection.availability') || 'זמינות'}:
            </label>
            <select 
              value={currentAvailability}
              onChange={(e) => handleFilterChange('availability', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
  
  const productsPerRow = settings.products_per_row || 4;
  const productsPerRowMobile = settings.products_per_row_mobile || 2;
  const cardStyle = settings.card_style || 'default';

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
          {t('collection.no_products') || 'אין מוצרים בקטגוריה זו כרגע'}
        </p>
      </div>
    );
  }

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-6',
  }[productsPerRow] || 'grid-cols-2 md:grid-cols-4';

  return (
    <div className="py-8">
      <div className={`grid ${gridCols} gap-6`}>
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
          };
          
          return (
            <ProductCard 
              key={product.id} 
              product={productForCard}
              storeSlug={storeSlug}
              variant="minimal"
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
  
  // Get pagination data from props (passed from CustomizerLayout)
  // For now, we'll use URL params to determine current page
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  
  // Get total pages from collection data if available
  // This should be passed as a prop, but for now we'll calculate from product count
  const productsPerPage = 20;
  const totalProducts = collection?.product_count || 0;
  const totalPages = Math.ceil(totalProducts / productsPerPage);
  const style = settings.style || 'numbers';

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

  if (style === 'load_more') {
    return (
      <div className="py-8 text-center">
        {currentPage < totalPages && (
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {settings.load_more_text || t('collection.load_more') || 'טען עוד מוצרים'}
          </button>
        )}
      </div>
    );
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
    <div className="py-8 flex justify-center items-center gap-2">
      {currentPage > 1 && (
        <button 
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {t('pagination.previous') || 'הקודם'}
        </button>
      )}
      
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => handlePageChange(page)}
          className={`px-4 py-2 border rounded-lg transition-colors ${
            page === currentPage
              ? 'bg-gray-900 text-white border-gray-900'
              : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          {page}
        </button>
      ))}
      
      {currentPage < totalPages && (
        <button 
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {t('pagination.next') || 'הבא'}
        </button>
      )}
    </div>
  );
}

