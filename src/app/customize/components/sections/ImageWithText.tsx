'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';

interface ImageWithTextProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
}

export function ImageWithText({ section, onUpdate }: ImageWithTextProps) {
  const settings = section.settings || {};
  const style = section.style || {};
  const blocks = section.blocks || [];
  
  // Find content blocks
  const imageBlock = blocks.find(b => b.type === 'image');
  const textBlock = blocks.find(b => b.type === 'text');

  // Layout Logic
  const isImageRight = settings.layout === 'image_right'; // In RTL: Image Start
  // Tailwind row direction: 
  // flex-row in RTL: Start is Right.
  // flex-row-reverse in RTL: Start is Left.
  
  // If we want Image Right (Start in RTL) -> flex-row
  // If we want Image Left (End in RTL) -> flex-row-reverse
  const flexDirection = isImageRight ? 'md:flex-row' : 'md:flex-row-reverse';

  // Image Width Logic
  const getImageWidthClass = () => {
    switch (settings.image_width) {
        case 'small': return 'md:w-3/12';
        case 'large': return 'md:w-7/12';
        case 'medium':
        default: return 'md:w-1/2';
    }
  };

  // Button Styles (Duplicated from HeroBanner for now)
  const getButtonStyles = () => {
    const buttonStyleObj = style.button || {};
    const buttonStyle = buttonStyleObj.style || 'solid';

    const baseClasses = 'inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg transition-all';

    let styleClasses = '';
    let inlineStyles: React.CSSProperties = {};

    switch (buttonStyle) {
      case 'outline':
        styleClasses = 'border-2';
        inlineStyles = {
          borderColor: buttonStyleObj.background_color || '#2563EB',
          color: buttonStyleObj.text_color || '#2563EB',
          backgroundColor: 'transparent',
        };
        break;
      case 'white':
        styleClasses = 'border border-white shadow-sm';
        inlineStyles = {
          backgroundColor: '#FFFFFF',
          color: '#000000',
        };
        break;
      case 'black':
        styleClasses = 'border border-black';
        inlineStyles = {
          backgroundColor: '#000000',
          color: '#FFFFFF',
        };
        break;
      case 'underline':
        styleClasses = 'border-b-2 rounded-none px-0 py-2';
        inlineStyles = {
          borderColor: buttonStyleObj.background_color || '#2563EB',
          color: buttonStyleObj.text_color || '#2563EB',
          backgroundColor: 'transparent',
        };
        break;
      case 'solid':
      default:
        inlineStyles = {
          backgroundColor: buttonStyleObj.background_color || '#2563EB',
          color: buttonStyleObj.text_color || '#FFFFFF',
        };
        break;
    }

    return { className: `${baseClasses} ${styleClasses}`, style: inlineStyles };
  };

  const fontFamily = style.typography?.font_family || 'system-ui';
  const textColor = style.typography?.color || '#111827';

  return (
    <div className="w-full" style={{ fontFamily }}>
      <div className="container mx-auto px-4">
        <div className={`flex flex-col ${flexDirection} gap-12 items-center`}>
            {/* Image Side */}
            <div className={`w-full ${getImageWidthClass()}`}>
                <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden shadow-sm">
                    {imageBlock?.content?.image_url ? (
                        <img 
                            src={imageBlock.content.image_url} 
                            alt={imageBlock.content.alt_text || 'תמונה'} 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex items-center justify-center w-full h-full text-gray-400">
                            <span>בחר תמונה</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Text Side */}
            <div className="w-full flex-1">
                <div className={`flex flex-col ${textBlock?.style?.text_align === 'center' ? 'items-center text-center' : textBlock?.style?.text_align === 'left' ? 'items-end text-left' : 'items-start text-right'}`}>
                    {textBlock?.content?.heading && (
                        <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: textColor }}>
                            {textBlock.content.heading}
                        </h2>
                    )}
                    
                    {textBlock?.content?.text && (
                        <div 
                            className="prose prose-lg text-gray-600 mb-8 max-w-none"
                            dangerouslySetInnerHTML={{ __html: textBlock.content.text }}
                            style={{ color: textColor ? `${textColor}CC` : undefined }}
                        />
                    )}

                    {textBlock?.content?.button_text && (
                        <a 
                            href={textBlock.content.button_url || '#'}
                            {...getButtonStyles()}
                            onMouseEnter={(e) => {
                                const hoverBg = style.button?.hover_background_color;
                                const hoverText = style.button?.hover_text_color;
                                if (hoverBg) e.currentTarget.style.backgroundColor = hoverBg;
                                if (hoverText) e.currentTarget.style.color = hoverText;
                            }}
                            onMouseLeave={(e) => {
                                // Reset logic duplicated from HeroBanner
                                const normalBg = style.button?.background_color || '#2563EB';
                                const normalText = style.button?.text_color || '#FFFFFF';
                                const bStyle = style.button?.style || 'solid';
                                
                                if (bStyle === 'solid') {
                                    e.currentTarget.style.backgroundColor = normalBg;
                                    e.currentTarget.style.color = normalText;
                                } else if (bStyle === 'outline' || bStyle === 'underline') {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = normalText;
                                }
                            }}
                        >
                            {textBlock.content.button_text}
                        </a>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
