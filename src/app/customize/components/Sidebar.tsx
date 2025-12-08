/**
 * Customizer Module - Sidebar Component
 * Sidebar עם רשימת סקשנים והגדרות
 */

'use client';

import { useState, useEffect } from 'react';
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
import { PageType, PageSection } from '@/lib/customizer/types';
import { SectionSettings } from './SectionSettings';
import { AddSectionDialog } from './AddSectionDialog';
import { DeveloperMode } from './DeveloperMode';
import { ThemeSettings } from './ThemeSettings';
import { VersionHistory } from './VersionHistory';
import { TemplateEditor } from './TemplateEditor';
import { updateSection, deleteSection, addSection } from '../actions';
import { SortableSectionItem } from './SortableSectionItem';
import { useAutoSave } from '../hooks/useAutoSave';
import { HiColorSwatch, HiCode, HiCog, HiSave, HiClock, HiTemplate } from 'react-icons/hi';

interface SidebarProps {
  pageType: PageType;
  pageHandle?: string;
  selectedSectionId: string | null;
  onSectionSelect: (id: string | null) => void;
  mode: 'visual' | 'developer';
  onModeChange: (mode: 'visual' | 'developer') => void;
}

export function Sidebar({
  pageType,
  pageHandle,
  selectedSectionId,
  onSectionSelect,
  mode,
  onModeChange,
}: SidebarProps) {
  const [sections, setSections] = useState<PageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);

  // Auto-save hook
  const { lastSaved } = useAutoSave({
    pageType,
    pageHandle,
    sections: sections.map(s => ({
      section_type: s.section_type,
      section_id: s.section_id,
      position: s.position,
      is_visible: s.is_visible,
      is_locked: s.is_locked,
      settings_json: s.settings_json,
      custom_css: s.custom_css,
      custom_classes: s.custom_classes,
      blocks: [],
    })),
    sectionOrder: sections.map(s => s.section_id),
    enabled: !loading && sections.length > 0,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadSections();
  }, [pageType, pageHandle]);

  async function loadSections() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        pageType,
        draft: 'true',
      });
      if (pageHandle) {
        params.append('handle', pageHandle);
      }

      const response = await fetch(`/api/customizer/pages?${params}`);
      const data = await response.json();

      if (data.config && data.config.section_order && data.config.section_order.length > 0) {
        const sectionsList = data.config.section_order.map((sectionId: string, index: number) => {
          const sectionData = data.config.sections[sectionId];
          return {
            id: sectionData?.id || index,
            section_id: sectionId,
            section_type: sectionData?.type || sectionId,
            position: sectionData?.position || index,
            is_visible: sectionData?.is_visible !== false,
            is_locked: sectionData?.is_locked || false,
            settings_json: sectionData?.settings || {},
            custom_css: sectionData?.custom_css || '',
            custom_classes: sectionData?.custom_classes || '',
          } as PageSection;
        });
        setSections(sectionsList);
      } else {
        // אין סקשנים - יצירת default sections
        await createDefaultSections();
      }
    } catch (error) {
      console.error('Error loading sections:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sections.findIndex(s => s.section_id === active.id);
    const newIndex = sections.findIndex(s => s.section_id === over.id);

    const newSections = arrayMove(sections, oldIndex, newIndex);
    setSections(newSections);

    // Update positions in DB
    for (let i = 0; i < newSections.length; i++) {
      const section = newSections[i];
      if (section.position !== i) {
        await updateSection({
          section_id: section.id,
          position: i,
        });
      }
    }

    // Reload to sync
    loadSections();
  }

  async function handleDeleteSection(sectionId: string) {
    const section = sections.find(s => s.section_id === sectionId);
    if (!section || section.is_locked) {
      return;
    }

    if (confirm('האם אתה בטוח שברצונך למחוק את הסקשן הזה?')) {
      await deleteSection(section.id);
      loadSections();
      if (selectedSectionId === sectionId) {
        onSectionSelect(null);
      }
    }
  }

  async function createDefaultSections() {
    try {
      // יצירת סקשנים ברירת מחדל לעמוד בית
      if (pageType === 'home') {
        const defaultSections = [
          { type: 'announcement_bar', position: 0 },
          { type: 'slideshow', position: 1 },
          { type: 'collection_list', position: 2 },
          { type: 'product_grid', position: 3 },
        ];

        for (const section of defaultSections) {
          await addSection({
            page_type: pageType,
            page_handle: pageHandle,
            section_type: section.type as any,
            position: section.position,
            settings_json: {},
          });
        }
      } else {
        // לעמודים אחרים - רק announcement_bar
        await addSection({
          page_type: pageType,
          page_handle: pageHandle,
          section_type: 'announcement_bar',
          position: 0,
          settings_json: {},
        });
      }

      // טען מחדש
      loadSections();
    } catch (error) {
      console.error('Error creating default sections:', error);
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  // Show Developer Mode if selected
  if (mode === 'developer') {
    return (
      <DeveloperMode
        pageType={pageType}
        pageHandle={pageHandle}
        onSave={async (code) => {
          // TODO: Save code to theme settings
          console.log('Saving code:', code);
        }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Mode Switcher */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex gap-2">
          <button
            onClick={() => onModeChange('visual')}
            className="flex-1 px-3 py-2 rounded-md text-sm font-medium bg-blue-600 text-white flex items-center justify-center gap-2"
          >
            <HiColorSwatch className="w-4 h-4" />
            ויזואלי
          </button>
          <button
            onClick={() => onModeChange('developer')}
            className="flex-1 px-3 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center gap-2"
          >
            <HiCode className="w-4 h-4" />
            מפתח
          </button>
        </div>
      </div>

      {/* Sections List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
            סקשנים
          </div>

          {sections.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-8">
              אין סקשנים. לחץ על "הוסף סקשן" כדי להתחיל.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sections.map(s => s.section_id)}
                strategy={verticalListSortingStrategy}
              >
                {sections.map((section) => (
                  <SortableSectionItem
                    key={section.section_id}
                    section={section}
                    isSelected={selectedSectionId === section.section_id}
                    onSelect={onSectionSelect}
                    onSettings={(id) => {
                      onSectionSelect(id);
                      setShowSettings(true);
                    }}
                    onDelete={handleDeleteSection}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}

          <button
            onClick={() => setShowAddDialog(true)}
            className="w-full mt-4 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
          >
            + הוסף סקשן
          </button>
        </div>
      </div>

      {/* Auto-save indicator */}
      {lastSaved && (
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
            <HiSave className="w-3 h-3" />
            נשמר אוטומטית: {lastSaved.toLocaleTimeString('he-IL')}
          </div>
        </div>
      )}

      {/* Theme Settings & Version History */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <button
          onClick={() => setShowThemeSettings(true)}
          className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm text-gray-700 flex items-center justify-center gap-2"
        >
          <HiCog className="w-4 h-4" />
          הגדרות תבנית
        </button>
        <button
          onClick={() => setShowVersionHistory(true)}
          className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm text-gray-700 flex items-center justify-center gap-2"
        >
          <HiClock className="w-4 h-4" />
          היסטוריית גרסאות
        </button>
      </div>

      {/* Add Section Dialog */}
      <AddSectionDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        pageType={pageType}
        onSectionAdded={loadSections}
      />

      {/* Section Settings Panel */}
      {showSettings && (
        <div className="fixed inset-y-0 left-0 w-96 bg-white border-r border-gray-200 z-50 shadow-xl">
          <SectionSettings
            section={sections.find(s => s.section_id === selectedSectionId) || null}
            onClose={() => {
              setShowSettings(false);
              onSectionSelect(null);
            }}
            onUpdate={loadSections}
          />
        </div>
      )}

      {/* Theme Settings Panel */}
      {showThemeSettings && (
        <div className="fixed inset-y-0 left-0 w-96 bg-white border-r border-gray-200 z-50 shadow-xl">
          <ThemeSettings
            onClose={() => setShowThemeSettings(false)}
            onUpdate={loadSections}
          />
        </div>
      )}

      {/* Version History Panel */}
      {showVersionHistory && (
        <div className="fixed inset-y-0 left-0 w-96 bg-white border-r border-gray-200 z-50 shadow-xl">
          <VersionHistory
            pageType={pageType}
            pageHandle={pageHandle}
            onVersionRestored={loadSections}
            onClose={() => setShowVersionHistory(false)}
          />
        </div>
      )}

      {/* Template Editor Panel */}
      {showTemplateEditor && (pageType === 'product' || pageType === 'collection') && (
        <div className="fixed inset-y-0 left-0 w-96 bg-white border-r border-gray-200 z-50 shadow-xl">
          <TemplateEditor
            templateType={pageType === 'product' ? 'product' : 'collection'}
            onClose={() => setShowTemplateEditor(false)}
          />
        </div>
      )}
    </div>
  );
}

