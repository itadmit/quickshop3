'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { sectionPropsAreEqual } from './sectionMemoUtils';

interface ImageWithTextProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
  editorDevice?: 'desktop' | 'tablet' | 'mobile';
}

function ImageWithTextComponent({ section, onUpdate, editorDevice }: ImageWithTextProps) {
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
  
  // If in editor mobile/tablet view, force vertical layout
  const isMobileView = editorDevice === 'mobile' || editorDevice === 'tablet';
  
  // If we want Image Right (Start in RTL) -> flex-row
  // If we want Image Left (End in RTL) -> flex-row-reverse
  const flexDirection = isMobileView ? 'flex-col' : (isImageRight ? 'md:flex-row' : 'md:flex-row-reverse');

  // Image Width Logic
  const getImageWidthClass = () => {
    // In mobile editor view, always full width
    if (isMobileView) {
      return 'w-full';
    }
    switch (settings.image_width) {
        case 'small': return 'md:w-3/12';
        case 'large': return 'md:w-7/12';
        case 'medium':
        default: return 'md:w-1/2';
    }
  };

  // Button Styles
  const getButtonStyles = () => {
    const buttonStyleObj = style.button || {};
    const buttonStyle = buttonStyleObj.style || 'solid';
    const borderRadius = buttonStyleObj.border_radius || '8px';

    const baseClasses = 'inline-flex items-center justify-center px-8 py-3 text-base font-medium transition-all';

    let styleClasses = '';
    let inlineStyles: React.CSSProperties = {
      borderRadius: buttonStyle === 'underline' ? '0' : borderRadius,
    };

    switch (buttonStyle) {
      case 'outline':
        styleClasses = 'border-2';
        inlineStyles = {
          ...inlineStyles,
          borderColor: buttonStyleObj.background_color || '#2563EB',
          color: buttonStyleObj.text_color || '#2563EB',
          backgroundColor: 'transparent',
        };
        break;
      case 'white':
        styleClasses = 'border border-white shadow-sm';
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
          borderColor: buttonStyleObj.background_color || '#2563EB',
          color: buttonStyleObj.text_color || '#2563EB',
          backgroundColor: 'transparent',
        };
        break;
      case 'solid':
      default:
        inlineStyles = {
          ...inlineStyles,
          backgroundColor: buttonStyleObj.background_color || '#2563EB',
          color: buttonStyleObj.text_color || '#FFFFFF',
        };
        break;
    }

    return { className: `${baseClasses} ${styleClasses}`, style: inlineStyles };
  };

  const fontFamily = style.typography?.font_family || '"Noto Sans Hebrew", sans-serif';
  const textColor = style.typography?.color || '#111827';
  
  // Heading font size
  const getHeadingSizeClass = () => {
    const size = settings.heading_font_size || 'large';
    const sizeMap: Record<string, string> = {
      small: 'text-2xl md:text-3xl',
      medium: 'text-3xl md:text-4xl',
      large: 'text-3xl md:text-4xl',
      xlarge: 'text-4xl md:text-5xl',
    };
    return sizeMap[size] || 'text-3xl md:text-4xl';
  };
  
  // Text font size
  const getTextSizeClass = () => {
    const size = settings.text_font_size || 'medium';
    const sizeMap: Record<string, string> = {
      small: 'prose-sm',
      medium: 'prose prose-lg',
      large: 'prose prose-xl',
      xlarge: 'prose prose-2xl',
    };
    return sizeMap[size] || 'prose prose-lg';
  };

  return (
    <div className="w-full" style={{ fontFamily }}>
      <div className="container mx-auto px-4">
        <div className={`flex ${isMobileView ? 'flex-col' : `flex-col ${flexDirection}`} gap-8 md:gap-12 items-center`}>
            {/* Media Side */}
            <div className={`w-full ${getImageWidthClass()}`}>
                <div 
                    className="relative bg-gray-100 rounded-lg overflow-hidden shadow-sm"
                    style={{
                        aspectRatio: imageBlock?.content?.media_height ? 'auto' : '4/3',
                        height: imageBlock?.content?.media_height || 'auto'
                    }}
                >
                    {imageBlock?.content?.video_url ? (
                        <video 
                            src={imageBlock.content.video_url} 
                            className="w-full h-full object-cover"
                            controls={imageBlock.content.video_controls !== false}
                            autoPlay={imageBlock.content.video_autoplay !== false}
                            muted={imageBlock.content.video_muted !== false}
                            loop={imageBlock.content.video_loop === true}
                            playsInline={imageBlock.content.video_playsinline !== false}
                        />
                    ) : imageBlock?.content?.image_url ? (
                        <img 
                            src={imageBlock.content.image_url} 
                            alt={imageBlock.content.alt_text || 'תמונה'} 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex items-center justify-center w-full h-full text-gray-400">
                            <span>בחר מדיה</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Text Side */}
            <div className="w-full flex-1">
                <div className={`flex flex-col ${textBlock?.style?.text_align === 'center' ? 'items-center text-center' : textBlock?.style?.text_align === 'left' ? 'items-end text-left' : 'items-start text-right'}`}>
                    {textBlock?.content?.heading && (
                        <h2 className={`${getHeadingSizeClass()} font-bold mb-6`} style={{ color: textColor }}>
                            {textBlock.content.heading}
                        </h2>
                    )}
                    
                    {textBlock?.content?.text && (
                        <div 
                            className={`${getTextSizeClass()} text-gray-600 mb-8 max-w-none`}
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

export const ImageWithText = React.memo(ImageWithTextComponent, sectionPropsAreEqual);
