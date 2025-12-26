'use client';

import React, { useState, useMemo } from 'react';
import { SectionSettings, SectionType } from '@/lib/customizer/types';
import { getPageSpecificSections } from '@/lib/customizer/templates/new-york';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  HiCollection,
  HiBell,
  HiCode,
  HiViewGrid,
  HiSearch,
  HiX
} from 'react-icons/hi';

interface ElementsSidebarProps {
  sections: SectionSettings[];
  selectedSectionId: string | null;
  onSectionSelect: (sectionId: string | null) => void;
  onSectionAdd: (sectionType: string, position?: number) => void;
  onSectionDelete: (sectionId: string) => void;
  onSectionMove: (sectionId: string, newPosition: number) => void;
  onSectionUpdate?: (sectionId: string, updates: Partial<SectionSettings>) => void;
  pageType?: string;
}

type CategoryType = 'media' | 'store' | 'content' | 'marketing' | 'elements' | 'page-specific';

const BASE_CATEGORIES: { id: CategoryType; name: string; icon: React.ComponentType<any> }[] = [
  { id: 'media', name: 'מדיה ותמונה', icon: HiPhotograph },
  { id: 'store', name: 'חנות ומוצרים', icon: HiCube },
  { id: 'content', name: 'תוכן ומידע', icon: HiDocumentText },
  { id: 'marketing', name: 'שיווק וקשר', icon: HiMail },
  { id: 'elements', name: 'יחידים', icon: HiCube },
];

// Icon mapping for page-specific sections
const PAGE_SECTION_ICONS: Record<string, React.ComponentType<any>> = {
  product_breadcrumbs: HiFolder,
  product_gallery: HiPhotograph,
  product_title: HiDocumentText,
  product_price: HiCube,
  product_variants: HiViewList,
  product_add_to_cart: HiCube,
  product_description: HiDocumentText,
  product_custom_fields: HiViewList,
  product_reviews: HiChatAlt2,
  related_products: HiCube,
  recently_viewed: HiEye,
  collection_header: HiClipboardList,
  collection_description: HiDocumentText,
  collection_filters: HiViewList,
  collection_products: HiCube,
  collection_pagination: HiViewList,
};

const AVAILABLE_SECTIONS: Array<{
  type: SectionType;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: CategoryType;
}> = [
  // Media
  {
    type: 'announcement_bar',
    name: 'בר הודעות',
    description: 'בר הודעות עליון',
    icon: HiBell,
    category: 'media'
  },
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
  {
    type: 'collage',
    name: 'קולאז׳',
    description: 'רשת תמונות בסגנון קולאז׳',
    icon: HiViewGrid,
    category: 'media'
  },
  {
    type: 'custom_html',
    name: 'קוד HTML מותאם',
    description: 'הוספת קוד HTML מותאם אישית',
    icon: HiCode,
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
    name: 'מדיה עם טקסט',
    description: 'תמונה לצד טקסט',
    icon: HiPhotograph,
    category: 'content'
  },
  {
    type: 'multicolumn',
    name: 'עמודות מרובות',
    description: 'עמודות עם תמונות וטקסט',
    icon: HiViewList,
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
  },
  // Elements (יחידים)
  {
    type: 'element_heading',
    name: 'כותרת',
    description: 'כותרת פשוטה',
    icon: HiDocumentText,
    category: 'elements'
  },
  {
    type: 'element_content',
    name: 'תוכן',
    description: 'תוכן עשיר',
    icon: HiDocumentText,
    category: 'elements'
  },
  {
    type: 'element_button',
    name: 'כפתור',
    description: 'כפתור בודד',
    icon: HiPlay,
    category: 'elements'
  },
  {
    type: 'element_image',
    name: 'תמונה',
    description: 'תמונה בודדת',
    icon: HiPhotograph,
    category: 'elements'
  },
  {
    type: 'element_video',
    name: 'וידאו',
    description: 'וידאו בודד',
    icon: HiVideoCamera,
    category: 'elements'
  },
  {
    type: 'element_divider',
    name: 'מפריד',
    description: 'קו מפריד',
    icon: HiViewList,
    category: 'elements'
  },
  {
    type: 'element_spacer',
    name: 'רווח',
    description: 'רווח אנכי',
    icon: HiViewGrid,
    category: 'elements'
  },
  {
    type: 'element_marquee',
    name: 'טקסט נע',
    description: 'טקסט נע',
    icon: HiPlay,
    category: 'elements'
  }
];

// Add Section Menu Component
interface AddSectionMenuProps {
  pageType: string;
  activeCategory: CategoryType | 'page-specific';
  setActiveCategory: (category: CategoryType | 'page-specific') => void;
  onAddSection: (type: SectionType) => void;
}

function AddSectionMenu({ pageType, activeCategory, setActiveCategory, onAddSection }: AddSectionMenuProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Get page-specific sections
  const pageSpecificSections = useMemo(() => {
    const sections = getPageSpecificSections(pageType);
    return sections.map(s => ({
      type: s.type as SectionType,
      name: s.name,
      description: s.description,
      icon: PAGE_SECTION_ICONS[s.type] || HiDocumentText,
      category: 'page-specific' as CategoryType
    }));
  }, [pageType]);

  // Build categories - add page-specific for product/collection pages
  const categories = useMemo(() => {
    if (pageType === 'home') {
      return BASE_CATEGORIES;
    }
    const pageSpecificCategory = {
      id: 'page-specific' as CategoryType,
      name: pageType === 'product' ? 'עמוד מוצר' : 'עמוד קטגוריה',
      icon: HiCube
    };
    return [pageSpecificCategory, ...BASE_CATEGORIES];
  }, [pageType]);

  // Get sections to display based on active category and search
  const sectionsToDisplay = useMemo(() => {
    let sections = [];
    if (activeCategory === 'page-specific') {
      sections = pageSpecificSections;
    } else if (activeCategory === 'all') {
      sections = [...pageSpecificSections, ...AVAILABLE_SECTIONS];
    } else {
      sections = AVAILABLE_SECTIONS.filter(s => s.category === activeCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      // If searching, search across ALL available sections if no specific category matches well
      // OR just filter current category? Let's filter current category for now to keep UX consistent
      // Actually, better UX is to search everything if search is active, but keeping it simple per category is also fine.
      // Let's stick to current category filtering for now.
      return sections.filter(s => 
        s.name.toLowerCase().includes(query) || 
        s.description.toLowerCase().includes(query)
      );
    }

    return sections;
  }, [activeCategory, pageSpecificSections, searchQuery]);

  return (
    <div className="absolute bottom-full right-0 mb-3 bg-white border border-gray-200 rounded-xl shadow-2xl z-20 flex flex-col overflow-hidden h-[600px] w-[420px] origin-bottom-right">
      
      {/* Search Bar */}
      <div className="p-2.5 border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="relative">
          <HiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text"
            placeholder="חפש סקשן..."
            className="w-full pl-3 pr-9 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-300 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <HiX className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Categories Tabs */}
      <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-hide bg-gray-50/50 flex-shrink-0">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`flex flex-col items-center justify-center py-2 px-3 min-w-[75px] text-xs font-medium border-b-2 transition-all ${
              activeCategory === category.id
                ? 'border-black text-black bg-white shadow-sm'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/50'
            }`}
          >
            {React.createElement(category.icon, { className: `w-4 h-4 mb-1 ${activeCategory === category.id ? 'text-black' : 'text-gray-400'}` })}
            <span className="truncate max-w-full text-[11px]">{category.name.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Sections List */}
      <div className="flex-1 overflow-y-auto p-2.5 bg-gray-50/30 custom-scrollbar">
        <div className="space-y-1.5">
          {sectionsToDisplay.map((section) => (
            <button
              key={section.type}
              onClick={() => onAddSection(section.type)}
              className="w-full flex items-start gap-2.5 p-2.5 rounded-lg bg-white border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all text-right group relative overflow-hidden"
            >
              <div className="p-2 rounded-lg bg-gray-50 text-gray-500 group-hover:bg-black group-hover:text-white transition-colors shadow-sm shrink-0">
                {React.createElement(section.icon, { className: "w-5 h-5" })}
              </div>
              <div className="flex-1 min-w-0 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-black">
                    {section.name}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {section.description}
                  </p>
                </div>
                <HiPlus className="w-5 h-5 text-gray-300 group-hover:text-black opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-110 mr-2" />
              </div>
            </button>
          ))}
          
          {sectionsToDisplay.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-center text-gray-400">
              <HiSearch className="w-12 h-12 mb-3 text-gray-200" />
              <p className="text-sm font-medium text-gray-900">לא נמצאו סקשנים</p>
              <p className="text-xs text-gray-500 mt-1">נסה לשנות את מונח החיפוש</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer hint */}
      <div className="p-2.5 bg-gray-50 border-t border-gray-100 text-center flex-shrink-0">
        <p className="text-[10px] text-gray-400 font-medium">לחץ על סקשן כדי להוסיף אותו לעמוד</p>
      </div>
    </div>
  );
}

// Sortable Section Item Component
interface SortableSectionItemProps {
  section: SectionSettings;
  isSelected: boolean;
  isLocked: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
  getSectionIcon: (type: SectionType) => React.ComponentType<any>;
}

function SortableSectionItem({ 
  section, 
  isSelected, 
  isLocked, 
  onSelect, 
  onToggleVisibility, 
  onDelete,
  getSectionIcon 
}: SortableSectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: section.id,
    disabled: isLocked 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style as React.CSSProperties}
      className={`group flex items-center justify-between p-3 cursor-pointer transition-all ${
        isSelected
          ? 'bg-gray-50 border-r-2 border-gray-900'
          : 'hover:bg-gray-50 border-r-2 border-transparent'
      } ${isLocked ? 'bg-gray-50/50' : ''} ${isDragging ? 'shadow-lg bg-white rounded-lg' : ''}`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3 flex-1 overflow-hidden">
        {/* Drag Handle - hidden for locked sections */}
        {!isLocked && (
          <div 
            {...attributes}
            {...listeners}
            className="text-gray-300 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <HiDotsVertical className="w-4 h-4" />
          </div>
        )}
        
        <div className={`p-1.5 rounded-md ${
          isSelected ? 'bg-gray-100 text-gray-900' : isLocked ? 'bg-gray-200 text-gray-600' : 'bg-gray-100 text-gray-500'
        }`}>
          {React.createElement(getSectionIcon(section.type), { className: "w-4 h-4" })}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-medium truncate ${
              isSelected ? 'text-gray-900' : 'text-gray-700'
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
            onToggleVisibility();
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
              onDelete();
            }}
            className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            title="מחק"
          >
            <HiTrash className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function ElementsSidebar({
  sections,
  selectedSectionId,
  onSectionSelect,
  onSectionAdd,
  onSectionDelete,
  onSectionMove,
  onSectionUpdate,
  pageType = 'home'
}: ElementsSidebarProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryType | 'page-specific'>(
    pageType === 'home' ? 'media' : 'page-specific'
  );

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex(s => s.id === active.id);
      const newIndex = sections.findIndex(s => s.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        onSectionMove(active.id as string, newIndex);
      }
    }
  };

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
        <button className="text-xs text-gray-900 hover:text-gray-700 font-medium">
          אפס הכל
        </button>
      </div>

      {/* Sections List with Drag and Drop */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="divide-y divide-gray-50">
              {sections.map((section) => {
                const isLocked = section.locked || section.type === 'header' || section.type === 'footer';
                
                return (
                  <SortableSectionItem
                    key={section.id}
                    section={section}
                    isSelected={selectedSectionId === section.id}
                    isLocked={isLocked}
                    onSelect={() => handleSectionClick(section.id)}
                    onToggleVisibility={() => {
                      if (onSectionUpdate) {
                        onSectionUpdate(section.id, { visible: !section.visible });
                      }
                    }}
                    onDelete={() => onSectionDelete(section.id)}
                    getSectionIcon={getSectionIcon}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
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
            <AddSectionMenu 
              pageType={pageType}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              onAddSection={handleAddSection}
            />
          )}
        </div>
      </div>
    </div>
  );
}
