/**
 * Storefront - Slideshow Section Component
 * קומפוננטת סליידשו
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';

interface SlideshowProps {
  settings: {
    heading?: string;
    subheading?: string;
    auto_rotate?: boolean;
    auto_rotate_interval?: number;
    show_pagination?: boolean;
    show_navigation?: boolean;
    slides?: Array<{
      image_url: string;
      heading?: string;
      subheading?: string;
      cta_text?: string;
      cta_link?: string;
    }>;
  };
  blocks?: any[];
  globalSettings?: any;
}

export function Slideshow({ settings, blocks, globalSettings }: SlideshowProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dynamicBlocks, setDynamicBlocks] = useState(blocks);
  
  // עדכן את ה-blocks כשהם משתנים
  useEffect(() => {
    setDynamicBlocks(blocks);
  }, [blocks]);
  
  // האזן לעדכוני blocks בזמן אמת
  useEffect(() => {
    function handleBlockUpdate(event: CustomEvent) {
      const { blockId, sectionId, settings: blockSettings } = event.detail;
      
      console.log('Block update received:', { blockId, sectionId, blockSettings });
      
      // עדכן את ה-blocks
      setDynamicBlocks((prevBlocks: any) => {
        if (!prevBlocks) return prevBlocks;
        
        const updated = prevBlocks.map((block: any) => {
          // בדוק אם זה הבלוק הנכון - נסה כמה אפשרויות
          const matches = 
            block.block_id === blockId || 
            block.id === blockId ||
            String(block.block_id) === String(blockId) ||
            String(block.id) === String(blockId);
            
          if (matches) {
            console.log('Updating block:', block, 'with settings:', blockSettings);
            return {
              ...block,
              settings_json: blockSettings,
              settings: blockSettings,
            };
          }
          return block;
        });
        
        console.log('Updated blocks:', updated);
        return updated;
      });
    }
    
    function handleBlocksUpdated() {
      // רענון כללי של ה-blocks
      console.log('Blocks updated event received, refreshing blocks');
      setDynamicBlocks(blocks);
    }
    
    window.addEventListener('block-settings-updated', handleBlockUpdate as EventListener);
    document.addEventListener('blocks-updated', handleBlocksUpdated);
    
    return () => {
      window.removeEventListener('block-settings-updated', handleBlockUpdate as EventListener);
      document.removeEventListener('blocks-updated', handleBlocksUpdated);
    };
  }, [blocks]);
  
  // המרת blocks מ-DB לפורמט slides - עם useMemo לעדכון אוטומטי
  const slidesFromBlocks = useMemo(() => {
    const blocksToUse = dynamicBlocks || blocks || [];
    console.log('Slideshow: Computing slides from blocks', { blocksToUse, dynamicBlocks, blocks });

    if (blocksToUse.length === 0) {
      console.log('Slideshow: No blocks found');
      return [];
    }

    const computed = blocksToUse.map((block: any, index: number) => {
      console.log(`Slideshow: Processing block ${index}`, block);
      const image = block.settings?.image || block.settings_json?.image || '';
      const heading = block.settings?.heading || block.settings_json?.heading || '';
      const description = block.settings?.description || block.settings_json?.description || '';
      const buttonText = block.settings?.button_text || block.settings_json?.button_text || '';
      const buttonLink = block.settings?.button_link || block.settings_json?.button_link || '';

      console.log(`Slideshow: Block ${index} values`, { image, heading, description, buttonText, buttonLink });

      return {
        image_url: image,
        heading: heading,
        subheading: description,
        cta_text: buttonText,
        cta_link: buttonLink,
      };
    }).filter((slide: any) => slide.image_url);

    console.log('Slideshow: Computed slides', computed);
    return computed;
  }, [dynamicBlocks, blocks]);
  
  const slides = useMemo(() => {
    // Prefer blocks over section settings - blocks are editable in customizer
    return slidesFromBlocks.length > 0 ? slidesFromBlocks : (settings.slides || []);
  }, [settings.slides, slidesFromBlocks]);
  
  console.log('Slideshow: Final slides', slides);

  useEffect(() => {
    if (!settings.auto_rotate || slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, (settings.auto_rotate_interval || 5) * 1000);

    return () => clearInterval(interval);
  }, [settings.auto_rotate, settings.auto_rotate_interval, slides.length]);

  if (slides.length === 0) {
    return null;
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
      {/* Slides */}
      <div className="relative w-full h-full">
        {slides.map((slide: any, index: number) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <div className="relative w-full h-full">
              {slide.image_url && (
                <Image
                  src={slide.image_url}
                  alt={slide.heading || `Slide ${index + 1}`}
                  fill
                  className="object-cover"
                  priority={index === 0}
                />
              )}
              
              {/* Overlay Content */}
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                <div className="text-center text-white px-4 max-w-2xl">
                  {slide.heading && (
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">
                      {slide.heading}
                    </h2>
                  )}
                  {slide.subheading && (
                    <p className="text-lg md:text-xl mb-6">{slide.subheading}</p>
                  )}
                  {slide.cta_text && slide.cta_link && (
                    <a
                      href={slide.cta_link}
                      className="inline-block px-8 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      {slide.cta_text}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      {settings.show_navigation && slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-opacity"
            aria-label="Previous slide"
          >
            ←
          </button>
          <button
            onClick={nextSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-opacity"
            aria-label="Next slide"
          >
            →
          </button>
        </>
      )}

      {/* Pagination */}
      {settings.show_pagination !== false && slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_: any, index: number) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide
                  ? 'bg-white w-8'
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

