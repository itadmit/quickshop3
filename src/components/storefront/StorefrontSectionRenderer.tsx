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
// Unified Header for storefront with real SideCart
import { UnifiedHeader } from './UnifiedHeader';
import { useStoreId } from '@/hooks/useStoreId';

interface StorefrontSectionRendererProps {
  section: SectionSettings;
}

export function StorefrontSectionRenderer({ section }: StorefrontSectionRendererProps) {
  const storeId = useStoreId();
  
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
          <FeaturedProducts section={responsiveSection} onUpdate={noopUpdate} />
        </SectionWrapper>
      );

    case 'featured_collections':
      return (
        <SectionWrapper>
          <FeaturedCollections section={responsiveSection} onUpdate={noopUpdate} />
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
          <Newsletter section={responsiveSection} onUpdate={noopUpdate} />
        </SectionWrapper>
      );

    case 'gallery':
      return (
        <SectionWrapper>
          <Gallery section={responsiveSection} onUpdate={noopUpdate} />
        </SectionWrapper>
      );

    case 'footer':
      return <Footer section={responsiveSection} onUpdate={noopUpdate} />;

    default:
      return null;
  }
}

