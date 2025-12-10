/**
 * Customizer Module - Add Section Dialog
 * דיאלוג הוספת סקשן חדש
 */

'use client';

import { useState, useMemo } from 'react';
import React from 'react';
import { addSection } from '../actions';
import { SectionType, PageType } from '@/lib/customizer/types';
import { getPageSpecificSections } from '@/lib/customizer/templates/new-york';
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
  HiCurrencyDollar,
  HiShoppingCart,
  HiViewList,
  HiFilter,
  HiDocument,
  HiColorSwatch,
  HiAnnotation,
  HiEye,
} from 'react-icons/hi';

interface AddSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageType: string;
  onSectionAdded: () => void;
}

// Icon mapping for section types
const SECTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  // Product page sections
  product_gallery: HiPhotograph,
  product_title: HiDocument,
  product_price: HiCurrencyDollar,
  product_variants: HiColorSwatch,
  product_add_to_cart: HiShoppingCart,
  product_description: HiPencil,
  product_custom_fields: HiViewList,
  product_reviews: HiAnnotation,
  related_products: HiShoppingBag,
  recently_viewed: HiEye,
  // Collection page sections
  collection_header: HiClipboardList,
  collection_description: HiPencil,
  collection_filters: HiFilter,
  collection_products: HiChartBar,
  collection_pagination: HiViewList,
};

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
  { type: 'featured_collections', name: 'קטגוריות מוצגות', description: 'הצגת קטגוריות נבחרות', icon: HiCollection, category: 'Collections & Products' },
  { type: 'featured_products', name: 'מוצרים מוצגים', description: 'הצגת מוצרים נבחרים', icon: HiShoppingBag, category: 'Collections & Products' },
  
  // Content
  { type: 'image_with_text', name: 'מדיה עם טקסט', description: 'מדיה עם טקסט (תמונה או וידאו)', icon: HiPhotograph, category: 'Content' },
  { type: 'rich_text', name: 'טקסט עשיר', description: 'טקסט עשיר', icon: HiPencil, category: 'Content' },
  { type: 'video', name: 'וידאו', description: 'וידאו', icon: HiVideoCamera, category: 'Content' },
  { type: 'testimonials', name: 'ביקורות', description: 'ביקורות לקוחות', icon: HiChatAlt, category: 'Content' },
  { type: 'faq', name: 'שאלות נפוצות', description: 'שאלות נפוצות', icon: HiQuestionMarkCircle, category: 'Content' },
  { type: 'logo_list', name: 'רשימת לוגואים', description: 'הצגת לוגואי מותגים', icon: HiPhotograph, category: 'Content' },
  { type: 'gallery', name: 'גלריה', description: 'גלריית תמונות', icon: HiPhotograph, category: 'Content' },
  
  // Marketing
  { type: 'newsletter', name: 'הרשמה לניוזלטר', description: 'הרשמה לניוזלטר', icon: HiMail, category: 'Marketing' },
  
  // Navigation & Footer
  { type: 'footer', name: 'כותרת תחתונה', description: 'כותרת תחתונה', icon: HiArrowDown, category: 'Navigation & Footer' },
  
  // Advanced
  { type: 'contact_form', name: 'טופס יצירת קשר', description: 'טופס ליצירת קשר', icon: HiMail, category: 'Advanced' },
];

// Get page-specific category name
function getPageSpecificCategoryName(pageType: string): string {
  switch (pageType) {
    case 'product':
      return 'עמוד מוצר';
    case 'collection':
      return 'עמוד קטגוריה';
    default:
      return 'עמוד';
  }
}

export function AddSectionDialog({
  open,
  onOpenChange,
  pageType,
  onSectionAdded,
}: AddSectionDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('page-specific');
  const [adding, setAdding] = useState(false);

  // Get page-specific sections from the template
  const pageSpecificSections = useMemo(() => {
    const sections = getPageSpecificSections(pageType);
    return sections.map(s => ({
      type: s.type as SectionType,
      name: s.name,
      description: s.description,
      icon: SECTION_ICONS[s.type] || HiDocument,
      category: 'page-specific'
    }));
  }, [pageType]);

  // Combine page-specific sections with general sections
  const allSections = useMemo(() => {
    if (pageType === 'home') {
      return AVAILABLE_SECTIONS;
    }
    return [...pageSpecificSections, ...AVAILABLE_SECTIONS];
  }, [pageType, pageSpecificSections]);

  if (!open) return null;

  // Build categories list - page-specific first for product/collection pages
  const pageSpecificCategoryName = getPageSpecificCategoryName(pageType);
  const baseCategories = Array.from(new Set(AVAILABLE_SECTIONS.map(s => s.category)));
  const categories = pageType === 'home' 
    ? ['all', ...baseCategories]
    : ['page-specific', 'all', ...baseCategories];
  
  const filteredSections = allSections.filter((section) => {
    const matchesSearch = 
      section.name.includes(searchTerm) ||
      section.description.includes(searchTerm) ||
      section.type.includes(searchTerm);
    
    const matchesCategory = 
      selectedCategory === 'all' || 
      section.category === selectedCategory ||
      (selectedCategory === 'page-specific' && section.category === 'page-specific');
    
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
                {category === 'all' ? 'הכל' : category === 'page-specific' ? `📌 ${pageSpecificCategoryName}` : category}
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

