'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { sectionPropsAreEqual } from './sectionMemoUtils';

interface HeroBannerProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
}

function HeroBannerComponent({ section, onUpdate }: HeroBannerProps) {
  // Use responsive settings that are already merged in SectionRenderer
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
    // ✅ ב-RTL: justify-start = ימין, justify-end = שמאל
    // אם המשתמש בוחר 'ימין' (right), זה צריך להיות justify-start
    // אם המשתמש בוחר 'שמאל' (left), זה צריך להיות justify-end
    switch (settings.content_position_horizontal) {
      case 'right': return 'justify-start'; // ימין ב-RTL
      case 'left': return 'justify-end'; // שמאל ב-RTL
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

  // Typography settings - use specific typography for heading, content, button
  const headingTypography = section.style?.typography?.heading || {};
  const contentTypography = section.style?.typography?.content || {};
  const buttonTypography = section.style?.typography?.button || {};
  
  // Base text color from style panel (fallback)
  const textColor = headingTypography.color || section.style?.typography?.color || '#111827';
  
  // We can derive a lighter shade for subheading or just use opacity
  const subheadingColor = contentTypography.color || (section.style?.typography?.color 
    ? `${section.style.typography.color}CC` // 80% opacity hex
    : '#4B5563');

  // Button styles
  const getButtonStyles = () => {
    const style = section.style?.button || {};
    const buttonStyle = style.style || 'solid';
    const borderRadius = style.border_radius || '8px';

    const baseClasses = 'inline-flex items-center justify-center px-8 py-4 text-base font-semibold transition-all';

    let styleClasses = '';
    let inlineStyles: React.CSSProperties = {
      borderRadius: buttonStyle === 'underline' ? '0' : borderRadius,
    };

    switch (buttonStyle) {
      case 'outline':
        styleClasses = 'border-2';
        inlineStyles = {
          ...inlineStyles,
          borderColor: style.background_color || '#FFFFFF',
          color: style.text_color || '#FFFFFF',
          backgroundColor: 'transparent',
        };
        break;
      case 'white':
        styleClasses = 'border border-white';
        inlineStyles = {
          ...inlineStyles,
          backgroundColor: '#FFFFFF',
          color: '#000000',
        };
        break;
      case 'black':
        styleClasses = 'border border-black';
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
          borderColor: style.background_color || '#2563EB',
          color: style.text_color || '#2563EB',
          backgroundColor: 'transparent',
        };
        break;
      case 'solid':
      default:
        inlineStyles = {
          ...inlineStyles,
          backgroundColor: style.background_color || '#2563EB',
          color: style.text_color || '#FFFFFF',
        };
        break;
    }

    return { className: `${baseClasses} ${styleClasses}`, style: inlineStyles };
  };

  // Font family - use heading typography or fallback
  const fontFamily = headingTypography.font_family || section.style?.typography?.font_family || '"Noto Sans Hebrew", sans-serif';
  
  // Heading font size
  const getHeadingSizeClass = () => {
    const size = settings.heading_font_size || 'xlarge';
    const sizeMap: Record<string, string> = {
      small: 'text-2xl md:text-3xl',
      medium: 'text-3xl md:text-4xl',
      large: 'text-4xl md:text-5xl',
      xlarge: 'text-4xl md:text-6xl',
    };
    return sizeMap[size] || 'text-4xl md:text-6xl';
  };
  
  // Subheading font size
  const getSubheadingSizeClass = () => {
    const size = settings.subheading_font_size || 'large';
    const sizeMap: Record<string, string> = {
      small: 'text-base md:text-lg',
      medium: 'text-lg md:text-xl',
      large: 'text-xl md:text-2xl',
      xlarge: 'text-2xl md:text-3xl',
    };
    return sizeMap[size] || 'text-xl md:text-2xl';
  };

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
            className={`${getHeadingSizeClass()} mb-6 max-w-4xl`}
            style={{ 
              color: headingTypography.color || textColor,
              fontFamily: headingTypography.font_family || fontFamily,
              fontSize: headingTypography.font_size || undefined,
              fontWeight: headingTypography.font_weight || 'bold',
              lineHeight: headingTypography.line_height || undefined,
              letterSpacing: headingTypography.letter_spacing || undefined,
              textTransform: headingTypography.text_transform || undefined,
            }}
          >
            {settings.heading}
          </h1>
        )}

        {/* Subheading */}
        {settings.subheading && (
          <p 
            className={`${getSubheadingSizeClass()} mb-8 max-w-2xl`}
            style={{ 
              color: contentTypography.color || subheadingColor,
              fontFamily: contentTypography.font_family || fontFamily,
              fontSize: contentTypography.font_size || undefined,
              fontWeight: contentTypography.font_weight || undefined,
              lineHeight: contentTypography.line_height || undefined,
              letterSpacing: contentTypography.letter_spacing || undefined,
            }}
          >
            {settings.subheading}
          </p>
        )}

        {/* CTA Button */}
        {settings.button_text && (
          <a 
            href={settings.button_url || '#'}
            {...getButtonStyles()}
            style={{
              ...getButtonStyles().style,
              fontFamily: buttonTypography.font_family || fontFamily,
              fontSize: buttonTypography.font_size || undefined,
              fontWeight: buttonTypography.font_weight || undefined,
              lineHeight: buttonTypography.line_height || undefined,
              letterSpacing: buttonTypography.letter_spacing || undefined,
              textTransform: buttonTypography.text_transform || undefined,
            }}
            onMouseEnter={(e) => {
              const hoverBg = section.style?.button?.hover_background_color;
              const hoverText = section.style?.button?.hover_text_color;
              if (hoverBg) e.currentTarget.style.backgroundColor = hoverBg;
              if (hoverText) e.currentTarget.style.color = hoverText;
            }}
            onMouseLeave={(e) => {
              const normalBg = section.style?.button?.background_color || '#2563EB';
              const normalText = buttonTypography.color || section.style?.button?.text_color || '#FFFFFF';
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

export const HeroBanner = React.memo(HeroBannerComponent, sectionPropsAreEqual);
