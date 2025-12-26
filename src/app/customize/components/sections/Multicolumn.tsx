'use client';

import React from 'react';
import { SectionSettings, BlockSettings } from '@/lib/customizer/types';
import { HiPhotograph, HiPlus } from 'react-icons/hi';
import Link from 'next/link';
import { sectionPropsAreEqual } from './sectionMemoUtils';

interface MulticolumnProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
}

function MulticolumnComponent({ section, onUpdate }: MulticolumnProps) {
  const settings = section.settings || {};
  const style = section.style || {};
  const blocks = section.blocks || [];
  
  // Settings
  const title = settings.title || '';
  const titleAlign = settings.title_align || 'center';
  const columnsDesktop = settings.columns_desktop || 3;
  const columnsMobile = settings.columns_mobile || 1;
  const textAlign = settings.text_align || 'center';
  const columnGap = settings.column_gap || 'medium';
  const imageRatio = settings.image_ratio || 'square';
  const imageBorderRadius = settings.image_border_radius || '8px';
  const imageBorder = settings.image_border || false;
  
  // Button Styles
  const getButtonStyles = () => {
    const buttonStyleObj = style.button || {};
    const buttonStyle = buttonStyleObj.style || 'link';
    const borderRadius = buttonStyleObj.border_radius || '8px';

    let styleClasses = '';
    let inlineStyles: React.CSSProperties = {
      borderRadius: buttonStyle === 'underline' ? '0' : borderRadius,
    };

    switch (buttonStyle) {
      case 'outline':
        styleClasses = 'border-2 px-4 py-2';
        inlineStyles = {
          ...inlineStyles,
          borderColor: buttonStyleObj.background_color || '#2563EB',
          color: buttonStyleObj.text_color || '#2563EB',
          backgroundColor: 'transparent',
        };
        break;
      case 'white':
        styleClasses = 'border border-white shadow-sm px-4 py-2';
        inlineStyles = {
          ...inlineStyles,
          backgroundColor: '#FFFFFF',
          color: '#000000',
        };
        break;
      case 'black':
        styleClasses = 'border border-black px-4 py-2';
        inlineStyles = {
          ...inlineStyles,
          backgroundColor: '#000000',
          color: '#FFFFFF',
        };
        break;
      case 'underline':
        styleClasses = 'border-b-2 px-0 py-2';
        inlineStyles = {
          ...inlineStyles,
          borderRadius: '0',
          borderColor: buttonStyleObj.background_color || '#2563EB',
          color: buttonStyleObj.text_color || '#2563EB',
          backgroundColor: 'transparent',
        };
        break;
      case 'solid':
        styleClasses = 'px-4 py-2';
        inlineStyles = {
          ...inlineStyles,
          backgroundColor: buttonStyleObj.background_color || '#2563EB',
          color: buttonStyleObj.text_color || '#FFFFFF',
        };
        break;
      case 'link':
      default:
        styleClasses = 'hover:underline';
        inlineStyles = {
          ...inlineStyles,
          color: buttonStyleObj.text_color || '#2563EB',
          backgroundColor: 'transparent',
        };
        break;
    }

    return { className: `inline-flex items-center gap-1 mt-2 text-sm font-medium transition-all ${styleClasses}`, style: inlineStyles };
  };
  
  // Gap mapping
  const gapClasses: Record<string, string> = {
    small: 'gap-2 md:gap-4',
    medium: 'gap-4 md:gap-6',
    large: 'gap-6 md:gap-8',
  };
  
  // Image ratio mapping
  const ratioClasses: Record<string, string> = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
    circle: 'aspect-square rounded-full',
  };
  
  // Text alignment mapping
  const textAlignClasses: Record<string, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };
  
  // Grid columns mapping
  const gridColsClasses: Record<number, string> = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    5: 'md:grid-cols-5',
    6: 'md:grid-cols-6',
  };

  // Mobile grid columns mapping
  const mobileGridColsClasses: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
  };
  
  // If no blocks, show empty state
  if (blocks.length === 0) {
    return (
      <div className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {title && (
            <h2 className={`text-2xl font-bold mb-8 ${textAlignClasses[titleAlign]}`}>
              {title}
            </h2>
          )}
          <div className={`grid ${mobileGridColsClasses[columnsMobile]} ${gridColsClasses[columnsDesktop]} ${gapClasses[columnGap]}`}>
            {/* Show placeholder columns */}
            {Array.from({ length: columnsDesktop }).map((_, index) => (
              <div key={index} className={`${textAlignClasses[textAlign]}`}>
                <div 
                  className={`bg-gray-100 ${ratioClasses[imageRatio]} flex items-center justify-center mb-4 ${imageBorder ? 'border border-gray-200' : ''}`}
                  style={{ borderRadius: imageRatio === 'circle' ? '50%' : imageBorderRadius }}
                >
                  <HiPhotograph className="w-12 h-12 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">כותרת עמודה</h3>
                <p className="text-sm text-gray-500">הוסף תוכן דרך סרגל העריכה</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {title && (
          <h2 className={`text-2xl font-bold mb-8 ${textAlignClasses[titleAlign]}`}>
            {title}
          </h2>
        )}
        
        <div className={`grid ${mobileGridColsClasses[columnsMobile]} ${gridColsClasses[columnsDesktop]} ${gapClasses[columnGap]}`}>
          {blocks.map((block: BlockSettings) => (
            <div key={block.id} className={`${textAlignClasses[textAlign]}`}>
              {/* Image */}
              <div 
                className={`${ratioClasses[imageRatio]} mb-4 overflow-hidden ${imageBorder ? 'border border-gray-200' : ''} ${!block.content?.image_url ? 'bg-gray-100 flex items-center justify-center' : ''}`}
                style={{ borderRadius: imageRatio === 'circle' ? '50%' : imageBorderRadius }}
              >
                {block.content?.image_url ? (
                  <img 
                    src={block.content.image_url} 
                    alt={block.content?.heading || ''} 
                    className="w-full h-full object-cover"
                    style={{ borderRadius: imageRatio === 'circle' ? '50%' : imageBorderRadius }}
                  />
                ) : (
                  <HiPhotograph className="w-12 h-12 text-gray-300" />
                )}
              </div>
              
              {/* Content */}
              <div className="space-y-2">
                {block.content?.heading && (
                  <h3 className="text-lg font-semibold text-gray-800">
                    {block.content.heading}
                  </h3>
                )}
                {block.content?.text && (
                  <p className="text-sm text-gray-600">
                    {block.content.text}
                  </p>
                )}
                {block.content?.button_text && block.content?.button_url && (
                  <Link 
                    href={block.content.button_url}
                    {...getButtonStyles()}
                    onMouseEnter={(e) => {
                      const hoverBg = style.button?.hover_background_color;
                      const hoverText = style.button?.hover_text_color;
                      if (hoverBg) e.currentTarget.style.backgroundColor = hoverBg;
                      if (hoverText) e.currentTarget.style.color = hoverText;
                    }}
                    onMouseLeave={(e) => {
                      const buttonStyleObj = style.button || {};
                      const buttonStyle = buttonStyleObj.style || 'link';
                      const normalBg = buttonStyleObj.background_color || (buttonStyle === 'solid' ? '#2563EB' : 'transparent');
                      const normalText = buttonStyleObj.text_color || '#2563EB';
                      
                      if (buttonStyle === 'solid' || buttonStyle === 'black' || buttonStyle === 'white') {
                        e.currentTarget.style.backgroundColor = normalBg;
                        e.currentTarget.style.color = normalText;
                      } else {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = normalText;
                      }
                    }}
                  >
                    <span>{block.content.button_text}</span>
                    <span>←</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const Multicolumn = React.memo(MulticolumnComponent, sectionPropsAreEqual);
