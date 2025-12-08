'use client';

import React, { useState } from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { SettingGroup } from '../ui/SettingGroup';
import { SettingInput } from '../ui/SettingInput';
import { SettingSelect } from '../ui/SettingSelect';
import { MediaPicker } from '@/components/MediaPicker';
import { HiPhotograph, HiVideoCamera, HiTrash, HiRefresh } from 'react-icons/hi';
import { useStoreId } from '@/hooks/useStoreId';
import { DeviceType } from '../Header';

interface SettingsPanelProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
  device: DeviceType;
}

export function SettingsPanel({ section, onUpdate, device }: SettingsPanelProps) {
  const storeId = useStoreId();
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');

  // Helper to get value based on device
  const getValue = (key: string, defaultValue: any = '') => {
    // If desktop, return direct settings
    if (device === 'desktop') {
      return section.settings?.[key] ?? defaultValue;
    }

    // If mobile/tablet, try to get from responsive settings first
    // Note: TypeScript might complain about indexing 'responsive', we need to ensure type definition supports it or cast
    const responsiveSettings = (section as any).responsive?.[device]?.settings;
    if (responsiveSettings && responsiveSettings[key] !== undefined) {
      return responsiveSettings[key];
    }

    // Fallback to desktop settings
    return section.settings?.[key] ?? defaultValue;
  };

  // Helper to check if value is overridden in current device
  const isOverridden = (key: string) => {
    if (device === 'desktop') return false;
    const responsiveSettings = (section as any).responsive?.[device]?.settings;
    return responsiveSettings && responsiveSettings[key] !== undefined;
  };

  const handleSettingChange = (key: string, value: any) => {
    if (device === 'desktop') {
      onUpdate({
        settings: {
          ...section.settings,
          [key]: value
        }
      });
    } else {
      // Update responsive settings
      const currentResponsive = (section as any).responsive || {};
      const deviceResponsive = currentResponsive[device] || {};
      const deviceSettings = deviceResponsive.settings || {};

      onUpdate({
        responsive: {
          ...currentResponsive,
          [device]: {
            ...deviceResponsive,
            settings: {
              ...deviceSettings,
              [key]: value
            }
          }
        }
      } as any);
    }
  };

  const handleStyleChange = (path: string, value: any) => {
      // For now style handling remains on desktop/base only in this implementation for simplicity unless requested
      // But typically style should also be responsive.
      // The user specifically asked about "Each field has a different value in mobile", referring mainly to settings inputs I presume.
      // Let's keep style simple for now or apply same logic if needed.
      
      const keys = path.split('.');
      const style = { ...(section.style || {}) };
      let current: any = style;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      onUpdate({ style });
  };

  const handleMediaSelect = (files: string[]) => {
    if (files.length > 0) {
      if (mediaType === 'image') {
        handleStyleChange('background.background_image', files[0]);
        handleStyleChange('background.background_video', '');
      } else {
        handleStyleChange('background.background_video', files[0]);
        handleStyleChange('background.background_image', '');
      }
    }
    setIsMediaPickerOpen(false);
  };

  const handleReset = () => {
    if (confirm('האם אתה בטוח שברצונך לאפס את הגדרות הסקשן?')) {
        onUpdate({
            settings: {},
            style: {}
        });
    }
  };

  const renderInput = (label: string, key: string, placeholder?: string, type: 'text' | 'number' = 'text', description?: string, dir?: 'rtl' | 'ltr') => (
    <div className="relative">
       <SettingInput
          label={label}
          value={getValue(key)}
          onChange={(e) => handleSettingChange(key, type === 'number' ? Number(e.target.value) : e.target.value)}
          placeholder={placeholder}
          dir={dir}
          description={description}
        />
        {isOverridden(key) && (
          <div className="absolute top-0 left-0 w-2 h-2 bg-green-500 rounded-full" title="מוגדר ספציפית למכשיר זה" />
        )}
    </div>
  );

   const renderSelect = (label: string, key: string, options: { label: string; value: any }[]) => (
    <div className="relative">
       <SettingSelect
          label={label}
          value={getValue(key)}
          onChange={(e) => handleSettingChange(key, e.target.value)}
          options={options}
        />
        {isOverridden(key) && (
          <div className="absolute top-0 left-0 w-2 h-2 bg-green-500 rounded-full" title="מוגדר ספציפית למכשיר זה" />
        )}
    </div>
  );


  const renderSettingsForType = () => {
    switch (section.type) {
      case 'hero_banner':
        return (
          <div className="space-y-1">
            <SettingGroup title="מדיה ורקע">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => {
                                setMediaType('image');
                                setIsMediaPickerOpen(true);
                            }}
                            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all gap-2"
                        >
                            <HiPhotograph className="w-6 h-6 text-gray-400" />
                            <span className="text-xs font-medium text-gray-700">תמונת רקע</span>
                        </button>
                        <button
                             onClick={() => {
                                setMediaType('video');
                                setIsMediaPickerOpen(true);
                            }}
                            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all gap-2"
                        >
                            <HiVideoCamera className="w-6 h-6 text-gray-400" />
                            <span className="text-xs font-medium text-gray-700">וידאו רקע</span>
                        </button>
                    </div>

                    {/* Preview Selected Media */}
                    {(section.style?.background?.background_image || section.style?.background?.background_video) && (
                        <div className="space-y-4">
                            <div className="relative rounded-lg overflow-hidden border border-gray-200 aspect-video group">
                                {section.style?.background?.background_video ? (
                                    <video 
                                        src={section.style.background.background_video} 
                                        className="w-full h-full object-cover"
                                        autoPlay
                                        muted
                                        loop
                                    />
                                ) : (
                                    <img 
                                        src={section.style?.background?.background_image} 
                                        alt="Background" 
                                        className="w-full h-full object-cover"
                                    />
                                )}
                                <button
                                    onClick={() => {
                                        handleStyleChange('background.background_image', '');
                                        handleStyleChange('background.background_video', '');
                                    }}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="הסר רקע"
                                >
                                    <HiTrash className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Image Settings */}
                            {section.style?.background?.background_image && (
                                <>
                                    <SettingSelect
                                        label="גודל תמונה"
                                        value={section.style?.background?.background_size || 'cover'}
                                        onChange={(e) => handleStyleChange('background.background_size', e.target.value)}
                                        options={[
                                            { label: 'כיסוי (Cover)', value: 'cover' },
                                            { label: 'הכל (Contain)', value: 'contain' },
                                            { label: 'אוטומטי', value: 'auto' },
                                            { label: 'מתיחה (100%)', value: '100% 100%' },
                                        ]}
                                    />
                                    <SettingSelect
                                        label="מיקום תמונה"
                                        value={section.style?.background?.background_position || 'center'}
                                        onChange={(e) => handleStyleChange('background.background_position', e.target.value)}
                                        options={[
                                            { label: 'מרכז', value: 'center' },
                                            { label: 'למעלה', value: 'top' },
                                            { label: 'למטה', value: 'bottom' },
                                            { label: 'שמאל', value: 'left' },
                                            { label: 'ימין', value: 'right' },
                                            { label: 'למעלה שמאל', value: 'top left' },
                                            { label: 'למעלה ימין', value: 'top right' },
                                            { label: 'למטה שמאל', value: 'bottom left' },
                                            { label: 'למטה ימין', value: 'bottom right' },
                                        ]}
                                    />
                                    <SettingSelect
                                        label="חזרה"
                                        value={section.style?.background?.background_repeat || 'no-repeat'}
                                        onChange={(e) => handleStyleChange('background.background_repeat', e.target.value)}
                                        options={[
                                            { label: 'ללא חזרה', value: 'no-repeat' },
                                            { label: 'חזרה', value: 'repeat' },
                                            { label: 'חזרה אופקית', value: 'repeat-x' },
                                            { label: 'חזרה אנכית', value: 'repeat-y' },
                                        ]}
                                    />
                                </>
                            )}

                            {/* Video Settings */}
                            {section.style?.background?.background_video && (
                                <>
                                    <SettingSelect
                                        label="הפעלה אוטומטית"
                                        value={section.style?.background?.video_autoplay !== false ? 'true' : 'false'}
                                        onChange={(e) => handleStyleChange('background.video_autoplay', e.target.value === 'true')}
                                        options={[
                                            { label: 'מופעל', value: 'true' },
                                            { label: 'כבוי', value: 'false' },
                                        ]}
                                    />
                                    <SettingSelect
                                        label="השתק"
                                        value={section.style?.background?.video_muted !== false ? 'true' : 'false'}
                                        onChange={(e) => handleStyleChange('background.video_muted', e.target.value === 'true')}
                                        options={[
                                            { label: 'מושתק', value: 'true' },
                                            { label: 'עם קול', value: 'false' },
                                        ]}
                                    />
                                    <SettingSelect
                                        label="לולאה"
                                        value={section.style?.background?.video_loop !== false ? 'true' : 'false'}
                                        onChange={(e) => handleStyleChange('background.video_loop', e.target.value === 'true')}
                                        options={[
                                            { label: 'מופעל', value: 'true' },
                                            { label: 'כבוי', value: 'false' },
                                        ]}
                                    />
                                    <SettingSelect
                                        label="התאמת גודל וידאו"
                                        value={section.style?.background?.video_object_fit || 'cover'}
                                        onChange={(e) => handleStyleChange('background.video_object_fit', e.target.value)}
                                        options={[
                                            { label: 'כיסוי (Cover)', value: 'cover' },
                                            { label: 'הכל (Contain)', value: 'contain' },
                                            { label: 'מילוי (Fill)', value: 'fill' },
                                        ]}
                                    />
                                </>
                            )}
                        </div>
                    )}
                </div>
            </SettingGroup>

            <SettingGroup title="תוכן">
              <div className="space-y-4">
                {renderInput('כותרת ראשית', 'heading', 'הכנס כותרת...')}
                {renderInput('תת כותרת', 'subheading', 'הכנס תת כותרת...')}
              </div>
            </SettingGroup>

            <SettingGroup title="כפתור">
              <div className="space-y-4">
                {renderInput('טקסט כפתור', 'button_text', 'קנה עכשיו')}
                {renderInput('קישור', 'button_url', '/collections/all', 'text', undefined, 'ltr')}
              </div>
            </SettingGroup>

            <SettingGroup title="פריסה">
               <div className="space-y-4">
                {renderSelect('גובה הסקשן', 'height', [
                    { label: 'קטן (40vh)', value: 'small' },
                    { label: 'בינוני (60vh)', value: 'medium' },
                    { label: 'גדול (80vh)', value: 'large' },
                    { label: 'מסך מלא (100vh)', value: 'full_screen' },
                ])}
                {renderSelect('מיקום תוכן אנכי', 'content_position_vertical', [
                    { label: 'למעלה', value: 'top' },
                    { label: 'מרכז', value: 'center' },
                    { label: 'למטה', value: 'bottom' },
                ])}
                {renderSelect('מיקום תוכן אופקי', 'content_position_horizontal', [
                    { label: 'ימין', value: 'right' },
                    { label: 'מרכז', value: 'center' },
                    { label: 'שמאל', value: 'left' },
                ])}
                {renderSelect('יישור טקסט', 'text_align', [
                    { label: 'ימין', value: 'left' },
                    { label: 'מרכז', value: 'center' },
                    { label: 'שמאל', value: 'right' },
                ])}
              </div>
            </SettingGroup>
          </div>
        );

      case 'featured_products':
        return (
          <div className="space-y-1">
             <SettingGroup title="כללי">
                <div className="space-y-4">
                  {renderInput('כותרת הסקשן', 'title', 'מוצרים מומלצים')}
                  {renderSelect('מספר מוצרים בשורה', 'items_per_row', [
                      { label: '2 מוצרים', value: 2 },
                      { label: '3 מוצרים', value: 3 },
                      { label: '4 מוצרים', value: 4 },
                      { label: '5 מוצרים', value: 5 },
                  ])}
                </div>
            </SettingGroup>
             <SettingGroup title="תצוגה">
                <div className="space-y-4">
                   {renderSelect('הצג דירוג', 'show_rating', [
                      { label: 'כן', value: true },
                      { label: 'לא', value: false },
                    ])}
                   {renderSelect('הצג מחיר', 'show_price', [
                      { label: 'כן', value: true },
                      { label: 'לא', value: false },
                    ])}
                   {renderSelect('הצג תגיות', 'show_badges', [
                      { label: 'כן', value: true },
                      { label: 'לא', value: false },
                    ])}
                </div>
             </SettingGroup>
          </div>
        );

      default:
        return (
          <div className="text-center text-gray-500 py-8">
            <p>הגדרות עבור סקשן זה יהיו זמינות בקרוב</p>
          </div>
        );
    }
  };

  return (
    <div className="pb-8">
      {renderSettingsForType()}

      {/* Advanced Settings */}
      <SettingGroup title="מתקדם" defaultOpen={false}>
         <div className="space-y-4">
            {renderInput('מזהה סקשן (ID)', 'custom_id', 'my-section', 'text', 'משמש לקישורים פנימיים ו-CSS', 'ltr')}
            {renderInput('מחלקת CSS (Class)', 'custom_css_class', 'my-custom-class', 'text', undefined, 'ltr')}
         </div>
      </SettingGroup>

      {/* Reset Button */}
      <div className="px-1 mt-8 border-t border-gray-100 pt-6">
          <button 
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <HiRefresh className="w-4 h-4" />
            אפס הגדרות סקשן
          </button>
      </div>

      <MediaPicker
        open={isMediaPickerOpen}
        onOpenChange={setIsMediaPickerOpen}
        onSelect={handleMediaSelect}
        shopId={storeId || undefined}
        title={mediaType === 'image' ? 'בחר תמונה' : 'בחר וידאו'}
        multiple={false}
      />
    </div>
  );
}
