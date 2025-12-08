'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PreviewFrame } from './PreviewFrame';
import { Sidebar } from './Sidebar';
import { Header, DeviceType } from './Header';
import { SettingsAndStylePanel } from './SettingsAndStylePanel';
import { ElementsSidebar } from './ElementsSidebar';
import { NEW_YORK_TEMPLATE } from '@/lib/customizer/templates/new-york';
import { EditorState, SectionSettings } from '@/lib/customizer/types';

export function CustomizerLayout() {
  const [editorState, setEditorState] = useState<EditorState>({
    device: 'desktop',
    zoom: 100,
    showGrid: false,
    showOutlines: false
  });

  const [pageSections, setPageSections] = useState<SectionSettings[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial page data
  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = useCallback(async () => {
    try {
      const response = await fetch('/api/customizer/pages?pageType=home');
      const data = await response.json();

      if (data.sections && data.sections.length > 0) {
        setPageSections(data.sections);
      } else {
        // Load default New York template
        setPageSections(NEW_YORK_TEMPLATE.sections);
      }
    } catch (error) {
      console.error('Error loading page data:', error);
      // Fallback to default template
      setPageSections(NEW_YORK_TEMPLATE.sections);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDeviceChange = useCallback((device: DeviceType) => {
    setEditorState(prev => ({ ...prev, device }));
  }, []);

  const handleSectionSelect = useCallback((sectionId: string | null) => {
    setSelectedSectionId(sectionId);
  }, []);

  const handleSectionUpdate = useCallback((sectionId: string, updates: Partial<SectionSettings>) => {
    setPageSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? { ...section, ...updates }
          : section
      )
    );
  }, []);

  const handleSectionAdd = useCallback((sectionType: string, position?: number) => {
    const newSection: SectionSettings = {
      id: `section-${Date.now()}`,
      type: sectionType as any,
      name: sectionType,
      visible: true,
      order: position ?? pageSections.length,
      blocks: [],
      style: {
        background: {
          background_color: '#F3F4F6'
        },
        spacing: {
          padding_top: '60px',
          padding_bottom: '60px'
        }
      },
      settings: {}
    };

    setPageSections(prev => {
      const updated = [...prev];
      if (position !== undefined) {
        updated.splice(position, 0, newSection);
        // Update order for sections after the inserted one
        updated.forEach((section, index) => {
          section.order = index;
        });
      } else {
        updated.push(newSection);
      }
      return updated;
    });
  }, [pageSections.length]);

  const handleSectionDelete = useCallback((sectionId: string) => {
    setPageSections(prev => prev.filter(section => section.id !== sectionId));
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null);
    }
  }, [selectedSectionId]);

  const handleSectionMove = useCallback((sectionId: string, newPosition: number) => {
    setPageSections(prev => {
      const sectionIndex = prev.findIndex(s => s.id === sectionId);
      if (sectionIndex === -1) return prev;

      const updated = [...prev];
      const [movedSection] = updated.splice(sectionIndex, 1);
      updated.splice(newPosition, 0, movedSection);

      // Update order for all sections
      updated.forEach((section, index) => {
        section.order = index;
      });

      return updated;
    });
  }, []);

  const handleSave = useCallback(async () => {
    try {
      const response = await fetch('/api/customizer/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageType: 'home',
          sections: pageSections,
          isPublished: false
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert('השינויים נשמרו בהצלחה!');
      } else {
        alert('שגיאה בשמירה: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('שגיאה בשמירה');
    }
  }, [pageSections]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען עמוד...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50" dir="rtl">
      {/* Header */}
      <Header
        onSave={handleSave}
        onPreview={() => {}}
        onPublish={() => {}}
        device={editorState.device}
        onDeviceChange={handleDeviceChange}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Elements Sidebar (Right Side - Start in RTL) */}
        <div className="w-80 bg-white border-l border-gray-200">
          <ElementsSidebar
            sections={pageSections}
            selectedSectionId={selectedSectionId}
            onSectionSelect={handleSectionSelect}
            onSectionAdd={handleSectionAdd}
            onSectionDelete={handleSectionDelete}
            onSectionMove={handleSectionMove}
          />
        </div>

        {/* Preview Frame */}
        <div className="flex-1 bg-white">
          <PreviewFrame
            sections={pageSections}
            selectedSectionId={selectedSectionId}
            device={editorState.device}
            zoom={editorState.zoom}
            showGrid={editorState.showGrid}
            showOutlines={editorState.showOutlines}
            onSectionSelect={handleSectionSelect}
            onSectionUpdate={handleSectionUpdate}
            onSectionDelete={handleSectionDelete}
          />
        </div>

        {/* Settings Panel (Left Side - End in RTL) */}
        <div className="w-80 bg-white border-r border-gray-200">
          <SettingsAndStylePanel
            sections={pageSections}
            selectedSectionId={selectedSectionId}
            onSectionUpdate={handleSectionUpdate}
            device={editorState.device}
          />
        </div>
      </div>
    </div>
  );
}
