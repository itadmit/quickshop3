'use client';

import React, { useState, useEffect } from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';

interface SlideshowProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
}

export function Slideshow({ section, onUpdate }: SlideshowProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const settings = section.settings || {};
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

  const heightClass = settings.height === 'small' ? 'h-[40vh]' : 
                     settings.height === 'large' ? 'h-[80vh]' : 
                     settings.height === 'full' ? 'h-screen' : 'h-[60vh]';

  return (
    <div className={`relative w-full overflow-hidden group ${heightClass}`}>
      {/* Slides */}
      <div 
        className="absolute inset-0 flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)`, direction: 'ltr' }}
      >
        {slides.map((slide, index) => (
          <div key={slide.id} className="relative min-w-full h-full">
            {slide.content?.image_url ? (
              <img 
                src={slide.content.image_url} 
                alt={slide.content.alt_text || ''} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">תמונה חסרה</span>
              </div>
            )}
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/30" />

            {/* Content */}
            <div className="absolute inset-0 flex items-center justify-center text-center px-4">
              <div className="max-w-4xl space-y-6">
                {slide.content?.heading && (
                  <h2 className="text-4xl md:text-6xl font-bold text-white drop-shadow-md">
                    {slide.content.heading}
                  </h2>
                )}
                {slide.content?.subheading && (
                  <p className="text-xl md:text-2xl text-white/90 drop-shadow-sm">
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
        ))}
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

