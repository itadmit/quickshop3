/**
 * Customizer Module - Section Settings Panel
 * פאנל עריכת הגדרות סקשן
 */

'use client';

import { useState, useEffect, useRef } from 'react';
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
  initialBlocks?: any[]; // בלוקים שכבר נטענו
  onClose: () => void;
  onUpdate: () => void;
}

export function SectionSettings({ section, initialBlocks, onClose, onUpdate }: SectionSettingsProps) {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [customCSS, setCustomCSS] = useState('');
  const [customClasses, setCustomClasses] = useState('');
  const [blocks, setBlocks] = useState<SectionBlock[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [saving, setSaving] = useState(false);
  const [blocksLoaded, setBlocksLoaded] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (section) {
      setSettings(section.settings_json || {});
      setCustomCSS(section.custom_css || '');
      setCustomClasses(section.custom_classes || '');
      
      // אם יש initialBlocks, השתמש בהם מיד (לא חוסם)
      if (initialBlocks && initialBlocks.length > 0) {
        setBlocks(initialBlocks as SectionBlock[]);
        setBlocksLoaded(true);
        setLoadingBlocks(false);
        // טען id נכון מה-API ברקע (לא חוסם את ה-UI)
        loadBlocksInBackground();
      } else {
        // אחרת טען מה-API
        loadBlocks();
      }
    }
  }, [section?.id]); // רק כשהסקשן משתנה

  async function loadBlocks() {
    if (!section?.id) return;
    
    try {
      setLoadingBlocks(true);
      const response = await fetch(`/api/customizer/sections/${section.id}/blocks`);
      if (response.ok) {
        const data = await response.json();
        setBlocks(data.blocks || []);
        setBlocksLoaded(true);
      }
    } catch (error) {
      console.error('Error loading blocks:', error);
      setBlocks([]);
    } finally {
      setLoadingBlocks(false);
    }
  }
  
  // טעינה ברקע - לא חוסמת את ה-UI
  async function loadBlocksInBackground() {
    if (!section?.id) return;
    
    try {
      const response = await fetch(`/api/customizer/sections/${section.id}/blocks`);
      if (response.ok) {
        const data = await response.json();
        // עדכן רק את ה-id של הבלוקים (אם צריך)
        setBlocks((prevBlocks) => {
          if (prevBlocks.length === data.blocks.length) {
            return data.blocks; // עדכן עם id נכון
          }
          return prevBlocks; // השאר את הקודמים
        });
      }
    } catch (error) {
      console.error('Error loading blocks in background:', error);
      // לא משנה כלום - נשארים עם initialBlocks
    }
  }
  
  // רענון בלוקים אחרי עדכון
  const refreshBlocks = async () => {
    if (section?.id) {
      await loadBlocks();
    }
  };

  if (!section) {
    return null;
  }

  // שמירה אוטומטית כשסוגרים את הפאנל
  const handleClose = () => {
    // שמור את השינויים לפני סגירה
    if (section) {
      updateSection({
        section_id: section.id,
        settings,
        custom_css: customCSS,
        custom_classes: customClasses,
      }).then((result) => {
        if (result.success && window.parent) {
          window.parent.postMessage({
            type: 'section-updated',
            sectionId: section.section_id,
            settings,
          }, '*');
        }
        onUpdate();
        onClose();
      }).catch(err => {
        console.error('Auto-save error:', err);
        onClose(); // סגור גם אם יש שגיאה
      });
    } else {
      onClose();
    }
  };

  function updateSetting(key: string, value: any) {
    const newSettings = {
      ...settings,
      [key]: value,
    };
    setSettings(newSettings);
    
    // עדכון בזמן אמת לתצוגה מקדימה (debounced)
    if (section && window.parent) {
      // נקה timeout קודם
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      // שלח עדכון לתצוגה מקדימה אחרי debounce
      updateTimeoutRef.current = setTimeout(() => {
        window.parent?.postMessage({
          type: 'section-settings-changed',
          sectionId: section.section_id,
          settings: newSettings,
        }, '*');
      }, 300); // debounce של 300ms
    }
  }

  return (
    <div className="h-full flex flex-col bg-white shadow-lg border-r border-gray-200" dir="rtl">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white sticky top-0 z-10">
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-700 transition-colors"
          title="סגור"
        >
          <HiX className="w-5 h-5" />
        </button>
        <div className="text-right">
          <h3 className="text-lg font-semibold text-gray-900">
            {getSectionName(section.section_type)}
          </h3>
          <p className="text-sm text-gray-500">עריכת הגדרות סקשן</p>
        </div>
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
                        ? 'bg-white text-green-600 shadow-sm'
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
                        ? 'bg-white text-green-600 shadow-sm'
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
                        ? 'bg-white text-green-600 shadow-sm'
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
                sectionIdString={section.section_id}
                blocks={blocks}
                sectionType={section.section_type}
                onBlocksChange={() => {
                  refreshBlocks();
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
      <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0 z-10">
        <button
          onClick={handleClose}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
        >
          סגור
        </button>
      </div>
    </div>
  );
}

