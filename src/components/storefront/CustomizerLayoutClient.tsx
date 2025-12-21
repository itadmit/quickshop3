/**
 * Customizer Layout Client - Client Component
 * טוען את הסקשנים מהשרת ומרנדר אותם בצד הלקוח
 * מתעדכן בזמן אמת בניווט client-side
 */

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { StorefrontSectionRenderer } from './StorefrontSectionRenderer';
import { ProductPageProvider } from '@/contexts/ProductPageContext';
import { FloatingAdvisorButton } from './FloatingAdvisorButton';

interface CustomizerLayoutClientProps {
  storeSlug: string;
  pageType: string;
  pageHandle?: string;
  children?: React.ReactNode;
}

interface PageLayoutData {
  sections: any[];
  store: any;
  storeId: number;
  product?: any;
  collection?: any;
  products?: any[];
}

// Cache for page layouts to avoid unnecessary re-fetches
const layoutCache: { [key: string]: { data: PageLayoutData; timestamp: number } } = {};
const CACHE_TTL = 60000; // 1 minute cache

// ============================================
// Page-Specific Skeletons
// ============================================

// Responsive Header Skeleton - shared between all page skeletons
function HeaderSkeleton() {
  return (
    <header className="h-14 md:h-16 bg-white border-b border-gray-200">
      {/* Desktop Header */}
      <div className="hidden md:flex max-w-7xl mx-auto px-4 h-full items-center justify-between">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="flex gap-4">
          <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </div>
      {/* Mobile Header: hamburger right, logo center, icons left */}
      <div className="md:hidden flex max-w-7xl mx-auto px-4 h-full items-center justify-between">
        {/* Right side - Hamburger menu */}
        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
        {/* Center - Logo */}
        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
        {/* Left side - Cart, Wishlist, Account */}
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-7 w-7 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-7 w-7 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </div>
    </header>
  );
}

function HomePageSkeleton() {
  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <HeaderSkeleton />
      
      {/* Hero Banner Skeleton */}
      <div className="w-full h-64 md:h-96 bg-gradient-to-l from-gray-100 to-gray-200 animate-pulse" />
      
      {/* Featured Products Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-3">
                <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Categories Section */}
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-40 mb-6 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </main>
      
      {/* Footer Skeleton */}
      <footer className="h-48 bg-gray-100 animate-pulse" />
    </div>
  );
}

function ProductPageSkeleton() {
  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <HeaderSkeleton />
      
      {/* Product Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Left Column - Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-16 h-16 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
          
          {/* Right Column - Product Info */}
          <div className="space-y-4">
            {/* Title */}
            <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
            {/* Price */}
            <div className="h-10 bg-gray-200 rounded w-1/4 animate-pulse" />
            {/* Variants */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
              <div className="flex gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-10 w-16 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            </div>
            {/* Quantity + Add to Cart */}
            <div className="flex gap-4 pt-4">
              <div className="h-12 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-12 flex-1 bg-gray-300 rounded animate-pulse" />
            </div>
          </div>
        </div>
        
        {/* Description Section */}
        <div className="mt-12 space-y-3">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-5/6 animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-4/5 animate-pulse" />
        </div>
      </main>
      
      {/* Footer Skeleton */}
      <footer className="h-48 bg-gray-100 animate-pulse" />
    </div>
  );
}

function CollectionPageSkeleton() {
  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <HeaderSkeleton />
      
      {/* Collection Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Collection Header */}
        <div className="mb-8">
          <div className="h-10 bg-gray-200 rounded w-56 mb-3 animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-96 max-w-full animate-pulse" />
        </div>
        
        {/* Filters Bar */}
        <div className="flex gap-4 mb-6">
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        
        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="space-y-3">
              <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse" />
            </div>
          ))}
        </div>
      </main>
      
      {/* Footer Skeleton */}
      <footer className="h-48 bg-gray-100 animate-pulse" />
    </div>
  );
}

function DefaultPageSkeleton() {
  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <HeaderSkeleton />
      
      {/* Content Skeleton */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-5/6 animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-4/5 animate-pulse" />
        </div>
      </main>
      
      {/* Footer Skeleton */}
      <footer className="h-48 bg-gray-100 animate-pulse" />
    </div>
  );
}

function getSkeletonForPageType(pageType: string) {
  switch (pageType) {
    case 'home':
      return <HomePageSkeleton />;
    case 'product':
      return <ProductPageSkeleton />;
    case 'collection':
    case 'collections':
    case 'categories':
      return <CollectionPageSkeleton />;
    default:
      return <DefaultPageSkeleton />;
  }
}

export function CustomizerLayoutClient({ 
  storeSlug, 
  pageType,
  pageHandle,
  children 
}: CustomizerLayoutClientProps) {
  const [layoutData, setLayoutData] = useState<PageLayoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create cache key
  const cacheKey = useMemo(() => {
    return `${storeSlug}_${pageType}_${pageHandle || ''}`;
  }, [storeSlug, pageType, pageHandle]);

  // Load page layout from API
  useEffect(() => {
    let isMounted = true;

    const loadPageLayout = async () => {
      // Check cache first
      const cached = layoutCache[cacheKey];
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setLayoutData(cached.data);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          storeSlug,
          pageType,
        });
        if (pageHandle) {
          params.set('pageHandle', pageHandle);
        }

        const response = await fetch(`/api/storefront/layout?${params}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Failed to load page layout');
        }

        const data = await response.json();
        
        if (isMounted) {
          // Cache the result
          layoutCache[cacheKey] = {
            data,
            timestamp: Date.now(),
          };
          
          setLayoutData(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading page layout:', err);
        if (isMounted) {
          setError('Failed to load page');
          setLoading(false);
        }
      }
    };

    loadPageLayout();

    return () => {
      isMounted = false;
    };
  }, [cacheKey, storeSlug, pageType, pageHandle]);

  // Loading skeleton - shows page-specific skeleton based on pageType
  if (loading) {
    return getSkeletonForPageType(pageType);
  }

  // Error state
  if (error || !layoutData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" dir="rtl">
        <p className="text-red-500">{error || 'שגיאה בטעינת העמוד'}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg"
        >
          נסה שוב
        </button>
      </div>
    );
  }

  const { sections, storeId, product, collection, products } = layoutData;

  // Filter sections
  const headerSection = sections.find((s: any) => s.type === 'header' && s.visible !== false);
  const footerSection = sections.find((s: any) => s.type === 'footer' && s.visible !== false);
  
  // Get content sections based on page type
  let contentSections: any[] = [];
  
  if (pageType === 'home' || pageType === undefined) {
    contentSections = sections.filter((s: any) => 
      s.type !== 'header' && s.type !== 'footer' && s.visible !== false
    );
  } else if (pageType === 'product' || pageType === 'collection') {
    contentSections = sections.filter((s: any) => 
      s.type !== 'header' && s.type !== 'footer' && s.visible !== false
    );
  }

  // Determine if we should show customizer sections or children
  const shouldShowCustomizerContent = 
    (pageType === 'product' && product) ||
    (pageType === 'collection' && collection) ||
    (pageType !== 'product' && pageType !== 'collection' && contentSections.length > 0);

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      {/* Header from Customizer */}
      {headerSection && (
        <StorefrontSectionRenderer section={headerSection} storeId={storeId} />
      )}
      
      {/* Main Content */}
      <main className="flex-1">
        {/* Wrap product page sections with ProductPageProvider for shared state */}
        {pageType === 'product' && product ? (
          <ProductPageProvider product={product}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* 2-Column Layout for Product Page (Desktop/Tablet) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 lg:gap-12">
                {/* Left Column - Gallery */}
                <div className="space-y-4">
                  {contentSections
                    .filter((s: any) => s.type === 'product_gallery')
                    .map((section: any) => (
                      <StorefrontSectionRenderer 
                        key={section.id} 
                        section={section}
                        product={product}
                        storeId={storeId}
                      />
                    ))}
                </div>
                
                {/* Right Column - Product Info (title, price, variants, add to cart) */}
                <div className="space-y-2">
                  {contentSections
                    .filter((s: any) => ['product_title', 'product_name', 'product_price', 'product_variants', 'product_variations', 'product_add_to_cart'].includes(s.type))
                    .map((section: any) => (
                      <StorefrontSectionRenderer 
                        key={section.id} 
                        section={section}
                        product={product}
                        storeId={storeId}
                      />
                    ))}
                </div>
              </div>
              
              {/* Full Width Sections - Description, Custom Fields, Reviews, Related, Recently Viewed */}
              <div className="mt-8 space-y-8">
                {contentSections
                  .filter((s: any) => ['product_description', 'product_custom_fields', 'product_reviews', 'related_products', 'recently_viewed', 'product_recently_viewed'].includes(s.type))
                  .map((section: any) => (
                    <StorefrontSectionRenderer 
                      key={section.id} 
                      section={section}
                      product={product}
                      storeId={storeId}
                    />
                  ))}
              </div>
            </div>
          </ProductPageProvider>
        ) : pageType === 'collection' && collection ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Collection page with customizer sections */}
            {contentSections.map((section: any) => (
              <StorefrontSectionRenderer 
                key={section.id} 
                section={section}
                product={product}
                collection={collection}
                products={products}
                storeId={storeId}
              />
            ))}
          </div>
        ) : shouldShowCustomizerContent ? (
          <>
            {/* Render content sections from customizer */}
            {contentSections.map((section: any) => (
              <StorefrontSectionRenderer 
                key={section.id} 
                section={section}
                product={product}
                collection={collection}
                products={products}
                storeId={storeId}
              />
            ))}
          </>
        ) : null}
        
        {/* For 'other' pages (login, register, account, etc.) - show children as main content */}
        {pageType === 'other' && children}
      </main>

      {/* Footer from Customizer */}
      {footerSection && (
        <StorefrontSectionRenderer section={footerSection} storeId={storeId} />
      )}
      
      {/* For non-'other' pages - show children after footer (for fixed elements like AdminEditBar) */}
      {pageType !== 'other' && children}

      {/* Floating Advisor Button - only on home page */}
      {pageType === 'home' && storeId && (
        <FloatingAdvisorButton storeSlug={storeSlug} storeId={storeId} />
      )}
    </div>
  );
}

