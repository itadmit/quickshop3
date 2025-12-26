'use client';

import React, { useState, useEffect } from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { SettingsPanel } from './panels/SettingsPanel';
import { StylePanel } from './panels/StylePanel';
import { HiAdjustments, HiColorSwatch, HiCursorClick } from 'react-icons/hi';
import { DeviceType } from './Header';

interface SettingsAndStylePanelProps {
  sections: SectionSettings[];
  selectedSectionId: string | null;
  onSectionUpdate: (sectionId: string, updates: Partial<SectionSettings>) => void;
  device: DeviceType;
}

type PanelType = 'settings' | 'style';

export function SettingsAndStylePanel({
  sections,
  selectedSectionId,
  onSectionUpdate,
  device
}: SettingsAndStylePanelProps) {
  const [activePanel, setActivePanel] = useState<PanelType>('settings');

  // Switch to 'settings' tab when a new section is selected
  useEffect(() => {
    if (selectedSectionId) {
      setActivePanel('settings');
    }
  }, [selectedSectionId]);

  const selectedSection = sections.find(s => s.id === selectedSectionId);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Panel Tabs */}
      <div className="flex border-b border-gray-100 bg-gray-50/50 overflow-x-auto">
        <button
          onClick={() => setActivePanel('settings')}
          disabled={!selectedSection}
          className={`flex-1 min-w-[100px] flex items-center justify-center gap-1.5 px-3 py-3.5 text-sm font-medium transition-all whitespace-nowrap ${
            activePanel === 'settings'
              ? 'text-gray-900 bg-white border-t-2 border-t-gray-900 border-x border-gray-100'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/80'
          } ${!selectedSection ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <HiAdjustments className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">הגדרות</span>
        </button>
        <button
          onClick={() => setActivePanel('style')}
          disabled={!selectedSection}
          className={`flex-1 min-w-[100px] flex items-center justify-center gap-1.5 px-3 py-3.5 text-sm font-medium transition-all whitespace-nowrap ${
            activePanel === 'style'
              ? 'text-gray-900 bg-white border-t-2 border-t-gray-900 border-x border-gray-100'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/80'
          } ${!selectedSection ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <HiColorSwatch className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">עיצוב</span>
        </button>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activePanel === 'settings' && selectedSection && (
          <div className="p-4">
             <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{selectedSection.name}</h3>
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full">
                  {selectedSection.type}
                </span>
             </div>
             {device !== 'desktop' && (
               <div className="mb-4 bg-gray-50 text-gray-700 text-xs px-3 py-2 rounded-md flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-gray-900 animate-pulse"/>
                 עורך תצוגת {device === 'mobile' ? 'מובייל' : 'טאבלט'}
               </div>
             )}
            <SettingsPanel
              section={selectedSection}
              onUpdate={(updates) => onSectionUpdate(selectedSection.id, updates)}
              device={device}
            />
          </div>
        )}

        {activePanel === 'style' && selectedSection && (
          <div className="p-4">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">עיצוב: {selectedSection.name}</h3>
             </div>
             {device !== 'desktop' && (
               <div className="mb-4 bg-gray-50 text-gray-700 text-xs px-3 py-2 rounded-md flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-gray-900 animate-pulse"/>
                 עורך תצוגת {device === 'mobile' ? 'מובייל' : 'טאבלט'}
               </div>
             )}
            <StylePanel
              section={selectedSection}
              onUpdate={(updates) => onSectionUpdate(selectedSection.id, updates)}
              // TODO: StylePanel also needs device prop
            />
          </div>
        )}

        {!selectedSection && (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-500">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <HiCursorClick className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">ערוך את החנות שלך</h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              בחר סקשן מהתפריט הימני כדי לערוך את ההגדרות והעיצוב שלו
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
