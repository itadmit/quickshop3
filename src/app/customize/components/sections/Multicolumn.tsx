'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { HiPhotograph } from 'react-icons/hi';

interface MulticolumnProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
  editorDevice?: 'desktop' | 'tablet' | 'mobile';
}

export function Multicolumn({ section, onUpdate, editorDevice }: MulticolumnProps) {
  const settings = section.settings || {};
  const style = section.style || {};
  const blocks = section.blocks?.filter(b => b.type === 'text' || b.type === 'image') || [];

  // Get settings
  const title = settings.title || '';
  const columnsDesktop = settings.columns_desktop || 3;
  const columnsMobile = settings.columns_mobile || 1;
  const imageRatio = settings.image_ratio || 'square';
  const textAlign = settings.text_align || 'center';
  const titleAlign = settings.title_align || 'center';
  const showImageBorder = settings.image_border === true;
  const imageBorderRadius = settings.image_border_radius || '8px';
  const gap = settings.column_gap || 'medium';

  // Determine if mobile view
  const isMobileView = editorDevice === 'mobile' || editorDevice === 'tablet';
  const effectiveColumns = isMobileView ? columnsMobile : columnsDesktop;

  // Typography
  const fontFamily = style.typography?.font_family || '"Noto Sans Hebrew", sans-serif';
  const textColor = style.typography?.color || '#111827';

  // Grid columns classes
  const getGridCols = () => {
    if (isMobileView) {
      return columnsMobile === 2 ? 'grid-cols-2' : 'grid-cols-1';
    }
    // Desktop responsive classes
    const mobileClass = columnsMobile === 2 ? 'grid-cols-2' : 'grid-cols-1';
    switch (columnsDesktop) {
      case 2: return `${mobileClass} md:grid-cols-2`;
      case 3: return `${mobileClass} md:grid-cols-3`;
      case 4: return `${mobileClass} md:grid-cols-4`;
      case 5: return `${mobileClass} md:grid-cols-5`;
      case 6: return `${mobileClass} md:grid-cols-6`;
      default: return `${mobileClass} md:grid-cols-3`;
    }
  };

  // Gap classes
  const gapClasses = {
    small: 'gap-4',
    medium: 'gap-6 md:gap-8',
    large: 'gap-8 md:gap-12',
  }[gap] || 'gap-6 md:gap-8';

  // Image ratio classes
  const imageRatioClasses = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
    circle: 'aspect-square rounded-full',
  }[imageRatio] || 'aspect-square';

  // Text alignment classes
  const textAlignClasses = {
    left: 'text-left items-end',
    center: 'text-center items-center',
    right: 'text-right items-start',
  }[textAlign] || 'text-center items-center';

  const titleAlignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[titleAlign] || 'text-center';

  // Button styles helper
  const getButtonStyles = (block: any) => {
    const buttonStyle = block.style?.button_style || 'solid';
    const buttonBg = block.style?.button_background || style.button?.background_color || '#000000';
    const buttonText = block.style?.button_text || style.button?.text_color || '#FFFFFF';
    const borderRadius = style.button?.border_radius || '8px';

    const baseClasses = 'inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium transition-colors';
    
    if (buttonStyle === 'outline') {
      return {
        className: `${baseClasses} border-2`,
        style: { borderColor: buttonBg, color: buttonBg, backgroundColor: 'transparent', borderRadius }
      };
    }
    if (buttonStyle === 'link') {
      return {
        className: `${baseClasses} underline`,
        style: { color: buttonBg, backgroundColor: 'transparent' }
      };
    }
    return {
      className: baseClasses,
      style: { backgroundColor: buttonBg, color: buttonText, borderRadius }
    };
  };

  return (
    <div className="w-full py-12 md:py-16" style={{ fontFamily }}>
      <div className="container mx-auto px-4">
        {/* Section Title */}
        {title && (
          <h2 
            className={`text-2xl md:text-3xl font-bold mb-8 md:mb-12 ${titleAlignClasses}`}
            style={{ color: textColor }}
          >
            {title}
          </h2>
        )}

        {/* Columns Grid */}
        <div className={`grid ${getGridCols()} ${gapClasses}`}>
          {blocks.length > 0 ? (
            blocks.map((block, index) => (
              <div key={block.id} className={`flex flex-col ${textAlignClasses}`}>
                {/* Column Image */}
                {block.content?.image_url && (
                  <div 
                    className={`${imageRatioClasses} bg-gray-100 overflow-hidden mb-4 ${showImageBorder ? 'border border-gray-200' : ''}`}
                    style={{ borderRadius: imageRatio === 'circle' ? '50%' : imageBorderRadius }}
                  >
                    <img 
                      src={block.content.image_url}
                      alt={block.content.heading || `עמודה ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* Column Icon (if no image) */}
                {!block.content?.image_url && block.content?.icon && (
                  <div className="w-12 h-12 mx-auto mb-4 text-gray-400">
                    <HiPhotograph className="w-full h-full" />
                  </div>
                )}

                {/* Column Heading */}
                {block.content?.heading && (
                  <h3 
                    className="text-lg font-semibold mb-2"
                    style={{ color: textColor }}
                  >
                    {block.content.heading}
                  </h3>
                )}

                {/* Column Text */}
                {block.content?.text && (
                  <div 
                    className="text-sm text-gray-600 mb-4 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: block.content.text }}
                  />
                )}

                {/* Column Button */}
                {block.content?.button_text && (
                  <a 
                    href={block.content.button_url || '#'}
                    {...getButtonStyles(block)}
                  >
                    {block.content.button_text}
                  </a>
                )}
              </div>
            ))
          ) : (
            // Placeholder columns
            Array.from({ length: effectiveColumns }).map((_, index) => (
              <div key={index} className={`flex flex-col ${textAlignClasses}`}>
                <div 
                  className={`${imageRatioClasses} bg-gray-100 mb-4 flex items-center justify-center text-gray-300`}
                  style={{ borderRadius: imageRatio === 'circle' ? '50%' : imageBorderRadius }}
                >
                  <HiPhotograph className="w-12 h-12" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-400">כותרת עמודה</h3>
                <p className="text-sm text-gray-400">הוסף תוכן דרך סרגל העריכה</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

