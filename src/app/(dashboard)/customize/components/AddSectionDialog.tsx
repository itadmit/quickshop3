/**
 * Customizer Module - Add Section Dialog
 * דיאלוג הוספת סקשן חדש
 */

'use client';

import { useState } from 'react';
import { addSection } from '../actions';
import { SectionType } from '@/lib/customizer/types';

interface AddSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageType: string;
  onSectionAdded: () => void;
}

const AVAILABLE_SECTIONS: Array<{
  type: SectionType;
  name: string;
  description: string;
  icon: string;
  category: string;
}> = [
  // Hero & Header
  { type: 'announcement_bar', name: 'בר הודעות', description: 'בר הודעות עליון', icon: '📢', category: 'Hero & Header' },
  { type: 'header', name: 'Header', description: 'Header עם תפריט', icon: '📋', category: 'Hero & Header' },
  { type: 'slideshow', name: 'סליידשו', description: 'סליידשו Hero', icon: '🎠', category: 'Hero & Header' },
  { type: 'hero_banner', name: 'באנר Hero', description: 'באנר Hero בודד', icon: '🖼️', category: 'Hero & Header' },
  
  // Collections & Products
  { type: 'collection_list', name: 'רשימת קטגוריות', description: 'רשימת קטגוריות', icon: '📦', category: 'Collections & Products' },
  { type: 'featured_collection', name: 'קטגוריה מוצגת', description: 'קטגוריה מוצגת', icon: '⭐', category: 'Collections & Products' },
  { type: 'featured_product', name: 'מוצר מוצג', description: 'מוצר מוצג', icon: '🛍️', category: 'Collections & Products' },
  { type: 'product_grid', name: 'גריד מוצרים', description: 'גריד מוצרים', icon: '📊', category: 'Collections & Products' },
  { type: 'new_arrivals', name: 'מוצרים חדשים', description: 'מוצרים חדשים', icon: '🆕', category: 'Collections & Products' },
  { type: 'best_sellers', name: 'מוצרים נמכרים', description: 'מוצרים נמכרים', icon: '🔥', category: 'Collections & Products' },
  
  // Content
  { type: 'image_with_text', name: 'תמונה עם טקסט', description: 'תמונה עם טקסט', icon: '🖼️', category: 'Content' },
  { type: 'image_with_text_overlay', name: 'תמונה עם שכבת טקסט', description: 'תמונה עם שכבת טקסט', icon: '🎨', category: 'Content' },
  { type: 'rich_text', name: 'טקסט עשיר', description: 'טקסט עשיר', icon: '📝', category: 'Content' },
  { type: 'video', name: 'וידאו', description: 'וידאו', icon: '🎥', category: 'Content' },
  { type: 'testimonials', name: 'ביקורות', description: 'ביקורות לקוחות', icon: '💬', category: 'Content' },
  { type: 'faq', name: 'שאלות נפוצות', description: 'שאלות נפוצות', icon: '❓', category: 'Content' },
  
  // Marketing
  { type: 'newsletter', name: 'הרשמה לניוזלטר', description: 'הרשמה לניוזלטר', icon: '📧', category: 'Marketing' },
  { type: 'promo_banner', name: 'באנר פרסומי', description: 'באנר פרסומי', icon: '🎯', category: 'Marketing' },
  { type: 'trust_badges', name: 'תגי אמון', description: 'תגי אמון', icon: '🛡️', category: 'Marketing' },
  
  // Navigation & Footer
  { type: 'footer', name: 'Footer', description: 'Footer', icon: '⬇️', category: 'Navigation & Footer' },
  { type: 'mobile_sticky_bar', name: 'בר תחתון למובייל', description: 'בר תחתון למובייל', icon: '📱', category: 'Navigation & Footer' },
  
  // Advanced
  { type: 'custom_html', name: 'HTML מותאם', description: 'HTML מותאם', icon: '💻', category: 'Advanced' },
];

export function AddSectionDialog({
  open,
  onOpenChange,
  pageType,
  onSectionAdded,
}: AddSectionDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [adding, setAdding] = useState(false);

  if (!open) return null;

  const categories = ['all', ...Array.from(new Set(AVAILABLE_SECTIONS.map(s => s.category)))];
  
  const filteredSections = AVAILABLE_SECTIONS.filter((section) => {
    const matchesSearch = 
      section.name.includes(searchTerm) ||
      section.description.includes(searchTerm) ||
      section.type.includes(searchTerm);
    
    const matchesCategory = selectedCategory === 'all' || section.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  async function handleAddSection(sectionType: SectionType) {
    try {
      setAdding(true);
      await addSection({
        page_type: pageType as any,
        section_type: sectionType,
        position: 999, // יוכנס בסוף
        settings_json: {},
      });
      onSectionAdded();
      onOpenChange(false);
      setSearchTerm('');
    } catch (error) {
      console.error('Error adding section:', error);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">הוסף סקשן</h2>
            <p className="text-sm text-gray-500">בחר סקשן להוספה לעמוד</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            ✕
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          {/* Search */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 חיפוש סקשנים..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm"
          />

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-md text-sm whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category === 'all' ? 'הכל' : category}
              </button>
            ))}
          </div>
        </div>

        {/* Sections List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredSections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              לא נמצאו סקשנים
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredSections.map((section) => (
                <button
                  key={section.type}
                  onClick={() => handleAddSection(section.type)}
                  disabled={adding}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-right disabled:opacity-50"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{section.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{section.name}</div>
                      <div className="text-sm text-gray-500 mt-1">{section.description}</div>
                      <div className="text-xs text-gray-400 mt-1">{section.category}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => onOpenChange(false)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}

