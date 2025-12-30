/**
 * Page Content Component
 * מרנדר רק את תוכן הדף (בלי הדר/פוטר - הם ב-layout)
 * ✅ SSR - כל התוכן נטען בשרת (מהיר כמו PHP)
 */

import React from 'react';
import { getPageLayout } from '@/lib/customizer/getPageConfig';
import { StorefrontSectionRenderer } from './StorefrontSectionRenderer';
import { getDefaultSectionsForPage } from '@/lib/customizer/templates/new-york';
import { getProductByHandle, getProductsList } from '@/lib/storefront/queries';
import { getCollectionByHandle } from '@/lib/storefront/queries';
import { ProductPageProvider } from '@/contexts/ProductPageContext';
import { loadFeaturedProductsData, loadFeaturedCollectionsData, loadProductReviewsData, loadRelatedProductsData, loadRecentlyViewedData } from '@/lib/storefront/loadSectionData';
import { FloatingAdvisorButton } from './FloatingAdvisorButton';

interface PageContentProps {
  storeSlug: string;
  storeId: number;
  pageType: string;
  pageHandle?: string;
  children?: React.ReactNode;
}

export async function PageContent({ 
  storeSlug, 
  storeId,
  pageType,
  pageHandle,
  children 
}: PageContentProps) {
  const startTime = Date.now();
  
  // Load page layout
  const pageLayout = await getPageLayout(storeId, pageType, pageHandle);
  
  let sections = [];
  if (pageLayout && pageLayout.sections && pageLayout.sections.length > 0) {
    sections = pageLayout.sections;
  } else {
    sections = getDefaultSectionsForPage(pageType);
  }

  // Filter out header and footer - they're handled by layout
  let contentSections = sections.filter((s: any) => 
    s.type !== 'header' && s.type !== 'footer' && s.visible !== false
  );

  // Load page-specific data
  let product = null;
  let collection = null;
  let products: any[] = [];

  if (pageType === 'product' && pageHandle) {
    product = await getProductByHandle(pageHandle, storeId);
  }

  if (pageType === 'collection' && pageHandle) {
    if (pageHandle === 'all') {
      products = await getProductsList(storeId, { limit: 20, offset: 0 });
      collection = {
        id: 0,
        title: 'כל המוצרים',
        handle: 'all',
        description: '',
        image_url: null,
        product_count: products.length
      };
    } else {
      const collectionData = await getCollectionByHandle(pageHandle, storeId, { limit: 20, offset: 0 });
      collection = collectionData.collection;
      products = collectionData.products || [];
    }
  }

  // Load preloaded data for sections that need it
  const featuredProductsSections = contentSections.filter((s: any) => s.type === 'featured_products');
  const featuredCollectionsSections = contentSections.filter((s: any) => s.type === 'featured_collections');
  const productReviewsSections = contentSections.filter((s: any) => s.type === 'product_reviews');
  const relatedProductsSections = contentSections.filter((s: any) => s.type === 'related_products');
  const recentlyViewedSections = contentSections.filter((s: any) => s.type === 'recently_viewed' || s.type === 'product_recently_viewed');
  
  const sectionDataPromises: Promise<any>[] = [];
  
  for (const section of featuredProductsSections) {
    sectionDataPromises.push(
      loadFeaturedProductsData(storeId, section.settings || {}).then(data => ({
        sectionId: section.id,
        type: 'featured_products',
        data,
      }))
    );
  }
  
  for (const section of featuredCollectionsSections) {
    sectionDataPromises.push(
      loadFeaturedCollectionsData(storeId, section.settings || {}).then(data => ({
        sectionId: section.id,
        type: 'featured_collections',
        data,
      }))
    );
  }
  
  if (pageType === 'product' && product && productReviewsSections.length > 0) {
    for (const section of productReviewsSections) {
      sectionDataPromises.push(
        loadProductReviewsData(product.id).then(data => ({
          sectionId: section.id,
          type: 'product_reviews',
          data,
        }))
      );
    }
  }
  
  if (pageType === 'product' && product && relatedProductsSections.length > 0) {
    for (const section of relatedProductsSections) {
      const limit = section.settings?.products_count || 4;
      sectionDataPromises.push(
        loadRelatedProductsData(product.id, storeId, limit).then(data => ({
          sectionId: section.id,
          type: 'related_products',
          data,
        }))
      );
    }
  }
  
  if (pageType === 'product' && product && recentlyViewedSections.length > 0) {
    for (const section of recentlyViewedSections) {
      const limit = section.settings?.products_count || 4;
      sectionDataPromises.push(
        loadRecentlyViewedData(storeId, product.id, limit).then(data => ({
          sectionId: section.id,
          type: 'recently_viewed',
          data,
        }))
      );
    }
  }
  
  const sectionDataResults = await Promise.all(sectionDataPromises);
  
  const sectionDataMap = new Map(
    sectionDataResults.map(result => [result.sectionId, result.data])
  );
  
  contentSections = contentSections.map((section: any) => {
    const preloadedData = sectionDataMap.get(section.id);
    if (preloadedData) {
      return {
        ...section,
        _preloadedData: preloadedData,
      };
    }
    return section;
  });

  // Render based on page type
  if (pageType === 'product' && product) {
    return (
      <ProductPageProvider product={product}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 2-Column Layout for Product Page */}
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
                    storeSlug={storeSlug}
                  />
                ))}
            </div>
            
            {/* Right Column - Product Info */}
            <div className="space-y-4">
              {contentSections
                .filter((s: any) => ['product_title', 'product_name', 'product_price', 'product_variants', 'product_variations', 'product_add_to_cart', 'product_description', 'product_custom_fields'].includes(s.type))
                .map((section: any) => (
                  <StorefrontSectionRenderer 
                    key={section.id} 
                    section={section}
                    product={product}
                    storeId={storeId}
                    storeSlug={storeSlug}
                  />
                ))}
            </div>
          </div>
          
          {/* Full Width Sections */}
          <div className="mt-12 space-y-8">
            {contentSections
              .filter((s: any) => ['product_reviews', 'related_products', 'recently_viewed', 'product_recently_viewed'].includes(s.type))
              .map((section: any) => (
                <StorefrontSectionRenderer 
                  key={section.id} 
                  section={section}
                  product={product}
                  storeId={storeId}
                  storeSlug={storeSlug}
                />
              ))}
          </div>
        </div>
        {children}
      </ProductPageProvider>
    );
  }

  if (pageType === 'collection' && collection) {
    return (
      <>
        {contentSections.map((section: any) => (
          <StorefrontSectionRenderer 
            key={section.id} 
            section={section}
            collection={collection}
            products={products}
            storeId={storeId}
            storeSlug={storeSlug}
          />
        ))}
        {children}
      </>
    );
  }

  // Home page or other pages
  return (
    <>
      {contentSections.map((section: any) => (
        <StorefrontSectionRenderer 
          key={section.id} 
          section={section}
          storeId={storeId}
          storeSlug={storeSlug}
        />
      ))}
      {children}
      
      {/* Floating Advisor Button - only on home page */}
      {pageType === 'home' && (
        <FloatingAdvisorButton storeSlug={storeSlug} storeId={storeId} />
      )}
    </>
  );
}

