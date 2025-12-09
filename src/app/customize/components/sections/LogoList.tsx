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
  const logos = section.blocks?.filter(b => b.type === 'image') || [];

  // Grid columns for desktop
  const getDesktopGridStyle = () => {
    const cols = settings.items_per_row_desktop || 6;
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
    };
  };

  // Mobile: horizontal scroll
  const getMobileItemWidth = () => {
    const itemsPerRow = settings.items_per_row_mobile || 2;
    return `${100 / itemsPerRow}%`;
  };

  // Logo width
  const getLogoWidth = () => {
    const width = settings.logo_width || 150;
    return `${width}px`;
  };

  // Grayscale effect
  const getGrayscaleClass = () => {
    return settings.grayscale_enabled ? 'grayscale hover:grayscale-0' : '';
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        {(settings.heading || settings.subheading) && (
          <div className="text-center mb-12 space-y-4">
            {settings.heading && (
              <h2 
                className="text-3xl md:text-4xl font-bold"
                style={{ color: settings.heading_color || '#000' }}
              >
                {settings.heading}
              </h2>
            )}
            {settings.subheading && (
              <p 
                className="text-lg md:text-xl"
                style={{ color: settings.subheading_color || '#666' }}
              >
                {settings.subheading}
              </p>
            )}
          </div>
        )}

        {/* Desktop Grid */}
        <div 
          className="hidden md:grid gap-8 items-center justify-items-center"
          style={getDesktopGridStyle()}
        >
          {logos.map((logo) => (
            <a
              key={logo.id}
              href={logo.content?.link_url || '#'}
              target={logo.content?.link_url ? '_blank' : undefined}
              rel={logo.content?.link_url ? 'noopener noreferrer' : undefined}
              className={`transition-all duration-300 ${getGrayscaleClass()} hover:scale-110`}
              style={{ width: getLogoWidth() }}
            >
              {logo.content?.image_url ? (
                <img
                  src={logo.content.image_url}
                  alt={logo.content.title || 'לוגו'}
                  className="w-full h-auto object-contain"
                  style={{ maxHeight: settings.logo_height || '80px' }}
                />
              ) : (
                <div 
                  className="w-full bg-gray-100 flex items-center justify-center text-gray-400"
                  style={{ height: settings.logo_height || '80px' }}
                >
                  <span className="text-sm">לוגו</span>
                </div>
              )}
              {logo.content?.title && (
                <p className="text-center text-sm mt-2 text-gray-600">{logo.content.title}</p>
              )}
            </a>
          ))}
        </div>

        {/* Mobile Horizontal Scroll */}
        <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4">
          <div className="flex gap-6 px-4 py-2" style={{ width: 'max-content' }}>
            {logos.map((logo) => (
              <a
                key={logo.id}
                href={logo.content?.link_url || '#'}
                target={logo.content?.link_url ? '_blank' : undefined}
                rel={logo.content?.link_url ? 'noopener noreferrer' : undefined}
                className={`flex-shrink-0 transition-all duration-300 ${getGrayscaleClass()}`}
                style={{ width: getMobileItemWidth(), maxWidth: getLogoWidth() }}
              >
                {logo.content?.image_url ? (
                  <img
                    src={logo.content.image_url}
                    alt={logo.content.title || 'לוגו'}
                    className="w-full h-auto object-contain"
                    style={{ maxHeight: settings.logo_height || '60px' }}
                  />
                ) : (
                  <div 
                    className="w-full bg-gray-100 flex items-center justify-center text-gray-400"
                    style={{ height: settings.logo_height || '60px' }}
                  >
                    <span className="text-xs">לוגו</span>
                  </div>
                )}
                {logo.content?.title && (
                  <p className="text-center text-xs mt-2 text-gray-600">{logo.content.title}</p>
                )}
              </a>
            ))}
          </div>
        </div>

        {/* Call to Action Button */}
        {settings.button_text && (
          <div className="text-center mt-12">
            <a
              href={settings.button_url || '#'}
              className="inline-block px-8 py-3 bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-colors"
              style={{
                backgroundColor: settings.button_background || '#000',
                color: settings.button_text_color || '#fff',
                borderRadius: settings.button_border_radius || '0.375rem'
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

