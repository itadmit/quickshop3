'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';

interface NewsletterProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
}

export function Newsletter({ section, onUpdate }: NewsletterProps) {
  const settings = section.settings || {};
  const style = section.style || {};
  const blocks = section.blocks || [];
  
  const textBlock = blocks[0]; // Assuming single block for content as per template

  // Width Logic
  const getWidthClass = () => {
     return settings.content_width === 'narrow' ? 'max-w-2xl' : 'max-w-4xl';
  };

  // Height Logic
  const getHeightClass = () => {
    switch (settings.height) {
        case 'small': return 'py-12';
        case 'large': return 'py-24';
        case 'medium': 
        default: return 'py-16';
    }
  };
  
  // Button Styles (Duplicated from HeroBanner)
  const getButtonStyles = () => {
    const buttonStyleObj = style.button || {};
    const buttonStyle = buttonStyleObj.style || 'solid';

    const baseClasses = 'px-6 py-3 rounded-lg transition-all font-medium whitespace-nowrap';

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
  const textColor = style.typography?.color || '#111827'; // Dark text by default for light bg
  const isDarkBg = false; // Could calculate brightness if needed, but for now assuming user manages contrast

  return (
    <div className={`w-full ${getHeightClass()}`} style={{ fontFamily }}>
      <div className="container mx-auto px-4">
        <div className={`${getWidthClass()} mx-auto text-center`}>
          {textBlock?.content?.heading && (
            <h2 className="text-3xl font-bold mb-4" style={{ color: textColor }}>
                {textBlock.content.heading}
            </h2>
          )}
          
          {textBlock?.content?.subheading && (
            <p className="mb-8 text-lg" style={{ color: textColor ? `${textColor}CC` : '#4B5563' }}>
                {textBlock.content.subheading}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch max-w-md mx-auto">
            <input
              type="email"
              placeholder={settings.form_settings?.email_placeholder || 'הכנס את כתובת המייל'}
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
              style={{ textAlign: 'right' }} // Always right for Hebrew input
            />
            <button
               {...getButtonStyles()}
               onMouseEnter={(e) => {
                    const hoverBg = style.button?.hover_background_color;
                    const hoverText = style.button?.hover_text_color;
                    if (hoverBg) e.currentTarget.style.backgroundColor = hoverBg;
                    if (hoverText) e.currentTarget.style.color = hoverText;
                }}
                onMouseLeave={(e) => {
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
              {textBlock?.content?.button_text || 'הירשם'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
