/**
 * Customizer Module - Add Section Dialog
 * דיאלוג הוספת סקשן חדש
 */

'use client';

import { useState } from 'react';
import React from 'react';
import { addSection } from '../actions';
import { SectionType } from '@/lib/customizer/types';
import {
  HiX,
  HiBell,
  HiClipboardList,
  HiPhotograph,
  HiShoppingBag,
  HiCollection,
  HiStar,
  HiChartBar,
  HiSparkles,
  HiFire,
  HiPencil,
  HiVideoCamera,
  HiChatAlt,
  HiQuestionMarkCircle,
  HiMail,
  HiTag,
  HiShieldCheck,
  HiArrowDown,
  HiDeviceMobile,
  HiCode,
} from 'react-icons/hi';

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
  icon: React.ComponentType<{ className?: string }>;
  category: string;
}> = [
  // Hero & Header
  { type: 'announcement_bar', name: 'בר הודעות', description: 'בר הודעות עליון', icon: HiBell, category: 'Hero & Header' },
  { type: 'header', name: 'כותרת עליונה', description: 'כותרת עליונה עם תפריט', icon: HiClipboardList, category: 'Hero & Header' },
  { type: 'slideshow', name: 'סליידשו', description: 'סליידשו Hero', icon: HiPhotograph, category: 'Hero & Header' },
  { type: 'hero_banner', name: 'באנר Hero', description: 'באנר Hero בודד', icon: HiPhotograph, category: 'Hero & Header' },
  
  // Collections & Products
  { type: 'collection_list', name: 'רשימת קטגוריות', description: 'רשימת קטגוריות', icon: HiCollection, category: 'Collections & Products' },
  { type: 'featured_collection', name: 'קטגוריה מוצגת', description: 'קטגוריה מוצגת', icon: HiStar, category: 'Collections & Products' },
  { type: 'featured_product', name: 'מוצר מוצג', description: 'מוצר מוצג', icon: HiShoppingBag, category: 'Collections & Products' },
  { type: 'product_grid', name: 'גריד מוצרים', description: 'גריד מוצרים', icon: HiChartBar, category: 'Collections & Products' },
  { type: 'new_arrivals', name: 'מוצרים חדשים', description: 'מוצרים חדשים', icon: HiSparkles, category: 'Collections & Products' },
  { type: 'best_sellers', name: 'מוצרים נמכרים', description: 'מוצרים נמכרים', icon: HiFire, category: 'Collections & Products' },
  
  // Content
  { type: 'image_with_text', name: 'מדיה עם טקסט', description: 'מדיה עם טקסט (תמונה או וידאו)', icon: HiPhotograph, category: 'Content' },
  { type: 'image_with_text_overlay', name: 'תמונה עם שכבת טקסט', description: 'תמונה עם שכבת טקסט', icon: HiPhotograph, category: 'Content' },
  { type: 'rich_text', name: 'טקסט עשיר', description: 'טקסט עשיר', icon: HiPencil, category: 'Content' },
  { type: 'video', name: 'וידאו', description: 'וידאו', icon: HiVideoCamera, category: 'Content' },
  { type: 'testimonials', name: 'ביקורות', description: 'ביקורות לקוחות', icon: HiChatAlt, category: 'Content' },
  { type: 'faq', name: 'שאלות נפוצות', description: 'שאלות נפוצות', icon: HiQuestionMarkCircle, category: 'Content' },
  { type: 'logo_list', name: 'רשימת לוגואים', description: 'הצגת לוגואי מותגים', icon: HiPhotograph, category: 'Content' },
  
  // Marketing
  { type: 'newsletter', name: 'הרשמה לניוזלטר', description: 'הרשמה לניוזלטר', icon: HiMail, category: 'Marketing' },
  { type: 'promo_banner', name: 'באנר פרסומי', description: 'באנר פרסומי', icon: HiTag, category: 'Marketing' },
  { type: 'trust_badges', name: 'תגי אמון', description: 'תגי אמון', icon: HiShieldCheck, category: 'Marketing' },
  
  // Navigation & Footer
  { type: 'footer', name: 'כותרת תחתונה', description: 'כותרת תחתונה', icon: HiArrowDown, category: 'Navigation & Footer' },
  { type: 'mobile_sticky_bar', name: 'בר תחתון למובייל', description: 'בר תחתון למובייל', icon: HiDeviceMobile, category: 'Navigation & Footer' },
  
  // Advanced
  { type: 'custom_html', name: 'HTML מותאם', description: 'HTML מותאם', icon: HiCode, category: 'Advanced' },
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
            <HiX className="w-5 h-5" />
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
                    ? 'bg-green-600 text-white'
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
                  className="p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-right disabled:opacity-50"
                >
                  <div className="flex items-start gap-3">
                    {React.createElement(section.icon, { className: "w-8 h-8 text-gray-600 flex-shrink-0" })}
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

