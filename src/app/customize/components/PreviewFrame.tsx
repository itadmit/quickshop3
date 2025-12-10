'use client';

import React, { useCallback, useRef, useEffect } from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { SectionRenderer } from './sections/SectionRenderer';
import { HiPencil, HiTrash, HiDocument } from 'react-icons/hi';

interface PreviewFrameProps {
  sections: SectionSettings[];
  selectedSectionId: string | null;
  device: 'desktop' | 'tablet' | 'mobile';
  zoom: number;
  showGrid: boolean;
  showOutlines: boolean;
  onSectionSelect: (sectionId: string | null) => void;
  onSectionUpdate: (sectionId: string, updates: Partial<SectionSettings>) => void;
  onSectionDelete?: (sectionId: string) => void;
}

export function PreviewFrame({
  sections,
  selectedSectionId,
  device,
  zoom,
  showGrid,
  showOutlines,
  onSectionSelect,
  onSectionUpdate,
  onSectionDelete
}: PreviewFrameProps) {
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [hoveredSectionId, setHoveredSectionId] = React.useState<string | null>(null);

  // Scroll to selected section
  useEffect(() => {
    if (selectedSectionId && sectionRefs.current[selectedSectionId]) {
      sectionRefs.current[selectedSectionId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [selectedSectionId]);

  const handleSectionClick = useCallback((sectionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onSectionSelect(sectionId);
  }, [onSectionSelect]);

  const handleCanvasClick = useCallback(() => {
    onSectionSelect(null);
  }, [onSectionSelect]);

  const getDeviceStyles = () => {
    switch (device) {
      case 'mobile':
        return 'max-w-sm mx-auto';
      case 'tablet':
        return 'max-w-2xl mx-auto';
      default:
        return 'w-full';
    }
  };

  return (
    <div className="h-full bg-gray-100 overflow-auto">
      <div className="min-h-full p-8">
        <div
          className={`bg-white shadow-lg mx-auto transition-all duration-300 ${getDeviceStyles()}`}
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center'
          }}
        >
          {/* Canvas Area */}
          <div
            className={`min-h-screen relative ${showGrid ? 'bg-grid' : ''}`}
            onClick={handleCanvasClick}
          >
            {sections.map((section) => (
              <div
                key={section.id}
                ref={(el) => {
                  sectionRefs.current[section.id] = el;
                }}
                className="relative group"
                onMouseEnter={() => setHoveredSectionId(section.id)}
                onMouseLeave={() => setHoveredSectionId(null)}
                onClick={(e) => handleSectionClick(section.id, e)}
              >
                {/* Section Content */}
                <SectionRenderer
                  section={section}
                  isSelected={selectedSectionId === section.id}
                  onUpdate={(updates) => onSectionUpdate(section.id, updates)}
                  device={device}
                />

                {/* Overlay Border - Always on top */}
                <div
                  className={`absolute inset-0 pointer-events-none transition-all duration-200 ${
                    selectedSectionId === section.id
                      ? 'ring-2 ring-gray-900 z-[100]'
                      : hoveredSectionId === section.id
                      ? 'ring-2 ring-gray-600 z-[90]'
                      : showOutlines
                      ? 'ring-1 ring-gray-200 z-[80]'
                      : ''
                  }`}
                  style={{
                    margin: selectedSectionId === section.id ? '-2px' : hoveredSectionId === section.id ? '-2px' : '0'
                  }}
                />

                {/* Section Controls - Always visible when selected or hovered */}
                {(selectedSectionId === section.id || hoveredSectionId === section.id) && (
                  <div className="absolute top-2 right-2 z-[100] pointer-events-auto">
                    <div className="flex items-center space-x-1 rtl:space-x-reverse">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Edit action
                        }}
                        className="w-8 h-8 bg-gray-900 text-white rounded shadow-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
                        title="ערוך"
                      >
                        <HiPencil className="w-4 h-4 text-white" />
                      </button>
                      {!section.locked && onSectionDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSectionDelete(section.id);
                            onSectionSelect(null);
                          }}
                          className="w-8 h-8 bg-red-500 text-white rounded shadow-lg flex items-center justify-center hover:bg-red-600 transition-colors"
                          title="מחק"
                        >
                          <HiTrash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Empty State */}
            {sections.length === 0 && (
              <div className="min-h-screen flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-6xl mb-4 text-gray-400">
                    <HiDocument className="w-24 h-24 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">העמוד ריק</h3>
                  <p className="text-sm">הוסף סקשנים כדי להתחיל לבנות את העמוד</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}