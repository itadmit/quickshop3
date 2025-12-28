'use client';

import React, { useMemo, useRef } from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { HiCube } from 'react-icons/hi';
import { UnifiedHeader, DeviceType } from '@/components/storefront/UnifiedHeader';
import { getResponsiveSettings, getResponsiveStyle } from '@/lib/customizer/utils'; // Import utils
import { sectionPropsAreEqual } from './sectionMemoUtils';

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
import { Multicolumn } from './Multicolumn';
import { AnnouncementBar } from './AnnouncementBar';
import { Collage } from './Collage';
import { CustomHtml } from './CustomHtml';

// Import element components
import { Heading } from './Elements/Heading';
import { Content } from './Elements/Content';
import { Button } from './Elements/Button';
import { Image } from './Elements/Image';
import { Video } from './Elements/Video';
import { Divider } from './Elements/Divider';
import { Spacer } from './Elements/Spacer';
import { Marquee } from './Elements/Marquee';

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
import { ProductBreadcrumbs } from './ProductBreadcrumbs';
import { CheckoutFormSection } from './CheckoutFormSection';

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

function SectionRendererComponent({ section, isSelected, onUpdate, device = 'desktop', sampleProduct, sampleCollection }: SectionRendererProps) {
  
  // Get responsive style and settings
  const style = getResponsiveStyle(section, device);
  const settings = getResponsiveSettings(section, device);

  // ✅ Create responsiveSection - React.memo in child components will handle optimization
  // ✅ חשוב: ה-style כולל את ה-background images/videos, אז צריך לוודא שהוא מתעדכן
  // ✅ שימוש ב-JSON.stringify של section.style כדי לוודא שהעדכונים מתעדכנים מיד
  const responsiveSection = useMemo(() => {
    return {
      ...section,
      settings: settings,
      style: style, // ✅ זה כולל את style.background.background_image ו-style.background.background_video
      blocks: section.blocks
    };
  }, [section.id, JSON.stringify(section.style), JSON.stringify(settings), JSON.stringify(style), JSON.stringify(section.blocks), device]);

  // Base section wrapper with common styles
  const SectionWrapper = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
    // Background style
    const bgStyle: React.CSSProperties = {
        paddingTop: style.spacing?.padding_top || '0',
        paddingBottom: style.spacing?.padding_bottom || '0',
        paddingLeft: style.spacing?.padding_left || '0',
        paddingRight: style.spacing?.padding_right || '0',
        backgroundColor: style.background?.background_color,
        borderRadius: style.border?.border_radius || '0',
        overflow: style.border?.border_radius ? 'hidden' : undefined, // ✅ מונע מהתוכן לצאת מהפינות המעוגלות
    };

    // ✅ If there is an image and NO video, use it as CSS background
    // ✅ Choose mobile/tablet image if device is mobile/tablet and mobile image exists, otherwise use desktop
    const backgroundImage = (device === 'mobile' || device === 'tablet') && style.background?.background_image_mobile
        ? style.background.background_image_mobile 
        : style.background?.background_image;
    
    // ✅ Check for video - also check mobile/tablet video if device is mobile/tablet
    const backgroundVideo = (device === 'mobile' || device === 'tablet') && style.background?.background_video_mobile
        ? style.background.background_video_mobile 
        : style.background?.background_video;
    
    if (backgroundImage && !backgroundVideo) {
        bgStyle.backgroundImage = `url(${backgroundImage})`;
        bgStyle.backgroundSize = style.background?.background_size || 'cover';
        bgStyle.backgroundPosition = style.background?.background_position || 'center';
        bgStyle.backgroundRepeat = style.background?.background_repeat || 'no-repeat';
    }

    // ✅ Video Background Element
    const VideoBackground = () => {
        // ✅ Check for video - also check mobile/tablet video if device is mobile/tablet
        const videoSrc = (device === 'mobile' || device === 'tablet') && style.background?.background_video_mobile
            ? style.background.background_video_mobile 
            : style.background?.background_video;
        
        if (!videoSrc) return null;
        const borderRadius = style.border?.border_radius || '0';
        return (
            <div 
                className="absolute inset-0 w-full h-full overflow-hidden z-0 pointer-events-none"
                style={{ borderRadius }}
            >
                <video
                    src={videoSrc}
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
        const borderRadius = style.border?.border_radius || '0';
        
        return (
            <div 
                className="absolute inset-0 z-0 pointer-events-none bg-black"
                style={{ opacity: overlayOpacity, borderRadius }}
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

  // responsiveSection is now memoized above

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
          <FeaturedCollections section={responsiveSection} onUpdate={onUpdate} editorDevice={device} />
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

    case 'footer':
      // Footer should not be wrapped with SectionWrapper padding/spacing
      return <Footer section={responsiveSection} onUpdate={onUpdate} editorDevice={device} />;

    case 'multicolumn':
      return (
        <SectionWrapper>
          <Multicolumn section={responsiveSection} onUpdate={onUpdate} />
        </SectionWrapper>
      );

    case 'announcement_bar':
      return (
        <AnnouncementBar section={responsiveSection} onUpdate={onUpdate} />
      );

    case 'collage':
      return (
        <SectionWrapper>
          <Collage section={responsiveSection} onUpdate={onUpdate} />
        </SectionWrapper>
      );

    case 'custom_html':
      return (
        <SectionWrapper>
          <CustomHtml section={responsiveSection} onUpdate={onUpdate} />
        </SectionWrapper>
      );

    // ========== Elements (יחידים) ==========
    case 'element_heading':
      return (
        <SectionWrapper>
          <Heading section={responsiveSection} onUpdate={onUpdate} editorDevice={device} />
        </SectionWrapper>
      );

    case 'element_content':
      return (
        <SectionWrapper>
          <Content section={responsiveSection} onUpdate={onUpdate} editorDevice={device} />
        </SectionWrapper>
      );

    case 'element_button':
      return (
        <SectionWrapper>
          <Button section={responsiveSection} onUpdate={onUpdate} editorDevice={device} />
        </SectionWrapper>
      );

    case 'element_image':
      return (
        <SectionWrapper>
          <Image section={responsiveSection} onUpdate={onUpdate} editorDevice={device} />
        </SectionWrapper>
      );

    case 'element_video':
      return (
        <SectionWrapper>
          <Video section={responsiveSection} onUpdate={onUpdate} editorDevice={device} />
        </SectionWrapper>
      );

    case 'element_divider':
      return (
        <SectionWrapper>
          <Divider section={responsiveSection} onUpdate={onUpdate} editorDevice={device} />
        </SectionWrapper>
      );

    case 'element_spacer':
      return (
        <Spacer section={responsiveSection} onUpdate={onUpdate} editorDevice={device} />
      );

    case 'element_marquee':
      return (
        <SectionWrapper>
          <Marquee section={responsiveSection} onUpdate={onUpdate} editorDevice={device} />
        </SectionWrapper>
      );

    // ========== Product Page Sections ==========
    case 'product_breadcrumbs':
      return (
        <SectionWrapper className="py-1">
          <ProductBreadcrumbs section={responsiveSection} product={sampleProduct} onUpdate={onUpdate} />
        </SectionWrapper>
      );

    case 'product_gallery':
      return (
        <SectionWrapper className="py-4">
          <ProductGallerySection section={responsiveSection} product={sampleProduct} onUpdate={onUpdate} />
        </SectionWrapper>
      );

    case 'product_name':
    case 'product_title':
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

    case 'product_variations':
    case 'product_variants':
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
          <ProductReviewsSection section={responsiveSection} product={sampleProduct} onUpdate={onUpdate} />
        </SectionWrapper>
      );

    case 'related_products':
      return (
        <SectionWrapper className="py-8">
          <RelatedProductsSection section={responsiveSection} product={sampleProduct} onUpdate={onUpdate} />
        </SectionWrapper>
      );

    case 'product_recently_viewed':
    case 'recently_viewed':
      return (
        <SectionWrapper className="py-8">
          <RecentlyViewedSection section={responsiveSection} product={sampleProduct} onUpdate={onUpdate} isPreview={true} />
        </SectionWrapper>
      );

    // ========== Collection Page Sections ==========
    case 'collection_header':
      return (
        <SectionWrapper className="py-4">
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
        <SectionWrapper className="py-4">
          <CollectionProductsSection section={responsiveSection} collection={sampleCollection} onUpdate={onUpdate} />
        </SectionWrapper>
      );

    case 'collection_pagination':
      return (
        <SectionWrapper className="py-4">
          <CollectionPaginationSection section={responsiveSection} collection={sampleCollection} onUpdate={onUpdate} />
        </SectionWrapper>
      );

    // ========== Checkout Page Sections ==========
    case 'checkout_form':
      // Checkout form takes full page - no wrapper
      return <CheckoutFormSection section={responsiveSection} onUpdate={onUpdate} />;

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

// Memoize SectionRenderer to prevent re-renders when parent re-renders
export const SectionRenderer = React.memo(SectionRendererComponent, sectionPropsAreEqual);
