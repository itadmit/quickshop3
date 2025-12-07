/**
 * Storefront - Slideshow Section Component
 * קומפוננטת סליידשו
 */

'use client';

import { useState, useEffect } from 'react';
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
  const slides = settings.slides || blocks || [];

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

  const currentSlideData = slides[currentSlide];

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

