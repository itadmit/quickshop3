'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components/storefront/ProductCard';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { HiPhotograph } from 'react-icons/hi';

interface CollectionProductsClientProps {
  collectionHandle: string;
  storeId: number;
  initialProducts?: any[];
  initialTotal?: number;
  settings?: {
    productsPerRow?: number;
    productsPerRowTablet?: number;
    productsPerRowMobile?: number;
    cardStyle?: string;
    showShadow?: boolean;
    showBorder?: boolean;
    imageRatio?: string;
    gap?: string;
    showPrice?: boolean;
    showComparePrice?: boolean;
    showVendor?: boolean;
    showRating?: boolean;
    showBadges?: boolean;
    showColorSwatches?: boolean;
    showQuickView?: boolean;
    showAddToCart?: boolean;
    showWishlist?: boolean;
    emptyText?: string;
    saleBadgeText?: string;
    soldOutText?: string;
    newBadgeText?: string;
  };
}

function CollectionProductsClientComponent({ 
  collectionHandle, 
  storeId,
  initialProducts = [],
  initialTotal = 0,
  settings = {}
}: CollectionProductsClientProps) {
  const searchParams = useSearchParams();
  const params = useParams();
  const storeSlug = params?.storeSlug as string || '';
  const { t } = useTranslation('storefront');
  
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);
  
  // Extract settings with defaults
  const productsPerRow = settings.productsPerRow || 4;
  const productsPerRowTablet = settings.productsPerRowTablet || 3;
  const productsPerRowMobile = settings.productsPerRowMobile || 2;
  const cardStyle = settings.cardStyle || 'minimal';
  const gap = settings.gap || 'medium';
  const emptyText = settings.emptyText || t('collection.no_products') || 'אין מוצרים בקטגוריה זו כרגע';
  const showPrice = settings.showPrice !== false;
  const showComparePrice = settings.showComparePrice !== false;
  const showWishlist = settings.showWishlist !== false;
  const showBadges = settings.showBadges !== false;
  const showColorSwatches = settings.showColorSwatches !== false;
  const showVendor = settings.showVendor === true;
  const showRating = settings.showRating === true;
  const showQuickView = settings.showQuickView === true;
  const showAddToCart = settings.showAddToCart === true;
  const showShadow = settings.showShadow === true;
  const showBorder = settings.showBorder === true;
  const imageRatio = settings.imageRatio || 'square';
  const saleBadgeText = settings.saleBadgeText || 'מבצע';
  const soldOutText = settings.soldOutText || 'אזל מהמלאי';
  const newBadgeText = settings.newBadgeText || 'חדש';
  
  // Gap classes
  const gapClasses = {
    small: 'gap-3',
    medium: 'gap-6',
    large: 'gap-8',
  }[gap] || 'gap-6';
  
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
  
  // Get filters from URL
  const sort = searchParams.get('sort') || 'newest';
  const priceRange = searchParams.get('price') || 'all';
  const availability = searchParams.get('availability') || 'all';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  // Load products when filters change
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        // Build query params for storefront API
        const queryParams = new URLSearchParams();
        queryParams.set('storeId', storeId.toString());
        queryParams.set('collection', collectionHandle); // Note: API expects 'collection' not 'collectionHandle'
        queryParams.set('limit', limit.toString());
        queryParams.set('offset', offset.toString());
        if (sort !== 'newest') queryParams.set('sort', sort);
        if (priceRange !== 'all') queryParams.set('price', priceRange);
        if (availability !== 'all') queryParams.set('availability', availability);

        // Use storefront API endpoint (no auth required)
        const response = await fetch(`/api/storefront/products?${queryParams.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };

    // Always load products to ensure we have the latest data
    // The initialProducts are just for initial render, but we should fetch fresh data
    loadProducts();
  }, [collectionHandle, storeId, sort, priceRange, availability, page, offset, initialProducts.length]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <div className={`grid ${gridClasses} ${gapClasses}`}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-2" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-md mx-auto">
          <p className="text-gray-500 text-lg mb-6">
            {emptyText}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            רענן עמוד
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8">
        <div className={`grid ${gridClasses} ${gapClasses}`}>
          {products.map((product: any) => {
            // Shopify logic: Every product has at least one variant
            // Price always comes from variants[0].price
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
                saleBadgeText={saleBadgeText}
                soldOutText={soldOutText}
                newBadgeText={newBadgeText}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Memoize CollectionProductsClient to prevent re-renders
export const CollectionProductsClient = React.memo(CollectionProductsClientComponent, (prevProps, nextProps) => {
  // Compare props
  if (
    prevProps.collectionHandle !== nextProps.collectionHandle ||
    prevProps.storeId !== nextProps.storeId ||
    prevProps.initialTotal !== nextProps.initialTotal
  ) {
    return false; // Will re-render
  }
  
  // Compare settings (shallow comparison)
  const prevSettings = prevProps.settings || {};
  const nextSettings = nextProps.settings || {};
  const settingsKeys = new Set([...Object.keys(prevSettings), ...Object.keys(nextSettings)]);
  for (const key of settingsKeys) {
    if ((prevSettings as any)[key] !== (nextSettings as any)[key]) {
      return false; // Will re-render
    }
  }
  
  // Compare initialProducts array length and IDs
  const prevProducts = prevProps.initialProducts || [];
  const nextProducts = nextProps.initialProducts || [];
  if (prevProducts.length !== nextProducts.length) {
    return false; // Will re-render
  }
  
  // Compare product IDs
  for (let i = 0; i < prevProducts.length; i++) {
    if (prevProducts[i]?.id !== nextProducts[i]?.id) {
      return false; // Will re-render
    }
  }
  
  return true; // Skip re-render
});

