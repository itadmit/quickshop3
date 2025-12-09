'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { ElementsPanel } from './panels/ElementsPanel';
import { SettingsPanel } from './panels/SettingsPanel';
import { StylePanel } from './panels/StylePanel';
import { HiCursorClick } from 'react-icons/hi';

interface SidebarProps {
  sections: SectionSettings[];
  selectedSectionId: string | null;
  onSectionSelect: (sectionId: string | null) => void;
  onSectionUpdate: (sectionId: string, updates: Partial<SectionSettings>) => void;
  onSectionAdd: (sectionType: string, position?: number) => void;
  onSectionDelete: (sectionId: string) => void;
  onSectionMove: (sectionId: string, newPosition: number) => void;
}

type PanelType = 'elements' | 'settings' | 'style';

export function Sidebar({
  sections,
  selectedSectionId,
  onSectionSelect,
  onSectionUpdate,
  onSectionAdd,
  onSectionDelete,
  onSectionMove
}: SidebarProps) {
  const [activePanel, setActivePanel] = useState<PanelType>('elements');
  const prevSelectedSectionId = useRef<string | null>(null);

  const selectedSection = sections.find(s => s.id === selectedSectionId);

  // Switch to settings panel when a section is selected
  useEffect(() => {
    if (selectedSectionId && selectedSectionId !== prevSelectedSectionId.current) {
      setActivePanel('settings');
    }
    prevSelectedSectionId.current = selectedSectionId;
  }, [selectedSectionId]);

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Panel Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActivePanel('elements')}
          className={`flex-1 px-4 py-3 text-sm font-medium ${
            activePanel === 'elements'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          אלמנטים
        </button>
        <button
          onClick={() => setActivePanel('settings')}
          disabled={!selectedSection}
          className={`flex-1 px-4 py-3 text-sm font-medium ${
            activePanel === 'settings'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          } ${!selectedSection ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          הגדרות
        </button>
        <button
          onClick={() => setActivePanel('style')}
          disabled={!selectedSection}
          className={`flex-1 px-4 py-3 text-sm font-medium ${
            activePanel === 'style'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          } ${!selectedSection ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          עיצוב
        </button>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto">
        {activePanel === 'elements' && (
          <ElementsPanel
            sections={sections}
            selectedSectionId={selectedSectionId}
            onSectionSelect={onSectionSelect}
            onSectionAdd={onSectionAdd}
            onSectionDelete={onSectionDelete}
            onSectionMove={onSectionMove}
          />
        )}

        {activePanel === 'settings' && selectedSection && (
          <SettingsPanel
            section={selectedSection}
            onUpdate={(updates) => onSectionUpdate(selectedSection.id, updates)}
          />
        )}

        {activePanel === 'style' && selectedSection && (
          <StylePanel
            section={selectedSection}
            onUpdate={(updates) => onSectionUpdate(selectedSection.id, updates)}
          />
        )}

        {!selectedSection && activePanel !== 'elements' && (
          <div className="p-6 text-center text-gray-500">
            <div className="text-4xl mb-4 text-gray-400">
              <HiCursorClick className="w-16 h-16 mx-auto" />
            </div>
            <p>בחר אלמנט כדי לערוך את ההגדרות שלו</p>
          </div>
        )}
      </div>
    </div>
  );
}