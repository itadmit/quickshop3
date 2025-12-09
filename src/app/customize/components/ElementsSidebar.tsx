'use client';

import React, { useState } from 'react';
import { SectionSettings, SectionType } from '@/lib/customizer/types';
import {
  HiPhotograph,
  HiCube,
  HiFolder,
  HiDocumentText,
  HiMail,
  HiEye,
  HiEyeOff,
  HiTrash,
  HiPlus,
  HiDotsVertical,
  HiMenu,
  HiViewList,
  HiVideoCamera,
  HiChatAlt2,
  HiQuestionMarkCircle,
  HiUserGroup,
  HiClipboardList,
  HiPlay,
  HiCollection
} from 'react-icons/hi';

interface ElementsSidebarProps {
  sections: SectionSettings[];
  selectedSectionId: string | null;
  onSectionSelect: (sectionId: string | null) => void;
  onSectionAdd: (sectionType: string, position?: number) => void;
  onSectionDelete: (sectionId: string) => void;
  onSectionMove: (sectionId: string, newPosition: number) => void;
  onSectionUpdate?: (sectionId: string, updates: Partial<SectionSettings>) => void;
}

type CategoryType = 'media' | 'store' | 'content' | 'marketing';

const CATEGORIES: { id: CategoryType; name: string; icon: React.ComponentType<any> }[] = [
  { id: 'media', name: 'מדיה ותמונה', icon: HiPhotograph },
  { id: 'store', name: 'חנות ומוצרים', icon: HiCube },
  { id: 'content', name: 'תוכן ומידע', icon: HiDocumentText },
  { id: 'marketing', name: 'שיווק וקשר', icon: HiMail },
];

const AVAILABLE_SECTIONS: Array<{
  type: SectionType;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: CategoryType;
}> = [
  // Media
  {
    type: 'hero_banner',
    name: 'באנר ראשי',
    description: 'סקשן גדול עם כותרת ותמונה',
    icon: HiPhotograph,
    category: 'media'
  },
  {
    type: 'slideshow',
    name: 'מצגת תמונות',
    description: 'קרוסלת תמונות מתחלפת',
    icon: HiCollection,
    category: 'media'
  },
  {
    type: 'video',
    name: 'וידאו',
    description: 'נגן וידאו מובנה',
    icon: HiVideoCamera,
    category: 'media'
  },
  {
    type: 'gallery',
    name: 'גלריה',
    description: 'רשת תמונות מעוצבת',
    icon: HiPhotograph,
    category: 'media'
  },
  
  // Store
  {
    type: 'featured_products',
    name: 'מוצרים מוצגים',
    description: 'רשימת מוצרים מומלצים',
    icon: HiCube,
    category: 'store'
  },
  {
    type: 'featured_collections',
    name: 'קטגוריות מוצגות',
    description: 'רשימת קטגוריות מוצגות',
    icon: HiFolder,
    category: 'store'
  },

  // Content
  {
    type: 'image_with_text',
    name: 'תמונה עם טקסט',
    description: 'תמונה לצד טקסט',
    icon: HiPhotograph,
    category: 'content'
  },
  {
    type: 'rich_text',
    name: 'טקסט עשיר',
    description: 'אזור טקסט עם עיצוב',
    icon: HiDocumentText,
    category: 'content'
  },
  {
    type: 'faq',
    name: 'שאלות ותשובות',
    description: 'רשימת שאלות נפוצות',
    icon: HiQuestionMarkCircle,
    category: 'content'
  },
  {
    type: 'logo_list',
    name: 'רשימת לוגואים',
    description: 'הצגת לוגואי מותגים',
    icon: HiPhotograph,
    category: 'content'
  },
  {
    type: 'testimonials',
    name: 'המלצות',
    description: 'חוות דעת של לקוחות',
    icon: HiUserGroup,
    category: 'content'
  },

  // Marketing
  {
    type: 'newsletter',
    name: 'הרשמה לניוזלטר',
    description: 'טופס הרשמה לניוזלטר',
    icon: HiMail,
    category: 'marketing'
  },
  {
    type: 'contact_form',
    name: 'צור קשר',
    description: 'טופס יצירת קשר',
    icon: HiClipboardList,
    category: 'marketing'
  }
];

export function ElementsSidebar({
  sections,
  selectedSectionId,
  onSectionSelect,
  onSectionAdd,
  onSectionDelete,
  onSectionMove,
  onSectionUpdate
}: ElementsSidebarProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryType>('media');

  const handleSectionClick = (sectionId: string) => {
    onSectionSelect(selectedSectionId === sectionId ? null : sectionId);
  };

  const handleAddSection = (sectionType: SectionType) => {
    onSectionAdd(sectionType);
    setShowAddMenu(false);
  };

  const getSectionIcon = (type: SectionType) => {
    // Special handling for fixed sections
    if (type === 'header') return HiMenu;
    if (type === 'footer') return HiViewList;
    
    const section = AVAILABLE_SECTIONS.find(s => s.type === type);
    return section?.icon || HiCube;
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-900">שכבות</h3>
        <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
          אפס הכל
        </button>
      </div>

      {/* Sections List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="divide-y divide-gray-50">
          {sections.map((section, index) => {
            const isLocked = section.locked || section.type === 'header' || section.type === 'footer';
            
            return (
              <div
                key={section.id}
                className={`group flex items-center justify-between p-3 cursor-pointer transition-all ${
                  selectedSectionId === section.id
                    ? 'bg-blue-50 border-r-2 border-blue-600'
                    : 'hover:bg-gray-50 border-r-2 border-transparent'
                } ${isLocked ? 'bg-gray-50/50' : ''}`}
                onClick={() => handleSectionClick(section.id)}
              >
                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                   {/* Drag Handle - hidden for locked sections */}
                   {!isLocked && (
                     <div className="text-gray-300 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
                       <HiDotsVertical className="w-4 h-4" />
                     </div>
                   )}
                   
                  <div className={`p-1.5 rounded-md ${
                    selectedSectionId === section.id ? 'bg-blue-100 text-blue-600' : isLocked ? 'bg-gray-200 text-gray-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {React.createElement(getSectionIcon(section.type), { className: "w-4 h-4" })}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium truncate ${
                        selectedSectionId === section.id ? 'text-blue-900' : 'text-gray-700'
                      }`}>
                        {section.name}
                      </p>
                      {isLocked && (
                        <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded-full" title="סקשן קבוע">
                          קבוע
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate hidden group-hover:block">
                      {AVAILABLE_SECTIONS.find(s => s.type === section.type)?.description || section.type}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Visibility Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSectionUpdate) {
                        onSectionUpdate(section.id, { visible: !section.visible });
                      }
                    }}
                    className={`p-1.5 rounded-md hover:bg-gray-200 ${
                      section.visible ? 'text-gray-600' : 'text-gray-400'
                    }`}
                    title={section.visible ? "הסתר" : "הצג"}
                  >
                    {section.visible ? <HiEye className="w-4 h-4" /> : <HiEyeOff className="w-4 h-4" />}
                  </button>

                  {/* Delete Button */}
                  {!isLocked && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSectionDelete(section.id);
                      }}
                      className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      title="מחק"
                    >
                      <HiTrash className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Section Button */}
      <div className="p-4 border-t border-gray-100">
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all shadow-sm text-sm font-medium ${
                showAddMenu 
                    ? 'bg-black text-white shadow-gray-200'
                    : 'bg-gray-900 text-white hover:bg-black'
            }`}
          >
            <HiPlus className={`w-4 h-4 transition-transform ${showAddMenu ? 'rotate-45' : ''}`} />
            {showAddMenu ? 'סגור תפריט' : 'הוסף סקשן'}
          </button>

          {/* Add Menu Overlay */}
          {showAddMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-3 bg-white border border-gray-200 rounded-xl shadow-2xl z-20 flex flex-col overflow-hidden h-[400px] w-[320px] -right-4">
              
              {/* Categories Tabs */}
              <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-hide bg-gray-50/50 flex-shrink-0">
                {CATEGORIES.map(category => (
                    <button
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={`flex flex-col items-center justify-center py-3 px-4 min-w-[70px] text-xs font-medium border-b-2 transition-colors ${
                            activeCategory === category.id
                                ? 'border-black text-black bg-white'
                                : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/50'
                        }`}
                    >
                        {React.createElement(category.icon, { className: "w-5 h-5 mb-1" })}
                        {category.name.split(' ')[0]}
                    </button>
                ))}
              </div>

              {/* Sections List */}
              <div className="flex-1 overflow-y-auto p-2 bg-white custom-scrollbar">
                <div className="space-y-1">
                  {AVAILABLE_SECTIONS
                    .filter(section => section.category === activeCategory)
                    .map((section) => (
                  <button
                    key={section.type}
                    onClick={() => handleAddSection(section.type)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-right group border border-transparent hover:border-gray-100"
                  >
                      <div className="p-2.5 rounded-lg bg-gray-100 text-gray-500 group-hover:bg-black group-hover:text-white transition-colors shadow-sm">
                        {React.createElement(section.icon, { className: "w-6 h-6" })}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-black">
                        {section.name}
                      </p>
                        <p className="text-xs text-gray-500">
                        {section.description}
                      </p>
                    </div>
                  </button>
                ))}
                  
                  {AVAILABLE_SECTIONS.filter(section => section.category === activeCategory).length === 0 && (
                      <div className="py-8 text-center text-gray-400 text-sm">
                          אין סקשנים בקטגוריה זו
                      </div>
                  )}
                </div>
              </div>
              
              {/* Footer hint */}
              <div className="p-2 bg-gray-50 border-t border-gray-100 text-center flex-shrink-0">
                  <p className="text-[10px] text-gray-400">בחר קטגוריה למעלה והוסף סקשן לעמוד</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
