'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { HiStar } from 'react-icons/hi';
import { sectionPropsAreEqual } from './sectionMemoUtils';

interface TestimonialsProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
}

function TestimonialsComponent({ section, onUpdate }: TestimonialsProps) {
  const settings = section.settings || {};
  const style = section.style || {};
  const blocks = section.blocks?.filter(b => b.type === 'text') || [];

  const textColor = style.typography?.color;
  // Note: We don't force background color here as it's handled by the wrapper

  const gridCols = settings.columns === 4 ? 'md:grid-cols-4' : 
                   settings.columns === 3 ? 'md:grid-cols-3' : 
                   settings.columns === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3';

  return (
    <div className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        {(settings.title || settings.subtitle) && (
          <div className={`mb-12 ${settings.text_align === 'center' ? 'text-center' : settings.text_align === 'left' ? 'text-left' : 'text-right'}`}>
            {settings.title && (
              <h2 className="text-3xl font-bold mb-4" style={{ color: textColor }}>
                {settings.title}
              </h2>
            )}
            {settings.subtitle && (
              <p className="text-lg opacity-80 max-w-2xl mx-auto" style={{ color: textColor }}>
                {settings.subtitle}
              </p>
            )}
          </div>
        )}

        {/* Grid */}
        <div className={`grid grid-cols-1 ${gridCols} gap-8`}>
          {blocks.length > 0 ? (
            blocks.map((block) => (
              <div 
                key={block.id} 
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center"
              >
                {/* Rating */}
                <div className="flex text-yellow-400 mb-4 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <HiStar key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>

                {/* Text */}
                <blockquote className="text-gray-600 mb-6 flex-grow">
                  "{block.content?.text || 'המלצה לדוגמה...'}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-3">
                  {block.content?.image_url ? (
                    <img 
                      src={block.content.image_url} 
                      alt={block.content?.heading || ''} 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-lg">
                      {block.content?.heading?.charAt(0) || '?'}
                    </div>
                  )}
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{block.content?.heading || 'שם לקוח'}</div>
                    <div className="text-sm text-gray-500">{block.content?.subheading || 'לקוח מאומת'}</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-lg border-2 border-dashed border-gray-200">
              הוסף המלצות דרך סרגל העריכה
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const Testimonials = React.memo(TestimonialsComponent, sectionPropsAreEqual);
