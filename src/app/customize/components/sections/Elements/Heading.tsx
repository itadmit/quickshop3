'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';

interface HeadingProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
  editorDevice?: 'mobile' | 'tablet' | 'desktop';
}

export function Heading({ section, onUpdate, editorDevice }: HeadingProps) {
  const style = section.style || {};
  const blocks = section.blocks?.filter(b => b.type === 'heading') || [];
  
  const fontFamily = style.typography?.font_family || '"Noto Sans Hebrew", sans-serif';
  const textColor = style.typography?.color || '#111827';
  
  // Heading size
  const getHeadingSizeClass = (size?: string) => {
    const headingSize = size || 'large';
    const sizeMap: Record<string, string> = {
      small: 'text-xl md:text-2xl',
      medium: 'text-2xl md:text-3xl',
      large: 'text-3xl md:text-4xl',
      xlarge: 'text-4xl md:text-5xl',
    };
    return sizeMap[headingSize] || 'text-3xl md:text-4xl';
  };
  
  // Alignment
  const getAlignClass = (align?: string) => {
    const textAlign = align || 'right';
    return textAlign === 'left' ? 'text-left' : textAlign === 'center' ? 'text-center' : 'text-right';
  };
  
  // Font weight
  const getWeightClass = (weight?: string) => {
    const fontWeight = weight || 'bold';
    return fontWeight === 'normal' ? 'font-normal' : fontWeight === 'medium' ? 'font-medium' : 'font-bold';
  };

  if (blocks.length === 0) {
    return (
      <div className="w-full py-4" style={{ fontFamily }}>
        <div className="container mx-auto px-4">
          <div className="text-gray-400 text-center">הוסף כותרת דרך סרגל העריכה</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-4">
      <div className="container mx-auto px-4 space-y-4">
        {blocks.map((block) => {
          const content = block.content || {};
          const blockStyle = block.style || {};
          const heading = content.heading || '';
          const headingTag = content.heading_tag || 'h2';
          const textAlign = content.text_align || 'right';
          
          // Get typography from block style or section style (block takes priority)
          const blockFontFamily = blockStyle.typography?.font_family || style.typography?.font_family || fontFamily;
          const fontSize = blockStyle.typography?.font_size || style.typography?.font_size || '';
          const fontWeight = blockStyle.typography?.font_weight || style.typography?.font_weight || 'bold';
          const blockTextColor = blockStyle.typography?.color || textColor;

          const HeadingTag = headingTag as keyof JSX.IntrinsicElements;

          return (
            <HeadingTag 
              key={block.id}
              className={`${getAlignClass(textAlign)}`}
              style={{ 
                fontFamily: blockFontFamily,
                color: blockTextColor,
                fontSize: fontSize || undefined,
                fontWeight: fontWeight || 'bold'
              }}
            >
              {heading || 'כותרת'}
            </HeadingTag>
          );
        })}
      </div>
    </div>
  );
}
