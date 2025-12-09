'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { HiCube } from 'react-icons/hi';
import { DeviceType } from './Header'; // Import DeviceType
import { getResponsiveSettings, getResponsiveStyle } from '@/lib/customizer/utils'; // Import utils

// Import section components
import { HeroBanner } from './HeroBanner';
import { FeaturedProducts } from './FeaturedProducts';
import { FeaturedCollections } from './FeaturedCollections';
import { ImageWithText } from './ImageWithText';
import { RichText } from './RichText';
import { Newsletter } from './Newsletter';
import { Gallery } from './Gallery';
import { Header } from './Header';
import { Footer } from './Footer';

interface SectionRendererProps {
  section: SectionSettings;
  isSelected: boolean;
  onUpdate: (updates: Partial<SectionSettings>) => void;
  device?: DeviceType; // Add device prop
}

export function SectionRenderer({ section, isSelected, onUpdate, device = 'desktop' }: SectionRendererProps) {
  
  // Get responsive style
  const style = getResponsiveStyle(section, device);
  const settings = getResponsiveSettings(section, device);

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
      return <Header section={responsiveSection} onUpdate={onUpdate} />;

    case 'hero_banner':
      return (
        <SectionWrapper>
          <HeroBanner section={responsiveSection} onUpdate={onUpdate} />
        </SectionWrapper>
      );

    case 'featured_products':
      return (
        <SectionWrapper>
          <FeaturedProducts section={responsiveSection} onUpdate={onUpdate} editorDevice={device} />
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

    case 'footer':
      // Footer should not be wrapped with SectionWrapper padding/spacing
      return <Footer section={responsiveSection} onUpdate={onUpdate} />;

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
