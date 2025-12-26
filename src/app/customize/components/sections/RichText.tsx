'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';

interface RichTextProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
}

export function RichText({ section, onUpdate }: RichTextProps) {
  const settings = section.settings || {};
  const style = section.style || {};
  const blocks = section.blocks || [];
  
  const textBlock = blocks.find(b => b.type === 'text');

  // Width Logic
  const getWidthClass = () => {
    switch (settings.content_width) {
        case 'narrow': return 'max-w-2xl';
        case 'wide': return 'max-w-6xl';
        case 'regular':
        default: return 'max-w-4xl';
    }
  };

  // Alignment Logic
  const getTextAlignClass = () => {
     switch (settings.content_align) {
         case 'left': return 'text-left';
         case 'right': return 'text-right';
         case 'center':
         default: return 'text-center';
     }
  };

  // Typography settings - use specific typography for heading, content
  const headingTypography = style.typography?.heading || {};
  const contentTypography = style.typography?.content || {};
  
  const fontFamily = headingTypography.font_family || style.typography?.font_family || '"Noto Sans Hebrew", sans-serif';
  const textColor = headingTypography.color || style.typography?.color || '#111827';
  
  // Heading font size
  const getHeadingSizeClass = () => {
    const size = settings.heading_font_size || 'large';
    const sizeMap: Record<string, string> = {
      small: 'text-2xl',
      medium: 'text-3xl',
      large: 'text-3xl',
      xlarge: 'text-4xl',
    };
    return sizeMap[size] || 'text-3xl';
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
        <div className={`${getWidthClass()} mx-auto ${getTextAlignClass()}`}>
            {/* If no blocks, show generic placeholder */}
            {blocks.length === 0 && (
                <>
                    <h2 
                        className={`${getHeadingSizeClass()} mb-6`} 
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
                        טקסט עשיר
                    </h2>
                    <p 
                        className={`${getTextSizeClass()} mb-6 max-w-none`} 
                        style={{ 
                            color: contentTypography.color || (textColor ? `${textColor}CC` : '#4B5563'),
                            fontFamily: contentTypography.font_family || fontFamily,
                            fontSize: contentTypography.font_size || undefined,
                            fontWeight: contentTypography.font_weight || undefined,
                            lineHeight: contentTypography.line_height || undefined,
                            letterSpacing: contentTypography.letter_spacing || undefined,
                        }}
                    >
                        כאן ניתן להוסיף טקסט עשיר עם עיצוב, קישורים, רשימות וכו'. הוסף בלוק טקסט כדי להתחיל.
                    </p>
                </>
            )}

            {/* Render Blocks */}
            {blocks.map(block => {
                // Get block-specific typography or fallback to section typography
                const blockHeadingTypography = block.style?.typography || headingTypography;
                const blockContentTypography = block.style?.typography || contentTypography;
                
                return (
                    <div key={block.id} className="mb-6 last:mb-0">
                        {block.content?.heading && (
                            <h2 
                                className={`${getHeadingSizeClass()} mb-4`} 
                                style={{ 
                                    color: blockHeadingTypography.color || headingTypography.color || textColor,
                                    fontFamily: blockHeadingTypography.font_family || headingTypography.font_family || fontFamily,
                                    fontSize: blockHeadingTypography.font_size || headingTypography.font_size || undefined,
                                    fontWeight: blockHeadingTypography.font_weight || headingTypography.font_weight || 'bold',
                                    lineHeight: blockHeadingTypography.line_height || headingTypography.line_height || undefined,
                                    letterSpacing: blockHeadingTypography.letter_spacing || headingTypography.letter_spacing || undefined,
                                    textTransform: blockHeadingTypography.text_transform || headingTypography.text_transform || undefined,
                                }}
                            >
                                {block.content.heading}
                            </h2>
                        )}
                        {block.content?.text && (
                            <div 
                                className={`${getTextSizeClass()} max-w-none`}
                                dangerouslySetInnerHTML={{ __html: block.content.text }}
                                style={{ 
                                    color: blockContentTypography.color || contentTypography.color || (textColor ? `${textColor}CC` : undefined),
                                    fontFamily: blockContentTypography.font_family || contentTypography.font_family || fontFamily,
                                    fontSize: blockContentTypography.font_size || contentTypography.font_size || undefined,
                                    fontWeight: blockContentTypography.font_weight || contentTypography.font_weight || undefined,
                                    lineHeight: blockContentTypography.line_height || contentTypography.line_height || undefined,
                                    letterSpacing: blockContentTypography.letter_spacing || contentTypography.letter_spacing || undefined,
                                }}
                            />
                        )}
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
}
