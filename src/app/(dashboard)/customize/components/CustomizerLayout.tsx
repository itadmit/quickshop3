/**
 * Customizer Module - Main Layout Component
 * Layout עם Sidebar + Preview Frame
 */

'use client';

import { useState, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { PreviewFrame } from './PreviewFrame';
import { PageType } from '@/lib/customizer/types';
import { savePageDraft, publishPage } from '../actions';

interface CustomizerLayoutProps {
  pageType: PageType;
  pageHandle?: string;
}

export function CustomizerLayout({ pageType, pageHandle }: CustomizerLayoutProps) {
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [mode, setMode] = useState<'visual' | 'developer'>('visual');
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      // TODO: Get current sections from Sidebar/state
      // For now, just save empty draft
      const result = await savePageDraft({
        page_type: pageType,
        page_handle: pageHandle,
        sections: [],
        section_order: [],
      });
      
      if (result.success) {
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  }, [pageType, pageHandle]);

  const handlePublish = useCallback(async () => {
    if (!confirm('האם אתה בטוח שברצונך לפרסם את השינויים?')) {
      return;
    }

    try {
      setPublishing(true);
      const result = await publishPage({
        page_type: pageType,
        page_handle: pageHandle,
      });
      
      if (result.success) {
        alert('העמוד פורסם בהצלחה!');
        setLastSaved(new Date());
      } else {
        alert('שגיאה בפרסום: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error publishing:', error);
      alert('שגיאה בפרסום');
    } finally {
      setPublishing(false);
    }
  }, [pageType, pageHandle]);

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto">
        <Sidebar
          pageType={pageType}
          pageHandle={pageHandle}
          selectedSectionId={selectedSectionId}
          onSectionSelect={setSelectedSectionId}
          mode={mode}
          onModeChange={setMode}
        />
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex flex-col bg-gray-100">
        {/* Top Bar */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <select
              value={pageType}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="home">עמוד בית</option>
              <option value="product">עמוד מוצר</option>
              <option value="collection">עמוד קטגוריה</option>
              <option value="cart">עגלה</option>
              <option value="checkout">צ'ק אאוט</option>
            </select>

            {/* Device Selector */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDevice('desktop')}
                className={`p-2 rounded ${
                  device === 'desktop' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
                }`}
                title="Desktop"
              >
                🖥️
              </button>
              <button
                onClick={() => setDevice('tablet')}
                className={`p-2 rounded ${
                  device === 'tablet' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
                }`}
                title="Tablet"
              >
                📱
              </button>
              <button
                onClick={() => setDevice('mobile')}
                className={`p-2 rounded ${
                  device === 'mobile' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
                }`}
                title="Mobile"
              >
                📱
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {lastSaved && (
              <span className="text-xs text-gray-500">
                נשמר: {lastSaved.toLocaleTimeString('he-IL')}
              </span>
            )}
            <button
              onClick={() => {
                // Open preview in new tab
                window.open(`/shops/demo-store/preview?token=preview-token-placeholder&page=${pageType}`, '_blank');
              }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
            >
              👁️ תצוגה מקדימה
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm disabled:opacity-50"
            >
              {saving ? '💾 שומר...' : '💾 שמור'}
            </button>
            <button
              onClick={handlePublish}
              disabled={publishing || saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm disabled:opacity-50"
            >
              {publishing ? '🚀 מפרסם...' : '🚀 פרסם'}
            </button>
          </div>
        </div>

        {/* Preview Frame */}
        <div className="flex-1 overflow-auto p-4">
          <PreviewFrame
            pageType={pageType}
            pageHandle={pageHandle}
            device={device}
            selectedSectionId={selectedSectionId}
            onSectionSelect={setSelectedSectionId}
          />
        </div>
      </div>
    </div>
  );
}

