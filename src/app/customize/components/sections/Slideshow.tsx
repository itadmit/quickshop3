'use client';

import React, { useState, useEffect } from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { sectionPropsAreEqual } from './sectionMemoUtils';

interface SlideshowProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
}

function SlideshowComponent({ section, onUpdate }: SlideshowProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const settings = section.settings || {};
  const style = section.style || {};
  const slides = section.blocks?.filter(b => b.type === 'image') || [];
  
  // Auto play logic
  useEffect(() => {
    if (settings.autoplay && slides.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, (settings.autoplay_speed || 5) * 1000);
      return () => clearInterval(interval);
    }
  }, [settings.autoplay, settings.autoplay_speed, slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  if (slides.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-100 flex items-center justify-center text-gray-400">
        <p>הוסף שקופיות דרך סרגל העריכה</p>
      </div>
    );
  }

  // Height class
  const heightClass = settings.height === 'small' ? 'h-[40vh]' : 
                     settings.height === 'large' ? 'h-[80vh]' : 
                     settings.height === 'full' ? 'h-screen' : 'h-[60vh]';

  // Image fit (object-fit)
  const imageFit = settings.image_fit || 'cover';
  
  // Image position (object-position)
  const imagePosition = settings.image_position || 'center';
  
  // Typography settings - use specific typography for heading
  const headingTypography = style.typography?.heading || {};
  
  const fontFamily = headingTypography.font_family || style.typography?.font_family || '"Noto Sans Hebrew", sans-serif';
  const textColor = headingTypography.color || style.typography?.color || '#FFFFFF';
  
  // Slide heading font size
  const getSlideHeadingSizeClass = () => {
    const size = settings.slide_heading_font_size || 'xlarge';
    const sizeMap: Record<string, string> = {
      small: 'text-2xl md:text-3xl',
      medium: 'text-3xl md:text-4xl',
      large: 'text-4xl md:text-5xl',
      xlarge: 'text-4xl md:text-6xl',
    };
    return sizeMap[size] || 'text-4xl md:text-6xl';
  };
  
  // Slide subheading font size
  const getSlideSubheadingSizeClass = () => {
    const size = settings.slide_subheading_font_size || 'large';
    const sizeMap: Record<string, string> = {
      small: 'text-base md:text-lg',
      medium: 'text-lg md:text-xl',
      large: 'text-xl md:text-2xl',
      xlarge: 'text-2xl md:text-3xl',
    };
    return sizeMap[size] || 'text-xl md:text-2xl';
  };

  // Content position - vertical
  const getVerticalPositionClass = () => {
    switch (settings.content_position_vertical) {
      case 'top': return 'items-start pt-16';
      case 'bottom': return 'items-end pb-16';
      case 'center':
      default: return 'items-center';
    }
  };

  // Content position - horizontal
  const getHorizontalPositionClass = () => {
    switch (settings.content_position_horizontal) {
      case 'left': return 'justify-start';
      case 'right': return 'justify-end';
      case 'center':
      default: return 'justify-center';
    }
  };

  // Text alignment
  const getTextAlignClass = () => {
    switch (settings.text_align) {
      case 'left': return 'text-left items-start';
      case 'right': return 'text-right items-end';
      case 'center':
      default: return 'text-center items-center';
    }
  };

  return (
    <div className={`relative w-full overflow-hidden group ${heightClass}`}>
      {/* Slides */}
      <div 
        className="absolute inset-0 flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)`, direction: 'ltr' }}
      >
        {slides.map((slide, index) => {
          const desktopImage = slide.content?.image_url;
          const mobileImage = slide.content?.image_url_mobile || desktopImage;
          const hasImage = desktopImage || mobileImage;

          return (
          <div key={slide.id} className="relative min-w-full h-full">
            {hasImage ? (
              <picture className="w-full h-full block">
                {/* Mobile image (up to 768px) */}
                {mobileImage && (
                  <source media="(max-width: 768px)" srcSet={mobileImage} />
                )}
                {/* Desktop image */}
                <img 
                  src={desktopImage || mobileImage} 
                  alt={slide.content?.alt_text || ''} 
                  className="w-full h-full"
                  style={{ 
                    objectFit: imageFit as 'cover' | 'contain' | 'fill',
                    objectPosition: imagePosition
                  }}
                />
              </picture>
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">תמונה חסרה</span>
              </div>
            )}
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/30" />

            {/* Content */}
            <div className={`absolute inset-0 flex ${getVerticalPositionClass()} ${getHorizontalPositionClass()} px-8`} style={{ fontFamily }}>
              <div className={`max-w-4xl space-y-6 flex flex-col ${getTextAlignClass()}`}>
                {slide.content?.heading && (
                  <h2 
                    className={`${getSlideHeadingSizeClass()} text-white drop-shadow-md`}
                    style={{
                      color: slide.style?.typography?.color || headingTypography.color || textColor,
                      fontFamily: slide.style?.typography?.font_family || headingTypography.font_family || fontFamily,
                      fontSize: slide.style?.typography?.font_size || headingTypography.font_size || undefined,
                      fontWeight: slide.style?.typography?.font_weight || headingTypography.font_weight || 'bold',
                      lineHeight: slide.style?.typography?.line_height || headingTypography.line_height || undefined,
                      letterSpacing: slide.style?.typography?.letter_spacing || headingTypography.letter_spacing || undefined,
                      textTransform: slide.style?.typography?.text_transform || headingTypography.text_transform || undefined,
                    }}
                  >
                    {slide.content.heading}
                  </h2>
                )}
                {slide.content?.subheading && (
                  <p 
                    className={`${getSlideSubheadingSizeClass()} text-white/90 drop-shadow-sm`}
                    style={{
                      color: slide.style?.typography?.color || headingTypography.color || textColor,
                      fontFamily: slide.style?.typography?.font_family || headingTypography.font_family || fontFamily,
                      fontSize: slide.style?.typography?.font_size || headingTypography.font_size || undefined,
                      fontWeight: slide.style?.typography?.font_weight || headingTypography.font_weight || undefined,
                      lineHeight: slide.style?.typography?.line_height || headingTypography.line_height || undefined,
                      letterSpacing: slide.style?.typography?.letter_spacing || headingTypography.letter_spacing || undefined,
                    }}
                  >
                    {slide.content.subheading}
                  </p>
                )}
                {slide.content?.button_text && (
                  <a 
                    href={slide.content.button_url || '#'}
                    className="inline-block px-8 py-3 bg-white text-black font-medium rounded-md hover:bg-gray-100 transition-colors"
                  >
                    {slide.content.button_text}
                  </a>
                )}
              </div>
            </div>
          </div>
        )})}
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button 
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-10"
          >
            <HiChevronRight className="w-6 h-6" />
          </button>
          <button 
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-10"
          >
            <HiChevronLeft className="w-6 h-6" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  currentSlide === index ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export const Slideshow = React.memo(SlideshowComponent, sectionPropsAreEqual);

