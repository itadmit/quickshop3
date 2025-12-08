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
  HiViewList
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

const AVAILABLE_SECTIONS: Array<{
  type: SectionType;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
}> = [
  {
    type: 'hero_banner',
    name: 'באנר ראשי',
    description: 'סקשן גדול עם כותרת ותמונה',
    icon: HiPhotograph
  },
  {
    type: 'featured_products',
    name: 'מוצרים מוצגים',
    description: 'רשימת מוצרים מומלצים',
    icon: HiCube
  },
  {
    type: 'featured_collections',
    name: 'קטגוריות מוצגות',
    description: 'רשימת קטגוריות מוצגות',
    icon: HiFolder
  },
  {
    type: 'image_with_text',
    name: 'תמונה עם טקסט',
    description: 'תמונה לצד טקסט',
    icon: HiPhotograph
  },
  {
    type: 'rich_text',
    name: 'טקסט עשיר',
    description: 'אזור טקסט עם עיצוב',
    icon: HiDocumentText
  },
  {
    type: 'newsletter',
    name: 'הרשמה לניוזלטר',
    description: 'טופס הרשמה לניוזלטר',
    icon: HiMail
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
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-50">
          {sections.map((section, index) => {
            const isLocked = section.locked || section.type === 'header' || section.type === 'footer';
            const isHeader = section.type === 'header';
            const isFooter = section.type === 'footer';
            
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
                  {/* Visibility Toggle - always available */}
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

                  {/* Delete Button - hidden for locked sections */}
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
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm text-sm font-medium"
          >
            <HiPlus className="w-4 h-4" />
            הוסף סקשן
          </button>

          {/* Add Menu Dropdown */}
          {showAddMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-80 overflow-y-auto">
              <div className="p-2 sticky top-0 bg-white border-b border-gray-100">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 py-1">בחר סקשן</h4>
              </div>
              <div className="p-2 space-y-1">
                {AVAILABLE_SECTIONS.map((section) => (
                  <button
                    key={section.type}
                    onClick={() => handleAddSection(section.type)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-gray-50 transition-colors text-right group"
                  >
                    <div className="p-2 rounded-md bg-gray-100 text-gray-500 group-hover:bg-white group-hover:text-blue-600 transition-colors shadow-sm">
                      {React.createElement(section.icon, { className: "w-5 h-5" })}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {section.name}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {section.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
