/**
 * Customizer Module - Section Settings Panel
 * פאנל עריכת הגדרות סקשן
 */

'use client';

import { useState, useEffect } from 'react';
import { updateSection } from '../actions';
import { PageSection, SectionBlock } from '@/lib/customizer/types';
import { BlockManagement } from './BlockManagement';
import { HiX, HiArrowRight, HiArrowLeft, HiMenuAlt2 } from 'react-icons/hi';
import { getSectionName } from '@/lib/customizer/sectionNames';
import {
  SettingGroup,
  SettingRow,
  ModernInput,
  ModernTextArea,
  ModernSelect,
  ModernToggle,
  ModernSlider,
  ModernColorPicker
} from './SettingsUI';

interface SectionSettingsProps {
  section: PageSection | null;
  onClose: () => void;
  onUpdate: () => void;
}

export function SectionSettings({ section, onClose, onUpdate }: SectionSettingsProps) {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [customCSS, setCustomCSS] = useState('');
  const [customClasses, setCustomClasses] = useState('');
  const [blocks, setBlocks] = useState<SectionBlock[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (section) {
      setSettings(section.settings_json || {});
      setCustomCSS(section.custom_css || '');
      setCustomClasses(section.custom_classes || '');
      loadBlocks();
    }
  }, [section]);

  async function loadBlocks() {
    if (!section?.id) return;
    
    try {
      setLoadingBlocks(true);
      const response = await fetch(`/api/customizer/sections/${section.id}/blocks`);
      if (response.ok) {
        const data = await response.json();
        setBlocks(data.blocks || []);
      }
    } catch (error) {
      console.error('Error loading blocks:', error);
      setBlocks([]);
    } finally {
      setLoadingBlocks(false);
    }
  }

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
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white sticky top-0 z-10">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {getSectionName(section.section_type)}
          </h3>
          <p className="text-sm text-gray-500">עריכת הגדרות סקשן</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-700 transition-colors"
          title="סגור"
        >
          <HiX className="w-5 h-5" />
        </button>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="divide-y divide-gray-200 bg-white">
          
          {/* Basic Settings Group */}
          <SettingGroup title="הגדרות בסיסיות">
            {/* Heading */}
            {(section.section_type.includes('collection') || section.section_type.includes('featured')) && (
              <SettingRow label="כותרת">
                <ModernInput
                  type="text"
                  value={settings.heading || ''}
                  onChange={(e) => updateSetting('heading', e.target.value)}
                  placeholder="הכנס כותרת"
                />
              </SettingRow>
            )}

            {/* Subheading */}
            {(section.section_type.includes('collection') || section.section_type.includes('featured')) && (
              <SettingRow label="תת כותרת">
                <ModernInput
                  type="text"
                  value={settings.subheading || ''}
                  onChange={(e) => updateSetting('subheading', e.target.value)}
                  placeholder="הכנס תת כותרת"
                />
              </SettingRow>
            )}

            {/* Text Alignment - Custom Segmented Control */}
            {(section.section_type.includes('text') || section.section_type.includes('collection')) && (
              <SettingRow label="יישור טקסט">
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => updateSetting('text_alignment', 'right')}
                    className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${
                      settings.text_alignment === 'right'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <HiArrowRight className="w-4 h-4" />
                      <span>ימין</span>
                    </div>
                  </button>
                  <button
                    onClick={() => updateSetting('text_alignment', 'center')}
                    className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${
                      settings.text_alignment === 'center'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <HiMenuAlt2 className="w-4 h-4 transform rotate-90" />
                      <span>מרכז</span>
                    </div>
                  </button>
                  <button
                    onClick={() => updateSetting('text_alignment', 'left')}
                    className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${
                      settings.text_alignment === 'left'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <HiArrowLeft className="w-4 h-4" />
                      <span>שמאל</span>
                    </div>
                  </button>
                </div>
              </SettingRow>
            )}
          </SettingGroup>

          {/* Layout Settings Group */}
          {(section.section_type.includes('collection') || section.section_type.includes('grid')) && (
            <SettingGroup title="הגדרות פריסה">
              <SettingRow label="סוג קונטיינר">
                <ModernSelect
                  value={settings.container_type || 'container_box'}
                  onChange={(e) => updateSetting('container_type', e.target.value)}
                  options={[
                    { value: 'container_box', label: 'קונטיינר מוגבל' },
                    { value: 'full_width', label: 'רוחב מלא' }
                  ]}
                />
              </SettingRow>

              <SettingRow label="צבע רקע">
                <ModernColorPicker
                  value={settings.background_color || '#FFFFFF'}
                  onChange={(value) => updateSetting('background_color', value)}
                />
              </SettingRow>

              <SettingRow label="עמודות בשורה">
                <ModernSlider
                  min={1}
                  max={6}
                  value={settings.collections_per_row || settings.columns_per_row || 3}
                  onChange={(value) => updateSetting(
                    section.section_type.includes('collection') ? 'collections_per_row' : 'columns_per_row',
                    value
                  )}
                />
              </SettingRow>
            </SettingGroup>
          )}

          {/* Slider Settings Group */}
          {(section.section_type.includes('slideshow') || section.section_type.includes('slider')) && (
            <SettingGroup title="הגדרות סליידר">
              <SettingRow>
                <ModernToggle
                  checked={settings.auto_rotate || settings.auto_slide || false}
                  onChange={(checked) => updateSetting(
                    section.section_type === 'slideshow' ? 'auto_rotate' : 'auto_slide',
                    checked
                  )}
                  label="סיבוב אוטומטי"
                />
              </SettingRow>

              {(settings.auto_rotate || settings.auto_slide) && (
                <SettingRow label="מרווח זמן (שניות)">
                  <ModernSlider
                    min={2}
                    max={10}
                    value={settings.auto_rotate_interval || settings.auto_slide_interval || 5}
                    onChange={(value) => updateSetting(
                      section.section_type === 'slideshow' ? 'auto_rotate_interval' : 'auto_slide_interval',
                      value
                    )}
                    unit="שניות"
                  />
                </SettingRow>
              )}

              <SettingRow>
                <ModernToggle
                  checked={settings.show_pagination !== false}
                  onChange={(checked) => updateSetting('show_pagination', checked)}
                  label="הצג נקודות ניווט"
                />
              </SettingRow>

              <SettingRow>
                <ModernToggle
                  checked={settings.show_navigation || false}
                  onChange={(checked) => updateSetting('show_navigation', checked)}
                  label="הצג כפתורי ניווט"
                />
              </SettingRow>
            </SettingGroup>
          )}

          {/* Block Management Group */}
          <SettingGroup title="ניהול בלוקים" defaultOpen={true}>
            {loadingBlocks ? (
              <div className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg">טוען בלוקים...</div>
            ) : (
              <BlockManagement
                sectionId={section.id}
                blocks={blocks}
                sectionType={section.section_type}
                onBlocksChange={() => {
                  loadBlocks();
                  onUpdate();
                }}
              />
            )}
          </SettingGroup>

          {/* Advanced Settings Group */}
          <SettingGroup title="מתקדם" defaultOpen={false}>
            <SettingRow label="CSS מותאם" helpText="הוסף CSS מותאם אישית לסקשן זה בלבד.">
              <ModernTextArea
                value={customCSS}
                onChange={(e) => setCustomCSS(e.target.value)}
                rows={6}
                className="font-mono text-xs"
                placeholder=".my-custom-class { ... }"
              />
            </SettingRow>

            <SettingRow label="Classes מותאמים" helpText="הפרד מחלקות באמצעות רווחים.">
              <ModernInput
                type="text"
                value={customClasses}
                onChange={(e) => setCustomClasses(e.target.value)}
                placeholder="class1 class2 class3"
              />
            </SettingRow>
          </SettingGroup>

        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 flex gap-3 bg-white sticky bottom-0 z-10">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
        >
          ביטול
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'שומר...' : 'שמור'}
        </button>
      </div>
    </div>
  );
}

