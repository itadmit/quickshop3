/**
 * Customizer Layout for Storefront
 * מציג את הסקשנים מהקסטומייזר בפרונט
 */

import React from 'react';
import { getPageLayout } from '@/lib/customizer/getPageConfig';
import { getStoreIdBySlug, getStoreBySlug } from '@/lib/utils/store';
import { StorefrontSectionRenderer } from './StorefrontSectionRenderer';
import { NEW_YORK_TEMPLATE, getDefaultSectionsForPage } from '@/lib/customizer/templates/new-york';
import { query } from '@/lib/db';
import { getProductByHandle, getProductsList } from '@/lib/storefront/queries';
import { getCollectionByHandle } from '@/lib/storefront/queries';
import { ProductPageProvider } from '@/contexts/ProductPageContext';
import { loadFeaturedProductsData, loadFeaturedCollectionsData, loadProductReviewsData, loadRelatedProductsData, loadRecentlyViewedData } from '@/lib/storefront/loadSectionData';

interface CustomizerLayoutProps {
  storeSlug: string;
  pageType?: string;
  pageHandle?: string;
  children?: React.ReactNode;
}

export async function CustomizerLayout({ 
  storeSlug, 
  pageType = 'home',
  pageHandle,
  children 
}: CustomizerLayoutProps) {
  const startTime = Date.now();
  console.log(`🚀 [CustomizerLayout] Loading ${pageType} page${pageHandle ? ` (${pageHandle})` : ''} for store: ${storeSlug}`);
  
  // ✅ טען store בבת אחת (ללא כפילות)
  const store = await getStoreBySlug(storeSlug);
  
  if (!store) {
    console.warn(`⚠️ [CustomizerLayout] Store not found: ${storeSlug}`);
    return <>{children}</>;
  }

  const storeId = store.id;
  console.log(`📦 [CustomizerLayout] Store loaded (${Date.now() - startTime}ms)`);

  // Load page layout from customizer
  // ✅ לדפים שאינם home - טען גם את layout של דף הבית לצורך הדר/פוטר משותפים
  const layoutPromises: Promise<any>[] = [
    getPageLayout(storeId, pageType, pageHandle)
  ];
  if (pageType !== 'home') {
    layoutPromises.push(getPageLayout(storeId, 'home', undefined));
  }
  
  const [pageLayout, homeLayout] = await Promise.all(layoutPromises);
  console.log(`📄 [CustomizerLayout] Page layout loaded (${Date.now() - startTime}ms)`);
  
  let sections = [];
  if (pageLayout && pageLayout.sections && pageLayout.sections.length > 0) {
    sections = pageLayout.sections;
  } else {
    // Use default template for specific page type if no custom layout exists
    // This ensures product pages get product sections, collection pages get collection sections, etc.
    sections = getDefaultSectionsForPage(pageType);
  }
  
  // ✅ תמיד להשתמש בהדר והפוטר מדף הבית (אם קיים) - לאחידות באתר
  if (homeLayout && homeLayout.sections && homeLayout.sections.length > 0) {
    const homeHeaderSection = homeLayout.sections.find((s: any) => s.type === 'header' && s.visible !== false);
    const homeFooterSection = homeLayout.sections.find((s: any) => s.type === 'footer' && s.visible !== false);
    
    // החלפת ההדר בהדר מדף הבית
    if (homeHeaderSection) {
      const currentHeaderIndex = sections.findIndex((s: any) => s.type === 'header');
      if (currentHeaderIndex !== -1) {
        sections[currentHeaderIndex] = homeHeaderSection;
      } else {
        sections.unshift(homeHeaderSection);
      }
    }
    
    // החלפת הפוטר בפוטר מדף הבית
    if (homeFooterSection) {
      const currentFooterIndex = sections.findIndex((s: any) => s.type === 'footer');
      if (currentFooterIndex !== -1) {
        sections[currentFooterIndex] = homeFooterSection;
      } else {
        sections.push(homeFooterSection);
      }
    }
  }
  

  // Helper function to load menu items from database
  const loadMenuItems = async (menuId: number | null | undefined) => {
    if (!menuId || !storeId) return null;
    try {
      const items = await query(
        `SELECT * FROM navigation_menu_items WHERE menu_id = $1 ORDER BY position`,
        [menuId]
      );
      return items.map((item: any) => ({
        label: item.title || item.label || '',
        url: item.url || ''
      }));
    } catch (error) {
      console.error('Error loading menu items:', error);
      return null;
    }
  };

  // Update header section with store name, logo, and navigation menus
  if (store) {
    const headerIndex = sections.findIndex((s: any) => s.type === 'header' && s.visible !== false);
    if (headerIndex !== -1) {
      const headerSection = sections[headerIndex];
      const navigationSettings = headerSection.settings?.navigation || {};
      
      // Load desktop menu items if menu_desktop is set
      let desktopMenuItems = navigationSettings.menu_items || [];
      if (navigationSettings.menu_desktop) {
        const loadedItems = await loadMenuItems(navigationSettings.menu_desktop);
        if (loadedItems) {
          desktopMenuItems = loadedItems;
        }
      }

      // Load mobile menu items if menu_mobile is set
      let mobileMenuItems = navigationSettings.menu_items_mobile || desktopMenuItems;
      if (navigationSettings.menu_mobile) {
        const loadedItems = await loadMenuItems(navigationSettings.menu_mobile);
        if (loadedItems) {
          mobileMenuItems = loadedItems;
        }
      }

      // Update existing header section
      sections[headerIndex] = {
        ...headerSection,
        settings: {
          ...headerSection.settings,
          logo: {
            ...headerSection.settings?.logo,
            text: store.name || headerSection.settings?.logo?.text || 'החנות שלי',
            image_url: store.logo || headerSection.settings?.logo?.image_url || null
          },
          navigation: {
            ...navigationSettings,
            menu_items: desktopMenuItems,
            menu_items_mobile: mobileMenuItems
          },
          // Ensure currency_selector defaults to false if not set
          currency_selector: {
            enabled: headerSection.settings?.currency_selector?.enabled ?? false
          }
        }
      };
    } else {
      // Create header section if it doesn't exist
      const defaultHeader = NEW_YORK_TEMPLATE.sections.find((s: any) => s.type === 'header');
      if (defaultHeader) {
        sections.unshift({
          ...defaultHeader,
          settings: {
            ...defaultHeader.settings,
            logo: {
              ...defaultHeader.settings?.logo,
              text: store.name || defaultHeader.settings?.logo?.text || 'החנות שלי',
              image_url: store.logo || defaultHeader.settings?.logo?.image_url || null
            }
          }
        });
      }
    }
  }

  // Load product/collection data if needed
  let product = null;
  let collection = null;
  let products: any[] = [];

  if (pageType === 'product' && pageHandle) {
    try {
      const productLoadStart = Date.now();
      // pageHandle is already decoded by CustomizerLayoutWrapper
      product = await getProductByHandle(pageHandle, storeId);
      console.log(`🛍️ [CustomizerLayout] Product loaded (${Date.now() - productLoadStart}ms): ${product?.title || 'N/A'}`);
    } catch (error) {
      console.error('❌ [CustomizerLayout] Error loading product:', error);
    }
  }

  if (pageType === 'collection' && pageHandle) {
    try {
      const collectionLoadStart = Date.now();
      // Special handling for "all" collection - show all products
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
        console.log(`📂 [CustomizerLayout] Collection "all" loaded (${Date.now() - collectionLoadStart}ms): ${products.length} products`);
      } else {
        const collectionData = await getCollectionByHandle(pageHandle, storeId, { limit: 20, offset: 0 });
        collection = collectionData.collection;
        products = collectionData.products || [];
        console.log(`📂 [CustomizerLayout] Collection loaded (${Date.now() - collectionLoadStart}ms): ${collection?.title || 'N/A'} - ${products.length} products`);
      }
    } catch (error) {
      console.error('❌ [CustomizerLayout] Error loading collection:', error);
    }
  }

  // Filter only header and footer for layout wrapper
  const headerSection = sections.find((s: any) => s.type === 'header' && s.visible !== false);
  const footerSection = sections.find((s: any) => s.type === 'footer' && s.visible !== false);
  
  // Get content sections based on page type
  // For home page: show all content sections
  // For product/collection pages: show customizer sections (product/collection specific)
  // For other pages: only header/footer
  let contentSections: any[] = [];
  
  if (pageType === 'home' || pageType === undefined) {
    // Home page: show all content sections
    contentSections = sections.filter((s: any) => 
      s.type !== 'header' && s.type !== 'footer' && s.visible !== false
    );
  } else if (pageType === 'product' || pageType === 'collection') {
    // Product/Collection pages: show customizer sections (excluding header/footer)
    contentSections = sections.filter((s: any) => 
      s.type !== 'header' && s.type !== 'footer' && s.visible !== false
    );
  }

  // ✅ טעינת נתונים בשרת עבור סקשנים נפוצים (מהיר!)
  // Load data for FeaturedProducts and FeaturedCollections sections in parallel
  const featuredProductsSections = contentSections.filter((s: any) => s.type === 'featured_products');
  const featuredCollectionsSections = contentSections.filter((s: any) => s.type === 'featured_collections');
  
  // Product page specific sections
  const productReviewsSections = contentSections.filter((s: any) => s.type === 'product_reviews');
  const relatedProductsSections = contentSections.filter((s: any) => s.type === 'related_products');
  const recentlyViewedSections = contentSections.filter((s: any) => s.type === 'recently_viewed' || s.type === 'product_recently_viewed');
  
  const sectionDataPromises: Promise<any>[] = [];
  
  // Load products data for FeaturedProducts sections
  for (const section of featuredProductsSections) {
    sectionDataPromises.push(
      loadFeaturedProductsData(storeId, section.settings || {}).then(data => ({
        sectionId: section.id,
        type: 'featured_products',
        data,
      }))
    );
  }
  
  // Load collections data for FeaturedCollections sections
  for (const section of featuredCollectionsSections) {
    sectionDataPromises.push(
      loadFeaturedCollectionsData(storeId, section.settings || {}).then(data => ({
        sectionId: section.id,
        type: 'featured_collections',
        data,
      }))
    );
  }
  
  // Load product reviews data for ProductReviews sections (product pages only)
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
  
  // Load related products data for RelatedProducts sections (product pages only)
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
  
  // Load recently viewed data for RecentlyViewed sections (product pages only)
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
  
  // Wait for all data to load in parallel
  const dataLoadStartTime = Date.now();
  const sectionDataResults = await Promise.all(sectionDataPromises);
  console.log(`✅ [CustomizerLayout] Section data loaded (${Date.now() - dataLoadStartTime}ms) - ${sectionDataResults.length} sections`);
  
  // Create a map of section data by section ID
  const sectionDataMap = new Map(
    sectionDataResults.map(result => [result.sectionId, result.data])
  );
  
  // Attach pre-loaded data to sections
  contentSections = contentSections.map((section: any) => {
    const preloadedData = sectionDataMap.get(section.id);
    if (preloadedData) {
      return {
        ...section,
        _preloadedData: preloadedData, // Attach pre-loaded data
      };
    }
    return section;
  });
  
  console.log(`✨ [CustomizerLayout] Page ready in ${Date.now() - startTime}ms - ${contentSections.length} content sections`);

  // Determine if we should show customizer sections or children
  // For product pages: show customizer sections ONLY if product data is loaded
  // For collection pages: show customizer sections ONLY if collection data is loaded
  // For other pages: always show customizer sections (or children if no sections)
  const shouldShowCustomizerContent = 
    (pageType === 'product' && product) ||
    (pageType === 'collection' && collection) ||
    (pageType !== 'product' && pageType !== 'collection' && contentSections.length > 0);
  
  const shouldShowChildren = !shouldShowCustomizerContent || contentSections.length === 0;

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      {/* Header from Customizer */}
      {headerSection && (
        <StorefrontSectionRenderer section={headerSection} storeSlug={storeSlug} />
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
              
              {/* Full Width Sections - Reviews, Related, Recently Viewed */}
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
          </ProductPageProvider>
        ) : pageType === 'collection' && collection ? (
          <>
            {/* Collection page with customizer sections - ללא קונטיינר כמו דף הבית */}
            {contentSections.map((section: any) => (
              <StorefrontSectionRenderer 
                key={section.id} 
                section={section}
                product={product}
                collection={collection}
                products={products}
                storeId={storeId}
                storeSlug={storeSlug}
              />
            ))}
          </>
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
                storeSlug={storeSlug}
              />
            ))}
          </>
        ) : null}
        
        {/* For 'other' pages (login, register, account, etc.) - show children as main content */}
        {pageType === 'other' && children}
      </main>

      {/* Footer from Customizer */}
      {footerSection && (
        <StorefrontSectionRenderer section={footerSection} storeSlug={storeSlug} />
      )}
      
      {/* For non-'other' pages - show children after footer (for fixed elements like AdminEditBar) */}
      {pageType !== 'other' && children}
    </div>
  );
}

