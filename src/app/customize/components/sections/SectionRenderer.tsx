'use client';

import React, { memo, useMemo } from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { HiCube } from 'react-icons/hi';
import { UnifiedHeader, DeviceType } from '@/components/storefront/UnifiedHeader';
import { getResponsiveSettings, getResponsiveStyle } from '@/lib/customizer/utils'; // Import utils

// Import section components
import { HeroBanner } from './HeroBanner';
import { FeaturedProducts } from './FeaturedProducts';
import { FeaturedCollections } from './FeaturedCollections';
import { ImageWithText } from './ImageWithText';
import { RichText } from './RichText';
import { Newsletter } from './Newsletter';
import { Gallery } from './Gallery';
import { Footer } from './Footer';
import { Slideshow } from './Slideshow';
import { Testimonials } from './Testimonials';
import { FAQ } from './FAQ';
import { VideoSection } from './VideoSection';
import { ContactForm } from './ContactForm';
import { LogoList } from './LogoList';
import { AnnouncementBar } from './AnnouncementBar';
import { Multicolumn } from './Multicolumn';
import { Collage } from './Collage';
import { CustomHTML } from './CustomHTML';

// Import product page section components
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
} from './ProductPageSections';
import { DEMO_COLLECTION_PRODUCTS } from '@/lib/customizer/demoData';
// Import collection page section components
import {
  CollectionHeaderSection,
  CollectionDescriptionSection,
  CollectionFiltersSection,
  CollectionProductsSection,
  CollectionPaginationSection
} from './CollectionPageSections';

interface SectionRendererProps {
  section: SectionSettings;
  isSelected: boolean;
  onUpdate: (updates: Partial<SectionSettings>) => void;
  device?: DeviceType; // Add device prop
  sampleProduct?: any; // Sample product for product page preview
  sampleCollection?: any; // Sample collection for collection page preview
}

// Memoized SectionRenderer - only re-renders when section content changes, NOT when isSelected changes
function SectionRendererInner({ section, isSelected, onUpdate, device = 'desktop', sampleProduct, sampleCollection }: SectionRendererProps) {
  
  // Memoize style and settings to prevent unnecessary recalculations
  const style = useMemo(() => getResponsiveStyle(section, device), [section, device]);
  const settings = useMemo(() => getResponsiveSettings(section, device), [section, device]);

  // Base section wrapper with common styles
  const SectionWrapper = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
    // Background style
    const bgStyle: React.CSSProperties = {
        paddingTop: style.spacing?.padding_top || '0',
        paddingBottom: style.spacing?.padding_bottom || '0',
        paddingLeft: style.spacing?.padding_left || '0',
        paddingRight: style.spacing?.padding_right || '0',
        backgroundColor: style.background?.background_color,
    };

    // If there is an image and NO video, use it as CSS background
    // Choose mobile image if device is mobile and mobile image exists
    const backgroundImage = (device === 'mobile' && style.background?.background_image_mobile) 
        ? style.background.background_image_mobile 
        : style.background?.background_image;
        
    if (backgroundImage && !style.background?.background_video) {
        bgStyle.backgroundImage = `url(${backgroundImage})`;
        bgStyle.backgroundSize = style.background?.background_size || 'cover';
        bgStyle.backgroundPosition = style.background?.background_position || 'center';
        bgStyle.backgroundRepeat = style.background?.background_repeat || 'no-repeat';
    }

    // Video Background Element
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

    // Overlay Element (support for both opacity and specific color if needed in future)
    const Overlay = () => {
        const overlayOpacity = style.background?.overlay_opacity;
        if (!overlayOpacity && overlayOpacity !== '0') return null; // Check for defined
        
        return (
            <div 
                className="absolute inset-0 z-0 pointer-events-none bg-black"
                style={{ opacity: overlayOpacity }}
            />
        );
    };

    return (
        <section
            id={settings.custom_id}
            className={`relative ${section.visible ? '' : 'opacity-50'} ${settings.custom_css_class || ''} ${className}`}
            style={bgStyle}
        >
            <VideoBackground />
            <Overlay />
            <div className="relative z-10">
                {children}
            </div>
        </section>
    );
  };

  // Pass device/settings to components if they need it (currently they use section directly, we should wrap or pass updated props)
  // To avoid refactoring all components to accept `settings` prop instead of `section`, 
  // we can create a proxy section object that has the merged settings/style.
  
  const responsiveSection = {
      ...section,
      settings: settings,
      style: style
  };

  switch (section.type) {
    case 'header':
      // Header should not be wrapped with SectionWrapper padding/spacing - it's sticky
      // isPreview=true means customizer preview (no real cart/search functionality)
      return <UnifiedHeader section={responsiveSection} onUpdate={onUpdate} editorDevice={device} isPreview={true} />;

    case 'hero_banner':
      return (
        <SectionWrapper>
          <HeroBanner section={responsiveSection} onUpdate={onUpdate} />
        </SectionWrapper>
      );

    case 'featured_products':
      return (
        <SectionWrapper>
          <FeaturedProducts section={responsiveSection} onUpdate={onUpdate} editorDevice={device} isPreview={true} />
        </SectionWrapper>
      );

    case 'featured_collections':
      return (
        <SectionWrapper>
          <FeaturedCollections section={responsiveSection} onUpdate={onUpdate} editorDevice={device} isPreview={true} />
        </SectionWrapper>
      );

    case 'image_with_text':
      return (
        <SectionWrapper>
          <ImageWithText section={responsiveSection} onUpdate={onUpdate} editorDevice={device} />
        </SectionWrapper>
      );

    case 'rich_text':
      return (
        <SectionWrapper>
          <RichText section={responsiveSection} onUpdate={onUpdate} />
        </SectionWrapper>
      );

    case 'newsletter':
      return (
        <SectionWrapper>
          <Newsletter section={responsiveSection} onUpdate={onUpdate} />
        </SectionWrapper>
      );

    case 'gallery':
      return (
        <SectionWrapper>
          <Gallery section={responsiveSection} onUpdate={onUpdate} />
        </SectionWrapper>
      );

    case 'slideshow':
      return (
        <SectionWrapper>
          <Slideshow section={responsiveSection} onUpdate={onUpdate} />
        </SectionWrapper>
      );

    case 'testimonials':
      return (
        <SectionWrapper>
          <Testimonials section={responsiveSection} onUpdate={onUpdate} />
        </SectionWrapper>
      );

    case 'faq':
      return (
        <SectionWrapper>
          <FAQ section={responsiveSection} onUpdate={onUpdate} />
        </SectionWrapper>
      );

    case 'video':
      return (
        <SectionWrapper>
          <VideoSection section={responsiveSection} onUpdate={onUpdate} />
        </SectionWrapper>
      );

    case 'contact_form':
      return (
        <SectionWrapper>
          <ContactForm section={responsiveSection} onUpdate={onUpdate} />
        </SectionWrapper>
      );

    case 'logo_list':
      return (
        <SectionWrapper>
          <LogoList section={responsiveSection} onUpdate={onUpdate} />
        </SectionWrapper>
      );

    case 'announcement_bar':
      // Announcement bar should be at the very top, no wrapper
      return <AnnouncementBar section={responsiveSection} onUpdate={onUpdate} />;

    case 'multicolumn':
      return (
        <SectionWrapper>
          <Multicolumn section={responsiveSection} onUpdate={onUpdate} editorDevice={device} />
        </SectionWrapper>
      );

    case 'collage':
      return (
        <SectionWrapper>
          <Collage section={responsiveSection} onUpdate={onUpdate} editorDevice={device} />
        </SectionWrapper>
      );

    case 'custom_html':
      return (
        <SectionWrapper>
          <CustomHTML section={responsiveSection} onUpdate={onUpdate} isPreview={true} />
        </SectionWrapper>
      );

    case 'footer':
      // Footer should not be wrapped with SectionWrapper padding/spacing
      return <Footer section={responsiveSection} onUpdate={onUpdate} editorDevice={device} />;

    // ========== Product Page Sections ==========
    case 'product_gallery':
      return (
        <SectionWrapper className="py-4">
          <ProductGallerySection section={responsiveSection} product={sampleProduct} onUpdate={onUpdate} />
        </SectionWrapper>
      );

    case 'product_title':
    case 'product_name':
      return (
        <SectionWrapper className="py-2">
          <ProductTitleSection section={responsiveSection} product={sampleProduct} onUpdate={onUpdate} />
        </SectionWrapper>
      );

    case 'product_price':
      return (
        <SectionWrapper className="py-2">
          <ProductPriceSection section={responsiveSection} product={sampleProduct} onUpdate={onUpdate} />
        </SectionWrapper>
      );

    case 'product_variants':
    case 'product_variations':
      return (
        <SectionWrapper className="py-2">
          <ProductVariantsSection section={responsiveSection} product={sampleProduct} onUpdate={onUpdate} />
        </SectionWrapper>
      );

    case 'product_add_to_cart':
      return (
        <SectionWrapper className="py-2">
          <ProductAddToCartSection section={responsiveSection} product={sampleProduct} onUpdate={onUpdate} />
        </SectionWrapper>
      );

    case 'product_description':
      return (
        <SectionWrapper className="py-4">
          <ProductDescriptionSection section={responsiveSection} product={sampleProduct} onUpdate={onUpdate} />
        </SectionWrapper>
      );

    case 'product_custom_fields':
      return (
        <SectionWrapper className="py-4">
          <ProductCustomFieldsSection section={responsiveSection} product={sampleProduct} onUpdate={onUpdate} />
        </SectionWrapper>
      );

    case 'product_reviews':
      return (
        <SectionWrapper className="py-4">
          <ProductReviewsSection section={responsiveSection} product={sampleProduct} onUpdate={onUpdate} isPreview={true} />
        </SectionWrapper>
      );

    case 'related_products':
      return (
        <SectionWrapper className="py-8">
          <RelatedProductsSection section={responsiveSection} product={sampleProduct} onUpdate={onUpdate} isPreview={true} />
        </SectionWrapper>
      );

    case 'product_recently_viewed':
      return (
        <SectionWrapper className="py-8">
          <RecentlyViewedSection section={responsiveSection} product={sampleProduct} onUpdate={onUpdate} isPreview={true} />
        </SectionWrapper>
      );

    // ========== Collection Page Sections ==========
    case 'collection_header':
      return (
        <SectionWrapper className="py-8">
          <CollectionHeaderSection section={responsiveSection} collection={sampleCollection} onUpdate={onUpdate} />
        </SectionWrapper>
      );

    case 'collection_description':
      return (
        <SectionWrapper className="py-4">
          <CollectionDescriptionSection section={responsiveSection} collection={sampleCollection} onUpdate={onUpdate} />
        </SectionWrapper>
      );

    case 'collection_filters':
      return (
        <SectionWrapper className="py-4">
          <CollectionFiltersSection section={responsiveSection} collection={sampleCollection} onUpdate={onUpdate} />
        </SectionWrapper>
      );

    case 'collection_products':
      return (
        <SectionWrapper className="py-8">
          <CollectionProductsSection section={responsiveSection} collection={sampleCollection} products={DEMO_COLLECTION_PRODUCTS} onUpdate={onUpdate} />
        </SectionWrapper>
      );

    case 'collection_pagination':
      return (
        <SectionWrapper className="py-8">
          <CollectionPaginationSection section={responsiveSection} collection={sampleCollection} onUpdate={onUpdate} />
        </SectionWrapper>
      );

    default:
      // Generic section for unknown types
      return (
        <SectionWrapper className="py-16">
          <div className="text-center text-gray-400">
            <div className="text-4xl mb-4 text-gray-400">
              <HiCube className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium mb-2">{section.name}</h3>
            <p className="text-sm">סקשן מסוג {section.type}</p>
          </div>
        </SectionWrapper>
      );
  }
}

// Custom comparison function - ignore isSelected to prevent unnecessary re-renders
function arePropsEqual(prevProps: SectionRendererProps, nextProps: SectionRendererProps): boolean {
  // Only re-render if these change (ignore isSelected)
  return (
    prevProps.section === nextProps.section &&
    prevProps.device === nextProps.device &&
    prevProps.sampleProduct === nextProps.sampleProduct &&
    prevProps.sampleCollection === nextProps.sampleCollection
    // NOTE: onUpdate is excluded intentionally as it's a new function each render
    // NOTE: isSelected is excluded intentionally to prevent re-renders on selection change
  );
}

// Export memoized version
export const SectionRenderer = memo(SectionRendererInner, arePropsEqual);
