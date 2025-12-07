/**
 * Customizer Module - Section Settings Panel
 * פאנל עריכת הגדרות סקשן
 */

'use client';

import { useState, useEffect } from 'react';
import { updateSection } from '../actions';
import { PageSection } from '@/lib/customizer/types';

interface SectionSettingsProps {
  section: PageSection | null;
  onClose: () => void;
  onUpdate: () => void;
}

export function SectionSettings({ section, onClose, onUpdate }: SectionSettingsProps) {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [customCSS, setCustomCSS] = useState('');
  const [customClasses, setCustomClasses] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (section) {
      setSettings(section.settings_json || {});
      setCustomCSS(section.custom_css || '');
      setCustomClasses(section.custom_classes || '');
    }
  }, [section]);

  if (!section) {
    return null;
  }

  async function handleSave() {
    if (!section) return;
    
    try {
      setSaving(true);
      await updateSection({
        section_id: section.id,
        settings,
        custom_css: customCSS,
        custom_classes: customClasses,
      });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating section:', error);
    } finally {
      setSaving(false);
    }
  }

  function updateSetting(key: string, value: any) {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {section.section_type}
          </h3>
          <p className="text-sm text-gray-500">עריכת הגדרות סקשן</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-md"
          title="סגור"
        >
          ✕
        </button>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Basic Settings */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">הגדרות בסיסיות</h4>
          
          {/* Heading */}
          {section.section_type.includes('collection') || section.section_type.includes('featured') ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                כותרת
              </label>
              <input
                type="text"
                value={settings.heading || ''}
                onChange={(e) => updateSetting('heading', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="הכנס כותרת"
              />
            </div>
          ) : null}

          {/* Subheading */}
          {section.section_type.includes('collection') || section.section_type.includes('featured') ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                תת כותרת
              </label>
              <input
                type="text"
                value={settings.subheading || ''}
                onChange={(e) => updateSetting('subheading', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="הכנס תת כותרת"
              />
            </div>
          ) : null}

          {/* Text Alignment */}
          {section.section_type.includes('text') || section.section_type.includes('collection') ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                יישור טקסט
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => updateSetting('text_alignment', 'right')}
                  className={`flex-1 px-3 py-2 rounded-md text-sm ${
                    settings.text_alignment === 'right'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ימין
                </button>
                <button
                  onClick={() => updateSetting('text_alignment', 'center')}
                  className={`flex-1 px-3 py-2 rounded-md text-sm ${
                    settings.text_alignment === 'center'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  מרכז
                </button>
                <button
                  onClick={() => updateSetting('text_alignment', 'left')}
                  className={`flex-1 px-3 py-2 rounded-md text-sm ${
                    settings.text_alignment === 'left'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  שמאל
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Layout Settings */}
        {section.section_type.includes('collection') || section.section_type.includes('grid') ? (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">הגדרות פריסה</h4>
            
            {/* Container Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                סוג קונטיינר
              </label>
              <select
                value={settings.container_type || 'container_box'}
                onChange={(e) => updateSetting('container_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="container_box">קונטיינר מוגבל</option>
                <option value="full_width">רוחב מלא</option>
              </select>
            </div>

            {/* Background Color */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                צבע רקע
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.background_color || '#FFFFFF'}
                  onChange={(e) => updateSetting('background_color', e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.background_color || '#FFFFFF'}
                  onChange={(e) => updateSetting('background_color', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="#FFFFFF"
                />
              </div>
            </div>

            {/* Columns per row */}
            {section.section_type.includes('grid') || section.section_type.includes('collection') ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  עמודות בשורה: {settings.collections_per_row || settings.columns_per_row || 3}
                </label>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={settings.collections_per_row || settings.columns_per_row || 3}
                  onChange={(e) => updateSetting(
                    section.section_type.includes('collection') ? 'collections_per_row' : 'columns_per_row',
                    parseInt(e.target.value)
                  )}
                  className="w-full"
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Slider Settings */}
        {section.section_type.includes('slideshow') || section.section_type.includes('slider') ? (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">הגדרות סליידר</h4>
            
            {/* Auto Rotate */}
            <div className="mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.auto_rotate || settings.auto_slide || false}
                  onChange={(e) => updateSetting(
                    section.section_type === 'slideshow' ? 'auto_rotate' : 'auto_slide',
                    e.target.checked
                  )}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">סיבוב אוטומטי</span>
              </label>
            </div>

            {/* Interval */}
            {(settings.auto_rotate || settings.auto_slide) && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  מרווח זמן (שניות): {settings.auto_rotate_interval || settings.auto_slide_interval || 5}
                </label>
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={settings.auto_rotate_interval || settings.auto_slide_interval || 5}
                  onChange={(e) => updateSetting(
                    section.section_type === 'slideshow' ? 'auto_rotate_interval' : 'auto_slide_interval',
                    parseInt(e.target.value)
                  )}
                  className="w-full"
                />
              </div>
            )}

            {/* Show Pagination */}
            <div className="mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.show_pagination !== false}
                  onChange={(e) => updateSetting('show_pagination', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">הצג נקודות ניווט</span>
              </label>
            </div>

            {/* Show Navigation */}
            <div className="mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.show_navigation || false}
                  onChange={(e) => updateSetting('show_navigation', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">הצג כפתורי ניווט</span>
              </label>
            </div>
          </div>
        ) : null}

        {/* Custom CSS */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">CSS מותאם</h4>
          <textarea
            value={customCSS}
            onChange={(e) => setCustomCSS(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
            rows={6}
            placeholder=".my-custom-class { ... }"
          />
        </div>

        {/* Custom Classes */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Classes מותאמים</h4>
          <input
            type="text"
            value={customClasses}
            onChange={(e) => setCustomClasses(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="class1 class2 class3"
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
        >
          ביטול
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'שומר...' : 'שמור'}
        </button>
      </div>
    </div>
  );
}

