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
  const blocks = section.blocks?.filter(b => b.type === 'text') || [];
  
  // State for open accordion items (using a simple local state approach for preview)
  // In a real implementation, this might be handled differently to persist state, 
  // but for a view component, local state is fine.
  const [openItems, setOpenItems] = React.useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const maxWidthClass = settings.width === 'narrow' ? 'max-w-3xl' : 'max-w-5xl';

  return (
    <div className="py-16 px-4">
      <div className={`${maxWidthClass} mx-auto`}>
        {/* Header */}
        <div className="text-center mb-12">
          {settings.title && (
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {settings.title}
            </h2>
          )}
          {settings.subtitle && (
            <p className="text-lg text-gray-500">
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
                    <span className="font-medium text-lg text-gray-900">
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
                    <div className="p-6 pt-0 text-gray-600 leading-relaxed border-t border-gray-100 mt-4 pt-4">
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

