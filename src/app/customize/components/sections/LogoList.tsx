'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { HiPlus } from 'react-icons/hi';

interface LogoListProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
}

export function LogoList({ section, onUpdate }: LogoListProps) {
  const settings = section.settings || {};
  const style = section.style || {};
  const logos = section.blocks?.filter(b => b.type === 'image') || [];

  // Get style values with defaults
  const typography = style.typography || {};
  const buttonStyle = style.button || {};

  // Grid columns for desktop
  const getDesktopGridStyle = () => {
    const cols = settings.items_per_row_desktop || 6;
    const gap = settings.logo_gap || 'medium';
    const gapValue = gap === 'small' ? '0.5rem' : gap === 'large' ? '2rem' : '1rem';
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      gap: gapValue
    };
  };
  
  // Logo width
  const getLogoWidth = () => {
    const width = settings.logo_width;
    if (!width || width === '' || width === 'auto') return 'auto';
    return `${width}px`;
  };

  // Logo height - scales based on number of items
  const getLogoHeight = () => {
    const baseHeight = settings.logo_height || 80;
    const cols = settings.items_per_row_desktop || 6;
    // If more than 6 items, reduce height proportionally
    if (cols > 6) {
      return Math.round(baseHeight * (6 / cols));
    }
    return baseHeight;
  };

  // Grayscale effect
  const getGrayscaleClass = () => {
    return settings.grayscale_enabled ? 'grayscale hover:grayscale-0' : '';
  };

  // Section width class
  const getSectionWidthClass = () => {
    return settings.section_width === 'full' 
      ? 'w-full' 
      : 'container mx-auto';
  };

  return (
    <div className="w-full py-8 md:py-12">
      <div className={`${getSectionWidthClass()} px-4 sm:px-6 lg:px-8`}>
        {/* Header */}
        {(settings.heading || settings.subheading) && (
          <div className="text-center mb-12 space-y-4">
            {settings.heading && (
              <h2 
                className="text-3xl md:text-4xl font-bold"
                style={{ color: typography.color || '#000' }}
              >
                {settings.heading}
              </h2>
            )}
            {settings.subheading && (
              <p 
                className="text-lg md:text-xl opacity-70"
                style={{ color: typography.color || '#666' }}
              >
                {settings.subheading}
              </p>
            )}
          </div>
        )}

        {/* Desktop - Grid or Slider */}
        {settings.display_type === 'slider' ? (
          // Desktop Slider
          <div className="hidden md:block overflow-x-auto scrollbar-hide -mx-4">
            <div className="flex px-4 py-2" style={{ width: 'max-content', gap: settings.logo_gap === 'small' ? '0.5rem' : settings.logo_gap === 'large' ? '2rem' : '1rem' }}>
              {logos.map((logo) => (
                <div
                  key={logo.id}
                  className="flex-shrink-0"
                  style={{ width: getLogoWidth() === 'auto' ? '180px' : getLogoWidth() }}
                >
                  <a
                    href={logo.content?.link_url || '#'}
                    target={logo.content?.link_url ? '_blank' : undefined}
                    rel={logo.content?.link_url ? 'noopener noreferrer' : undefined}
                    className={`block transition-all duration-300 ${getGrayscaleClass()} hover:scale-105`}
                  >
                    {logo.content?.image_url ? (
                      <img
                        src={logo.content.image_url}
                        alt={logo.content.title || 'לוגו'}
                        className="w-full h-auto object-contain"
                        style={{ maxHeight: `${getLogoHeight()}px` }}
                      />
                    ) : (
                      <div 
                        className="w-full bg-gray-200 rounded-md"
                        style={{ height: `${getLogoHeight()}px` }}
                      />
                    )}
                  </a>
                  {(logo.content?.title || logo.content?.description) && (
                    <div className="mt-3 text-center">
                      {logo.content?.title && (
                        <h3 className="text-sm font-semibold mb-1" style={{ color: typography.color || '#000' }}>
                          {logo.content.title}
                        </h3>
                      )}
                      {logo.content?.description && (
                        <p className="text-xs opacity-70" style={{ color: typography.color || '#666' }}>
                          {logo.content.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Desktop Grid
          <div 
            className="hidden md:grid items-start justify-items-center"
            style={getDesktopGridStyle()}
          >
            {logos.map((logo) => (
              <div
                key={logo.id}
                className="w-full flex flex-col items-center"
              >
                <a
                  href={logo.content?.link_url || '#'}
                  target={logo.content?.link_url ? '_blank' : undefined}
                  rel={logo.content?.link_url ? 'noopener noreferrer' : undefined}
                  className={`transition-all duration-300 ${getGrayscaleClass()} hover:scale-105 w-full flex items-center justify-center p-2`}
                  style={{ width: getLogoWidth() === 'auto' ? '100%' : getLogoWidth() }}
                >
                  {logo.content?.image_url ? (
                    <img
                      src={logo.content.image_url}
                      alt={logo.content.title || 'לוגו'}
                      className="w-full h-auto object-contain"
                      style={{ maxHeight: `${getLogoHeight()}px` }}
                    />
                  ) : (
                    <div 
                      className="bg-gray-200 rounded-md w-full"
                      style={{ height: `${getLogoHeight()}px` }}
                    />
                  )}
                </a>
                {(logo.content?.title || logo.content?.description) && (
                  <div className="mt-3 text-center w-full">
                    {logo.content?.title && (
                      <h3 className="text-sm font-semibold mb-1" style={{ color: typography.color || '#000' }}>
                        {logo.content.title}
                      </h3>
                    )}
                    {logo.content?.description && (
                      <p className="text-xs opacity-70" style={{ color: typography.color || '#666' }}>
                        {logo.content.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Mobile Horizontal Scroll (always slider) */}
        <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4">
          <div className="flex px-4 py-2" style={{ width: 'max-content', gap: settings.logo_gap === 'small' ? '0.5rem' : settings.logo_gap === 'large' ? '2rem' : '1rem' }}>
            {logos.map((logo) => (
              <div
                key={logo.id}
                className="flex-shrink-0"
                style={{ width: getLogoWidth() === 'auto' ? `${100 / (settings.items_per_row_mobile || 2)}vw` : getLogoWidth(), maxWidth: getLogoWidth() === 'auto' ? '150px' : undefined }}
              >
                <a
                  href={logo.content?.link_url || '#'}
                  target={logo.content?.link_url ? '_blank' : undefined}
                  rel={logo.content?.link_url ? 'noopener noreferrer' : undefined}
                  className={`block transition-all duration-300 ${getGrayscaleClass()}`}
                >
                  {logo.content?.image_url ? (
                    <img
                      src={logo.content.image_url}
                      alt={logo.content.title || 'לוגו'}
                      className="w-full h-auto object-contain"
                      style={{ maxHeight: `${settings.logo_height || 60}px` }}
                    />
                  ) : (
                    <div 
                      className="w-full bg-gray-200 rounded-md"
                      style={{ height: `${settings.logo_height || 60}px` }}
                    />
                  )}
                </a>
                {(logo.content?.title || logo.content?.description) && (
                  <div className="mt-2 text-center">
                    {logo.content?.title && (
                      <h3 className="text-xs font-semibold mb-1" style={{ color: typography.color || '#000' }}>
                        {logo.content.title}
                      </h3>
                    )}
                    {logo.content?.description && (
                      <p className="text-xs opacity-70 line-clamp-2" style={{ color: typography.color || '#666' }}>
                        {logo.content.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action Button */}
        {settings.button_text && (
          <div className="text-center mt-12">
            <a
              href={settings.button_url || '#'}
              className="inline-block px-8 py-3 font-medium transition-colors"
              style={{
                backgroundColor: buttonStyle.background_color || '#000',
                color: buttonStyle.text_color || '#fff',
                borderRadius: buttonStyle.border_radius || '8px'
              }}
            >
              {settings.button_text}
            </a>
          </div>
        )}

        {/* Empty State */}
        {logos.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <HiPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">הוסף לוגואים דרך סרגל העריכה</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

