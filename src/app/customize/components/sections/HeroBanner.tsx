'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';

interface HeroBannerProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
}

export function HeroBanner({ section, onUpdate }: HeroBannerProps) {
  const settings = section.settings || {};
  
  // Height logic
  const getHeightClass = () => {
    switch (settings.height) {
      case 'small': return 'min-h-[40vh]';
      case 'large': return 'min-h-[80vh]';
      case 'full_screen': return 'min-h-screen';
      case 'medium':
      default: return 'min-h-[60vh]';
    }
  };

  // Content position vertical
  const getVerticalPositionClass = () => {
    switch (settings.content_position_vertical) {
      case 'top': return 'justify-start';
      case 'bottom': return 'justify-end';
      case 'center':
      default: return 'justify-center';
    }
  };

  // Content position horizontal - note the container needs to allow horizontal positioning
  const getHorizontalContainerClass = () => {
    // We need a full-width container with flexbox to control horizontal alignment
    return 'w-full flex';
  };

  const getHorizontalPositionClass = () => {
    switch (settings.content_position_horizontal) {
      case 'left': return 'justify-start';
      case 'right': return 'justify-end';
      case 'center':
      default: return 'justify-center';
    }
  };

  // Text align logic
  const getTextAlignClass = () => {
    switch (settings.text_align) {
      case 'left': return 'text-left';
      case 'right': return 'text-right';
      case 'center':
      default: return 'text-center';
    }
  };

  // Items align for inner content
  const getItemsAlignClass = () => {
    switch (settings.text_align) {
      case 'left': return 'items-start';
      case 'right': return 'items-end';
      case 'center':
      default: return 'items-center';
    }
  };

  // Base text color from style panel
  const textColor = section.style?.typography?.color || '#111827';
  
  // We can derive a lighter shade for subheading or just use opacity
  const subheadingColor = section.style?.typography?.color 
    ? `${section.style.typography.color}CC` // 80% opacity hex
    : '#4B5563';

  // Button styles
  const getButtonStyles = () => {
    const style = section.style?.button || {};
    const buttonStyle = style.style || 'solid';

    const baseClasses = 'inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-lg transition-all';

    let styleClasses = '';
    let inlineStyles: React.CSSProperties = {};

    switch (buttonStyle) {
      case 'outline':
        styleClasses = 'border-2';
        inlineStyles = {
          borderColor: style.background_color || '#2563EB',
          color: style.text_color || '#2563EB',
          backgroundColor: 'transparent',
        };
        break;
      case 'white':
        styleClasses = 'border border-white';
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
          borderColor: style.background_color || '#2563EB',
          color: style.text_color || '#2563EB',
          backgroundColor: 'transparent',
        };
        break;
      case 'solid':
      default:
        inlineStyles = {
          backgroundColor: style.background_color || '#2563EB',
          color: style.text_color || '#FFFFFF',
        };
        break;
    }

    return { className: `${baseClasses} ${styleClasses}`, style: inlineStyles };
  };

  // Font family
  const fontFamily = section.style?.typography?.font_family || 'system-ui';

  return (
    <div 
      className={`relative flex flex-col w-full ${getHeightClass()} ${getVerticalPositionClass()}`}
      style={{ fontFamily }}
    >
      <div className={`${getHorizontalContainerClass()} ${getHorizontalPositionClass()} px-6`}>
        <div className={`relative z-10 w-full max-w-7xl flex flex-col ${getTextAlignClass()} ${getItemsAlignClass()}`}>
        {/* Heading */}
        {settings.heading && (
          <h1 
            className="text-4xl md:text-6xl font-bold mb-6 max-w-4xl"
            style={{ color: textColor }}
          >
            {settings.heading}
          </h1>
        )}

        {/* Subheading */}
        {settings.subheading && (
          <p 
            className="text-xl md:text-2xl mb-8 max-w-2xl"
            style={{ color: subheadingColor }}
          >
            {settings.subheading}
          </p>
        )}

        {/* CTA Button */}
        {settings.button_text && (
          <a 
            href={settings.button_url || '#'}
            {...getButtonStyles()}
            onMouseEnter={(e) => {
              const hoverBg = section.style?.button?.hover_background_color;
              const hoverText = section.style?.button?.hover_text_color;
              if (hoverBg) e.currentTarget.style.backgroundColor = hoverBg;
              if (hoverText) e.currentTarget.style.color = hoverText;
            }}
            onMouseLeave={(e) => {
              const normalBg = section.style?.button?.background_color || '#2563EB';
              const normalText = section.style?.button?.text_color || '#FFFFFF';
              const buttonStyle = section.style?.button?.style || 'solid';
              
              if (buttonStyle === 'solid') {
                e.currentTarget.style.backgroundColor = normalBg;
                e.currentTarget.style.color = normalText;
              } else if (buttonStyle === 'outline' || buttonStyle === 'underline') {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = normalText;
              }
            }}
          >
            {settings.button_text}
          </a>
        )}
        </div>
      </div>
    </div>
  );
}
