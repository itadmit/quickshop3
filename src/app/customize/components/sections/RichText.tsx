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

  const fontFamily = style.typography?.font_family || 'system-ui';
  const textColor = style.typography?.color || '#111827';

  return (
    <div className="w-full" style={{ fontFamily }}>
      <div className="container mx-auto px-4">
        <div className={`${getWidthClass()} mx-auto ${getTextAlignClass()}`}>
            {/* If no blocks, show generic placeholder */}
            {blocks.length === 0 && (
                <>
                    <h2 className="text-3xl font-bold mb-6" style={{ color: textColor }}>טקסט עשיר</h2>
                    <p className="mb-6" style={{ color: textColor ? `${textColor}CC` : '#4B5563' }}>
                        כאן ניתן להוסיף טקסט עשיר עם עיצוב, קישורים, רשימות וכו'. הוסף בלוק טקסט כדי להתחיל.
                    </p>
                </>
            )}

            {/* Render Blocks */}
            {blocks.map(block => (
                <div key={block.id} className="mb-6 last:mb-0">
                    {block.content?.heading && (
                        <h2 className="text-3xl font-bold mb-4" style={{ color: textColor }}>
                            {block.content.heading}
                        </h2>
                    )}
                    {block.content?.text && (
                        <div 
                            className="prose prose-lg max-w-none"
                            dangerouslySetInnerHTML={{ __html: block.content.text }}
                            style={{ color: textColor ? `${textColor}CC` : undefined }}
                        />
                    )}
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
