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
  
  const fontFamily = style.typography?.font_family || '"Noto Sans Hebrew", sans-serif';
  const textColor = style.typography?.color || '#111827';
  
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
        style={{ color: textColor }}
      />
    </div>
  );
}

