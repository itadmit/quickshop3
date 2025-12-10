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
  HiTrash,
  HiPlus
} from 'react-icons/hi';

interface ElementsPanelProps {
  sections: SectionSettings[];
  selectedSectionId: string | null;
  onSectionSelect: (sectionId: string | null) => void;
  onSectionAdd: (sectionType: string, position?: number) => void;
  onSectionDelete: (sectionId: string) => void;
  onSectionMove: (sectionId: string, newPosition: number) => void;
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
    name: 'מדיה עם טקסט',
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
  },
  {
    type: 'gallery',
    name: 'גלריה',
    description: 'גלריית תמונות עם אפשרות רשת או קרוסלה',
    icon: HiPhotograph
  }
];

export function ElementsPanel({
  sections,
  selectedSectionId,
  onSectionSelect,
  onSectionAdd,
  onSectionDelete,
  onSectionMove
}: ElementsPanelProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);

  const handleSectionClick = (sectionId: string) => {
    onSectionSelect(selectedSectionId === sectionId ? null : sectionId);
  };

  const handleAddSection = (sectionType: SectionType) => {
    onSectionAdd(sectionType);
    setShowAddMenu(false);
  };

  const getSectionIcon = (type: SectionType) => {
    const section = AVAILABLE_SECTIONS.find(s => s.type === type);
    return section?.icon || HiCube;
  };

  return (
    <div className="p-4">
      {/* Page Sections List */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">אלמנטים בעמוד</h3>
        <div className="space-y-2">
          {sections.map((section, index) => (
            <div
              key={section.id}
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedSectionId === section.id
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleSectionClick(section.id)}
            >
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="text-lg text-gray-600">
                  {React.createElement(getSectionIcon(section.type))}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {section.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {section.type}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                {/* Visibility Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Toggle visibility logic would go here
                  }}
                  className={`w-5 h-5 rounded ${
                    section.visible ? 'text-gray-600' : 'text-gray-300'
                  }`}
                >
                  <HiEye className="w-4 h-4" />
                </button>

                {/* Delete Button */}
                {!section.locked && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSectionDelete(section.id);
                    }}
                    className="w-5 h-5 text-red-500 hover:text-red-600"
                  >
                    <HiTrash className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Section Button */}
      <div className="relative">
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
        >
          <HiPlus className="w-5 h-5 ml-2" />
          הוסף אלמנט
        </button>

        {/* Add Menu Dropdown */}
        {showAddMenu && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            <div className="p-2 max-h-64 overflow-y-auto">
              {AVAILABLE_SECTIONS.map((section) => (
                <button
                  key={section.type}
                  onClick={() => handleAddSection(section.type)}
                  className="w-full flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="text-lg text-gray-600">
                    {React.createElement(section.icon)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {section.name}
                    </p>
                    <p className="text-xs text-gray-500">
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
  );
}

import React, { useState } from 'react';
import { SectionSettings, SectionType } from '@/lib/customizer/types';
import {
  HiPhotograph,
  HiCube,
  HiFolder,
  HiDocumentText,
  HiMail,
  HiEye,
  HiTrash,
  HiPlus
} from 'react-icons/hi';

interface ElementsPanelProps {
  sections: SectionSettings[];
  selectedSectionId: string | null;
  onSectionSelect: (sectionId: string | null) => void;
  onSectionAdd: (sectionType: string, position?: number) => void;
  onSectionDelete: (sectionId: string) => void;
  onSectionMove: (sectionId: string, newPosition: number) => void;
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
    name: 'מדיה עם טקסט',
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
  },
  {
    type: 'gallery',
    name: 'גלריה',
    description: 'גלריית תמונות עם אפשרות רשת או קרוסלה',
    icon: HiPhotograph
  }
];

export function ElementsPanel({
  sections,
  selectedSectionId,
  onSectionSelect,
  onSectionAdd,
  onSectionDelete,
  onSectionMove
}: ElementsPanelProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);

  const handleSectionClick = (sectionId: string) => {
    onSectionSelect(selectedSectionId === sectionId ? null : sectionId);
  };

  const handleAddSection = (sectionType: SectionType) => {
    onSectionAdd(sectionType);
    setShowAddMenu(false);
  };

  const getSectionIcon = (type: SectionType) => {
    const section = AVAILABLE_SECTIONS.find(s => s.type === type);
    return section?.icon || HiCube;
  };

  return (
    <div className="p-4">
      {/* Page Sections List */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">אלמנטים בעמוד</h3>
        <div className="space-y-2">
          {sections.map((section, index) => (
            <div
              key={section.id}
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedSectionId === section.id
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleSectionClick(section.id)}
            >
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="text-lg text-gray-600">
                  {React.createElement(getSectionIcon(section.type))}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {section.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {section.type}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                {/* Visibility Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Toggle visibility logic would go here
                  }}
                  className={`w-5 h-5 rounded ${
                    section.visible ? 'text-gray-600' : 'text-gray-300'
                  }`}
                >
                  <HiEye className="w-4 h-4" />
                </button>

                {/* Delete Button */}
                {!section.locked && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSectionDelete(section.id);
                    }}
                    className="w-5 h-5 text-red-500 hover:text-red-600"
                  >
                    <HiTrash className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Section Button */}
      <div className="relative">
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
        >
          <HiPlus className="w-5 h-5 ml-2" />
          הוסף אלמנט
        </button>

        {/* Add Menu Dropdown */}
        {showAddMenu && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            <div className="p-2 max-h-64 overflow-y-auto">
              {AVAILABLE_SECTIONS.map((section) => (
                <button
                  key={section.type}
                  onClick={() => handleAddSection(section.type)}
                  className="w-full flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="text-lg text-gray-600">
                    {React.createElement(section.icon)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {section.name}
                    </p>
                    <p className="text-xs text-gray-500">
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
  );
}
