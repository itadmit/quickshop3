'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';

interface ContentProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
  editorDevice?: 'mobile' | 'tablet' | 'desktop';
}

export function Content({ section, onUpdate, editorDevice }: ContentProps) {
  const settings = section.settings || {};
  const style = section.style || {};
  
  // Typography settings - use specific typography for content
  const contentTypography = style.typography?.content || {};
  
  const fontFamily = contentTypography.font_family || style.typography?.font_family || '"Noto Sans Hebrew", sans-serif';
  const textColor = contentTypography.color || style.typography?.color || '#111827';
  
  // Text size
  const getTextSizeClass = () => {
    const size = settings.text_size || 'medium';
    const sizeMap: Record<string, string> = {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg',
      xlarge: 'text-xl',
    };
    return sizeMap[size] || 'text-base';
  };
  
  // Alignment
  const getAlignClass = () => {
    const align = settings.text_align || 'right';
    return align === 'left' ? 'text-left' : align === 'center' ? 'text-center' : 'text-right';
  };

  return (
    <div className="w-full" style={{ fontFamily }}>
      <div
        className={`prose max-w-none ${getTextSizeClass()} ${getAlignClass()}`}
        dangerouslySetInnerHTML={{ __html: settings.content || 'הזן תוכן עשיר כאן...' }}
        style={{ 
          color: contentTypography.color || textColor,
          fontFamily: contentTypography.font_family || fontFamily,
          fontSize: contentTypography.font_size || undefined,
          fontWeight: contentTypography.font_weight || undefined,
          lineHeight: contentTypography.line_height || undefined,
          letterSpacing: contentTypography.letter_spacing || undefined,
        }}
      />
    </div>
  );
}

