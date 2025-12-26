'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { HiPlus, HiMinus } from 'react-icons/hi';

interface FAQProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
}

export function FAQ({ section, onUpdate }: FAQProps) {
  const settings = section.settings || {};
  const style = section.style || {};
  const blocks = section.blocks?.filter(b => b.type === 'text') || [];
  
  // Typography settings - use specific typography for heading
  const headingTypography = style.typography?.heading || {};
  
  // Text color from style settings
  const textColor = headingTypography.color || style.typography?.color;
  
  const [openItems, setOpenItems] = React.useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const maxWidthClass = settings.width === 'narrow' ? 'max-w-3xl' : 'max-w-5xl';
  
  const fontFamily = headingTypography.font_family || style.typography?.font_family || '"Noto Sans Hebrew", sans-serif';
  
  // Title font size
  const getTitleSizeClass = () => {
    const size = settings.title_font_size || 'large';
    const sizeMap: Record<string, string> = {
      small: 'text-2xl',
      medium: 'text-3xl',
      large: 'text-3xl',
      xlarge: 'text-4xl',
    };
    return sizeMap[size] || 'text-3xl';
  };
  
  // Subtitle font size
  const getSubtitleSizeClass = () => {
    const size = settings.subtitle_font_size || 'medium';
    const sizeMap: Record<string, string> = {
      small: 'text-base',
      medium: 'text-lg',
      large: 'text-xl',
      xlarge: 'text-2xl',
    };
    return sizeMap[size] || 'text-lg';
  };
  
  // Question font size
  const getQuestionSizeClass = () => {
    const size = settings.question_font_size || 'medium';
    const sizeMap: Record<string, string> = {
      small: 'text-base',
      medium: 'text-lg',
      large: 'text-xl',
      xlarge: 'text-2xl',
    };
    return sizeMap[size] || 'text-lg';
  };

  return (
    <div className="py-16 px-4" style={{ fontFamily }}>
      <div className={`${maxWidthClass} mx-auto`}>
        {/* Header */}
        <div className="text-center mb-12">
          {settings.title && (
            <h2 
              className={`${getTitleSizeClass()} mb-4`} 
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
              {settings.title}
            </h2>
          )}
          {settings.subtitle && (
            <p 
              className={`${getSubtitleSizeClass()} opacity-80`} 
              style={{ 
                color: headingTypography.color || textColor,
                fontFamily: headingTypography.font_family || fontFamily,
                fontSize: headingTypography.font_size || undefined,
                fontWeight: headingTypography.font_weight || undefined,
                lineHeight: headingTypography.line_height || undefined,
                letterSpacing: headingTypography.letter_spacing || undefined,
              }}
            >
              {settings.subtitle}
            </p>
          )}
        </div>

        {/* Accordion */}
        <div className="space-y-4">
          {blocks.length > 0 ? (
            blocks.map((block) => {
              const isOpen = openItems.includes(block.id);
              return (
                <div 
                  key={block.id} 
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden transition-all hover:border-gray-300"
                >
                  <button
                    onClick={() => toggleItem(block.id)}
                    className="w-full flex items-center justify-between p-6 text-right bg-white hover:bg-gray-50 transition-colors"
                  >
                    <span 
                      className={`font-medium ${getQuestionSizeClass()}`} 
                      style={{ 
                        color: block.style?.typography?.color || headingTypography.color || textColor || '#111827',
                        fontFamily: block.style?.typography?.font_family || headingTypography.font_family || fontFamily,
                        fontSize: block.style?.typography?.font_size || headingTypography.font_size || undefined,
                        fontWeight: block.style?.typography?.font_weight || headingTypography.font_weight || '500',
                        lineHeight: block.style?.typography?.line_height || headingTypography.line_height || undefined,
                        letterSpacing: block.style?.typography?.letter_spacing || headingTypography.letter_spacing || undefined,
                        textTransform: block.style?.typography?.text_transform || headingTypography.text_transform || undefined,
                      }}
                    >
                      {block.content?.heading || 'שאלה לדוגמה?'}
                    </span>
                    <span className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                      {isOpen ? <HiMinus className="w-5 h-5" /> : <HiPlus className="w-5 h-5" />}
                    </span>
                  </button>
                  <div 
                    className={`bg-gray-50/50 overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div 
                        className="p-6 pt-0 leading-relaxed border-t border-gray-100 mt-4 pt-4"
                        style={{ color: textColor ? `${textColor}CC` : '#4B5563' }} // 80% opacity for body text
                    >
                      {block.content?.text || 'תשובה לדוגמה...'}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
              הוסף שאלות ותשובות דרך סרגל העריכה
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
