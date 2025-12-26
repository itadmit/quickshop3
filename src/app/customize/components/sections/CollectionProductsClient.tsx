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
}

function CollectionProductsClientComponent({ 
  collectionHandle, 
  storeId,
  initialProducts = [],
  initialTotal = 0
}: CollectionProductsClientProps) {
  const searchParams = useSearchParams();
  const params = useParams();
  const storeSlug = params?.storeSlug as string || '';
  const { t } = useTranslation('storefront');
  
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);
  
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
        queryParams.set('collectionHandle', collectionHandle);
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

    // Only reload if filters changed (not on initial mount if we have initialProducts)
    if (initialProducts.length > 0 && page === 1 && sort === 'newest' && priceRange === 'all' && availability === 'all') {
      // Use initial products
      return;
    }

    loadProducts();
  }, [collectionHandle, storeId, sort, priceRange, availability, page, offset, initialProducts.length]);

  if (loading) {
    return (
      <div className="py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-lg mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500 text-lg mb-4">
          {t('collection.no_products') || 'אין מוצרים בקטגוריה זו כרגע'}
        </p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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

