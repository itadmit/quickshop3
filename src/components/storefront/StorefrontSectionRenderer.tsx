/**
 * Storefront Section Renderer
 * מציג סקשן מהקסטומייזר בפרונט (ללא אפשרויות עריכה)
 */

'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { getResponsiveSettings, getResponsiveStyle } from '@/lib/customizer/utils';

// Import section components (same as customizer)
import { HeroBanner } from '@/app/customize/components/sections/HeroBanner';
import { FeaturedProducts } from '@/app/customize/components/sections/FeaturedProducts';
import { FeaturedCollections } from '@/app/customize/components/sections/FeaturedCollections';
import { ImageWithText } from '@/app/customize/components/sections/ImageWithText';
import { RichText } from '@/app/customize/components/sections/RichText';
import { Newsletter } from '@/app/customize/components/sections/Newsletter';
import { Gallery } from '@/app/customize/components/sections/Gallery';
import { Footer } from '@/app/customize/components/sections/Footer';
import { Slideshow } from '@/app/customize/components/sections/Slideshow';
import { Testimonials } from '@/app/customize/components/sections/Testimonials';
import { FAQ } from '@/app/customize/components/sections/FAQ';
import { VideoSection } from '@/app/customize/components/sections/VideoSection';
import { ContactForm } from '@/app/customize/components/sections/ContactForm';
import { LogoList } from '@/app/customize/components/sections/LogoList';
import { AnnouncementBar } from '@/app/customize/components/sections/AnnouncementBar';
import { Multicolumn } from '@/app/customize/components/sections/Multicolumn';
import { Collage } from '@/app/customize/components/sections/Collage';
import { CustomHtml } from '@/app/customize/components/sections/CustomHtml';
import { ProductBreadcrumbs } from '@/app/customize/components/sections/ProductBreadcrumbs';
// Product page section components
import {
  ProductGallerySection,
  ProductTitleSection,
  ProductPriceSection,
  ProductVariantsSection,
  ProductAddToCartSection,
  ProductDescriptionSection,
  ProductCustomFieldsSection,
  ProductReviewsSection,
  RelatedProductsSection,
  RecentlyViewedSection
} from '@/app/customize/components/sections/ProductPageSections';
import { ProductStoriesSection } from '@/app/customize/components/sections/ProductStoriesSection';
// Collection page section components
import {
  CollectionHeaderSection,
  CollectionDescriptionSection,
  CollectionFiltersSection,
  CollectionProductsSection,
  CollectionPaginationSection
} from '@/app/customize/components/sections/CollectionPageSections';
// Unified Header for storefront with real SideCart
import { UnifiedHeader } from './UnifiedHeader';
import { useStoreId } from '@/hooks/useStoreId';
import { ProductPageProvider } from '@/contexts/ProductPageContext';

interface StorefrontSectionRendererProps {
  section: SectionSettings;
  product?: any; // Product data for product page sections
  collection?: any; // Collection data for collection page sections
  products?: any[]; // Products list for collection page
  storeId?: number; // Store ID for collection sections
}

export function StorefrontSectionRenderer({ section, product, collection, products, storeId: propStoreId }: StorefrontSectionRendererProps) {
  const contextStoreId = useStoreId();
  const storeId = propStoreId || contextStoreId;
  
  // Get responsive settings (always desktop for storefront)
  const settings = getResponsiveSettings(section, 'desktop');
  const style = getResponsiveStyle(section, 'desktop');

  // Generate unique ID for CSS
  const sectionId = `section-${section.id}`;
  
  // Desktop and mobile background images
  const desktopBgImage = style.background?.background_image;
  const mobileBgImage = style.background?.background_image_mobile || desktopBgImage;
  const hasBgImage = (desktopBgImage || mobileBgImage) && !style.background?.background_video;

  // Base section wrapper with common styles
  const SectionWrapper = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
    const bgStyle: React.CSSProperties = {
      paddingTop: style.spacing?.padding_top || '0',
      paddingBottom: style.spacing?.padding_bottom || '0',
      paddingLeft: style.spacing?.padding_left || '0',
      paddingRight: style.spacing?.padding_right || '0',
      backgroundColor: style.background?.background_color,
    };

    // Background image settings (image URL set via CSS for responsive)
    if (hasBgImage) {
      bgStyle.backgroundSize = style.background?.background_size || 'cover';
      bgStyle.backgroundPosition = style.background?.background_position || 'center';
      bgStyle.backgroundRepeat = style.background?.background_repeat || 'no-repeat';
    }

    // Video Background
    const VideoBackground = () => {
      if (!style.background?.background_video) return null;
      return (
        <div className="absolute inset-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <video
            src={style.background.background_video}
            autoPlay={style.background.video_autoplay !== false}
            muted={style.background.video_muted !== false}
            loop={style.background.video_loop !== false}
            playsInline
            className="w-full h-full"
            style={{ objectFit: style.background.video_object_fit || 'cover' }}
          />
        </div>
      );
    };

    // Overlay
    const Overlay = () => {
      const overlayOpacity = style.background?.overlay_opacity;
      if (!overlayOpacity && overlayOpacity !== '0') return null;
      return (
        <div 
          className="absolute inset-0 z-0 pointer-events-none bg-black"
          style={{ opacity: overlayOpacity }}
        />
      );
    };

    return (
      <>
        {/* Responsive background image CSS */}
        {hasBgImage && (
          <style dangerouslySetInnerHTML={{ __html: `
            #${sectionId} {
              background-image: url('${desktopBgImage}');
            }
            @media (max-width: 768px) {
              #${sectionId} {
                background-image: url('${mobileBgImage}');
              }
            }
          `}} />
        )}
        <section
          id={sectionId}
          className={`relative ${section.visible ? '' : 'opacity-50'} ${settings.custom_css_class || ''} ${className}`}
          style={bgStyle}
        >
          <VideoBackground />
          <Overlay />
          <div className="relative z-10">
            {children}
          </div>
        </section>
      </>
    );
  };

  // Create responsive section object
  const responsiveSection = {
    ...section,
    settings: settings,
    style: style
  };

  // No-op update function for storefront (no editing)
  const noopUpdate = () => {};

  // Render section based on type
  switch (section.type) {
    case 'header':
      // Use unified header with real SideCart for storefront (isPreview=false)
      return <UnifiedHeader section={responsiveSection} isPreview={false} storeId={storeId || undefined} />;

    case 'hero_banner':
      return (
        <SectionWrapper>
          <HeroBanner section={responsiveSection} onUpdate={noopUpdate} />
        </SectionWrapper>
      );

    case 'featured_products':
      return (
        <SectionWrapper>
          <FeaturedProducts 
            section={responsiveSection} 
            onUpdate={noopUpdate} 
            isPreview={false}
            preloadedProducts={(section as any)._preloadedData?.products}
            storeId={storeId || undefined}
          />
        </SectionWrapper>
      );

    case 'featured_collections':
      return (
        <SectionWrapper>
          <FeaturedCollections 
            section={responsiveSection} 
            onUpdate={noopUpdate} 
            isPreview={false}
            preloadedCollections={(section as any)._preloadedData?.collections}
            storeId={storeId || undefined}
          />
        </SectionWrapper>
      );

    case 'image_with_text':
      return (
        <SectionWrapper>
          <ImageWithText section={responsiveSection} onUpdate={noopUpdate} />
        </SectionWrapper>
      );

    case 'rich_text':
      return (
        <SectionWrapper>
          <RichText section={responsiveSection} onUpdate={noopUpdate} />
        </SectionWrapper>
      );

    case 'newsletter':
      return (
        <SectionWrapper>
          <Newsletter section={responsiveSection} onUpdate={noopUpdate} storeId={storeId || undefined} />
        </SectionWrapper>
      );

    case 'gallery':
      return (
        <SectionWrapper>
          <Gallery section={responsiveSection} onUpdate={noopUpdate} />
        </SectionWrapper>
      );

    case 'slideshow':
      return (
        <SectionWrapper>
          <Slideshow section={responsiveSection} onUpdate={noopUpdate} />
        </SectionWrapper>
      );

    case 'testimonials':
      return (
        <SectionWrapper>
          <Testimonials section={responsiveSection} onUpdate={noopUpdate} />
        </SectionWrapper>
      );

    case 'faq':
      return (
        <SectionWrapper>
          <FAQ section={responsiveSection} onUpdate={noopUpdate} />
        </SectionWrapper>
      );

    case 'video':
      return (
        <SectionWrapper>
          <VideoSection section={responsiveSection} onUpdate={noopUpdate} />
        </SectionWrapper>
      );

    case 'contact_form':
      return (
        <SectionWrapper>
          <ContactForm section={responsiveSection} onUpdate={noopUpdate} storeId={storeId || undefined} />
        </SectionWrapper>
      );

    case 'logo_list':
      return (
        <SectionWrapper>
          <LogoList section={responsiveSection} onUpdate={noopUpdate} />
        </SectionWrapper>
      );

    case 'announcement_bar':
      // Announcement bar should be at the very top, no wrapper
      return <AnnouncementBar section={responsiveSection} onUpdate={noopUpdate} />;

    case 'multicolumn':
      return (
        <SectionWrapper>
          <Multicolumn section={responsiveSection} onUpdate={noopUpdate} />
        </SectionWrapper>
      );

    case 'collage':
      return (
        <SectionWrapper>
          <Collage section={responsiveSection} onUpdate={noopUpdate} />
        </SectionWrapper>
      );

    case 'custom_html':
      return (
        <SectionWrapper>
          <CustomHtml section={responsiveSection} onUpdate={noopUpdate} />
        </SectionWrapper>
      );

    case 'footer':
      return <Footer section={responsiveSection} onUpdate={noopUpdate} />;

    // ========== Product Page Sections ==========
    // Note: ProductPageProvider is wrapped at CustomizerLayout level for all product sections
    case 'product_breadcrumbs':
      return <ProductBreadcrumbs section={responsiveSection} product={product} onUpdate={noopUpdate} />;

    case 'product_gallery':
      // No wrapper for product gallery - it's inside a column layout
      return <ProductGallerySection section={responsiveSection} product={product} onUpdate={noopUpdate} />;

    case 'product_title':
    case 'product_name':
      // No wrapper for product info sections - they're inside a column layout
      return <ProductTitleSection section={responsiveSection} product={product} onUpdate={noopUpdate} />;

    case 'product_price':
      // No wrapper for product info sections - they're inside a column layout
      return <ProductPriceSection section={responsiveSection} product={product} onUpdate={noopUpdate} />;

    case 'product_variants':
    case 'product_variations':
      // No wrapper for product info sections - they're inside a column layout
      return <ProductVariantsSection section={responsiveSection} product={product} onUpdate={noopUpdate} />;

    case 'product_add_to_cart':
      // No wrapper for product info sections - they're inside a column layout
      return <ProductAddToCartSection section={responsiveSection} product={product} onUpdate={noopUpdate} />;

    case 'product_description':
      // Full width section - no extra wrapper needed
      return <ProductDescriptionSection section={responsiveSection} product={product} onUpdate={noopUpdate} />;

    case 'product_custom_fields':
      // Full width section - no extra wrapper needed
      return <ProductCustomFieldsSection section={responsiveSection} product={product} onUpdate={noopUpdate} />;

    case 'product_reviews':
      return (
        <SectionWrapper className="py-4">
          <ProductReviewsSection section={responsiveSection} product={product} onUpdate={noopUpdate} isPreview={false} />
        </SectionWrapper>
      );

    case 'product_stories':
      return (
        <SectionWrapper className="py-2">
          <ProductStoriesSection section={responsiveSection} product={product} onUpdate={noopUpdate} isPreview={false} />
        </SectionWrapper>
      );

    case 'related_products':
      return (
        <SectionWrapper className="py-8">
          <RelatedProductsSection section={responsiveSection} product={product} onUpdate={noopUpdate} isPreview={false} />
        </SectionWrapper>
      );

    case 'recently_viewed':
    case 'product_recently_viewed':
      return (
        <SectionWrapper className="py-8">
          <RecentlyViewedSection section={responsiveSection} product={product} onUpdate={noopUpdate} isPreview={false} />
        </SectionWrapper>
      );

    // ========== Collection Page Sections ==========
    case 'collection_header':
      return (
        <SectionWrapper className="py-8">
          <CollectionHeaderSection section={responsiveSection} collection={collection} onUpdate={noopUpdate} />
        </SectionWrapper>
      );

    case 'collection_description':
      return (
        <SectionWrapper className="py-4">
          <CollectionDescriptionSection section={responsiveSection} collection={collection} onUpdate={noopUpdate} />
        </SectionWrapper>
      );

    case 'collection_filters':
      return (
        <SectionWrapper className="py-4">
          <CollectionFiltersSection section={responsiveSection} collection={collection} onUpdate={noopUpdate} />
        </SectionWrapper>
      );

    case 'collection_products':
      return (
        <SectionWrapper className="py-8">
          <CollectionProductsSection section={responsiveSection} collection={collection} products={products} onUpdate={noopUpdate} storeId={storeId || undefined} />
        </SectionWrapper>
      );

    case 'collection_pagination':
      return (
        <SectionWrapper className="py-8">
          <CollectionPaginationSection section={responsiveSection} collection={collection} onUpdate={noopUpdate} />
        </SectionWrapper>
      );

    default:
      return null;
  }
}

