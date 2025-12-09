'use client';

import React, { useState } from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { SettingGroup } from '../ui/SettingGroup';
import { SettingInput } from '../ui/SettingInput';
import { SettingSelect } from '../ui/SettingSelect';
import { MediaPicker } from '@/components/MediaPicker';
import { HiPhotograph, HiVideoCamera, HiTrash, HiRefresh, HiPlus } from 'react-icons/hi';
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
  const [targetBlockId, setTargetBlockId] = useState<string | null>(null);
  const [imageDeviceTarget, setImageDeviceTarget] = useState<'desktop' | 'mobile'>('desktop'); // For desktop/mobile image selection

  // Helper to get value based on device
  const getValue = (key: string, defaultValue: any = '') => {
    // If desktop, return direct settings
    if (device === 'desktop') {
      return section.settings?.[key] ?? defaultValue;
    }

    // If mobile/tablet, try to get from responsive settings first
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
      if ((window as any).__videoSelect) {
          (window as any).__videoSelect(files[0]);
          (window as any).__videoSelect = null;
      } else if (targetBlockId === 'header-logo') {
          // Update header logo
          handleSettingChange('logo', { 
            ...section.settings?.logo, 
            image_url: files[0] 
          });
          setTargetBlockId(null);
      } else if (targetBlockId) {
          // Update specific block - support desktop/mobile images
          const newBlocks = [...(section.blocks || [])];
          const blockIndex = newBlocks.findIndex(b => b.id === targetBlockId);
          if (blockIndex >= 0) {
              const imageKey = imageDeviceTarget === 'mobile' ? 'image_url_mobile' : 'image_url';
              newBlocks[blockIndex] = {
                  ...newBlocks[blockIndex],
                  content: {
                      ...newBlocks[blockIndex].content,
                      [imageKey]: files[0]
                  }
              };
              onUpdate({ blocks: newBlocks });
          }
          setTargetBlockId(null);
      } else if (section.type === 'gallery' && (window as any).__galleryAddImage) {
          // Add images to gallery
          files.forEach(file => {
              (window as any).__galleryAddImage(file);
          });
          (window as any).__galleryAddImage = null;
      } else if (section.type === 'slideshow' && (window as any).__slideshowAddImage) {
          // Add slide to slideshow
          files.forEach(file => {
              (window as any).__slideshowAddImage(file);
          });
          (window as any).__slideshowAddImage = null;
      } else {
        // Update section background - support desktop/mobile images
        if (mediaType === 'image') {
            const imageKey = imageDeviceTarget === 'mobile' ? 'background_image_mobile' : 'background_image';
            handleStyleChange(`background.${imageKey}`, files[0]);
            handleStyleChange('background.background_video', '');
        } else {
            handleStyleChange('background.background_video', files[0]);
            handleStyleChange('background.background_image', '');
            handleStyleChange('background.background_image_mobile', '');
        }
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

   const renderSelect = (label: string, key: string, options: { label: string; value: any }[]) => {
     const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
       const selectedOption = options.find(opt => String(opt.value) === e.target.value);
       const value = selectedOption ? selectedOption.value : e.target.value;
       handleSettingChange(key, value);
     };
     
     return (
       <div className="relative">
          <SettingSelect
             label={label}
             value={String(getValue(key) ?? '')}
             onChange={handleChange}
             options={options}
           />
           {isOverridden(key) && (
             <div className="absolute top-0 left-0 w-2 h-2 bg-green-500 rounded-full" title="מוגדר ספציפית למכשיר זה" />
           )}
       </div>
     );
   };


  const renderSettingsForType = () => {
    switch (section.type) {
      case 'header':
        return (
          <div className="space-y-1">
            <SettingGroup title="פריסה">
              <div className="space-y-4">
                {renderSelect('סגנון פריסה', 'layout_style', [
                  { label: 'לוגו בימין - תפריט במרכז - אייקונים משמאל', value: 'logo_right_menu_center' },
                  { label: 'תפריט בימין - לוגו במרכז - אייקונים משמאל', value: 'menu_right_logo_center' },
                  { label: 'לוגו בשמאל - תפריט במרכז - אייקונים בימין', value: 'logo_left_menu_center' },
                  { label: 'לוגו במרכז - תפריט מתחת', value: 'logo_center_menu_below' },
                ])}
                {renderSelect('הצג חיפוש', 'search.enabled', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                {renderSelect('הצג עגלה', 'cart.enabled', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                {renderSelect('הצג חשבון משתמש', 'user_account.enabled', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
              </div>
            </SettingGroup>

            <SettingGroup title="לוגו">
              <div className="space-y-4">
                {/* Logo Image Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">תמונת לוגו</label>
                  {getValue('logo.image_url') ? (
                    <div className="relative group">
                      <img 
                        src={getValue('logo.image_url')} 
                        alt="לוגו" 
                        className="w-full h-20 object-contain bg-gray-100 rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setMediaType('image');
                            setTargetBlockId('header-logo');
                            setIsMediaPickerOpen(true);
                          }}
                          className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                          title="החלף תמונה"
                        >
                          <HiRefresh className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSettingChange('logo', { ...section.settings?.logo, image_url: null })}
                          className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50"
                          title="הסר תמונה"
                        >
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setMediaType('image');
                        setTargetBlockId('header-logo');
                        setIsMediaPickerOpen(true);
                      }}
                      className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center gap-2"
                    >
                      <HiPhotograph className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-600">העלה לוגו</span>
                    </button>
                  )}
                </div>

                {renderInput('טקסט לוגו (אם אין תמונה)', 'logo.text', 'שם החנות')}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">גובה לוגו - דסקטופ</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={parseInt(getValue('logo.height_desktop', '40'))}
                        onChange={(e) => handleSettingChange('logo', { 
                          ...section.settings?.logo, 
                          height_desktop: `${e.target.value}px` 
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        min={20}
                        max={120}
                      />
                      <span className="text-xs text-gray-400">px</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">גובה לוגו - מובייל</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={parseInt(getValue('logo.height_mobile', '32'))}
                        onChange={(e) => handleSettingChange('logo', { 
                          ...section.settings?.logo, 
                          height_mobile: `${e.target.value}px` 
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        min={16}
                        max={80}
                      />
                      <span className="text-xs text-gray-400">px</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">מרווח לוגו - דסקטופ</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={parseInt(getValue('logo.padding_desktop', '0'))}
                        onChange={(e) => handleSettingChange('logo', { 
                          ...section.settings?.logo, 
                          padding_desktop: `${e.target.value}px` 
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        min={0}
                        max={40}
                      />
                      <span className="text-xs text-gray-400">px</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">מרווח לוגו - מובייל</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={parseInt(getValue('logo.padding_mobile', '0'))}
                        onChange={(e) => handleSettingChange('logo', { 
                          ...section.settings?.logo, 
                          padding_mobile: `${e.target.value}px` 
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        min={0}
                        max={40}
                      />
                      <span className="text-xs text-gray-400">px</span>
                    </div>
                  </div>
                </div>
              </div>
            </SettingGroup>

            <SettingGroup title="תפריט ניווט">
              <div className="space-y-4">
                {renderSelect('גודל פונט תפריט', 'navigation.font_size', [
                  { label: 'קטן', value: 'small' },
                  { label: 'רגיל', value: 'medium' },
                  { label: 'גדול', value: 'large' },
                ])}
                {renderSelect('משקל פונט', 'navigation.font_weight', [
                  { label: 'רגיל', value: 'normal' },
                  { label: 'בינוני', value: 'medium' },
                  { label: 'מודגש', value: 'bold' },
                ])}
                {renderInput('מרווח בין פריטים', 'navigation.gap', '24', 'number')}
              </div>
            </SettingGroup>

            <SettingGroup title="הדר דביק (Sticky)">
              <div className="space-y-4">
                {renderSelect('הדר דביק', 'sticky.enabled', [
                  { label: 'כן - נשאר למעלה בגלילה', value: true },
                  { label: 'לא - נגלל עם העמוד', value: false },
                ])}
                {getValue('sticky.enabled', true) && renderSelect('אפקט בגלילה', 'sticky.shrink', [
                  { label: 'ללא', value: 'none' },
                  { label: 'הקטנה', value: 'shrink' },
                  { label: 'צל', value: 'shadow' },
                ])}
              </div>
            </SettingGroup>
          </div>
        );

      case 'hero_banner':
        return (
          <div className="space-y-1">
            <SettingGroup title="מדיה ורקע">
                <div className="space-y-4">
                    {/* Desktop & Mobile Image Buttons */}
                    <div className="space-y-3">
                        <p className="text-xs text-gray-500 font-medium">תמונות רקע</p>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => {
                                    setMediaType('image');
                                    setImageDeviceTarget('desktop');
                                    setTargetBlockId(null);
                                    setIsMediaPickerOpen(true);
                                }}
                                className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all gap-1.5"
                            >
                                <HiPhotograph className="w-5 h-5 text-gray-400" />
                                <span className="text-xs font-medium text-gray-700">תמונת דסקטופ</span>
                            </button>
                            <button
                                onClick={() => {
                                    setMediaType('image');
                                    setImageDeviceTarget('mobile');
                                    setTargetBlockId(null);
                                    setIsMediaPickerOpen(true);
                                }}
                                className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all gap-1.5"
                            >
                                <HiPhotograph className="w-5 h-5 text-gray-400" />
                                <span className="text-xs font-medium text-gray-700">תמונת מובייל</span>
                            </button>
                        </div>
                        
                        {/* Video Button */}
                        <button
                             onClick={() => {
                                setMediaType('video');
                                setTargetBlockId(null);
                                setIsMediaPickerOpen(true);
                            }}
                            className="w-full flex flex-col items-center justify-center p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all gap-1.5"
                        >
                            <HiVideoCamera className="w-5 h-5 text-gray-400" />
                            <span className="text-xs font-medium text-gray-700">וידאו רקע</span>
                        </button>
                    </div>

                    {/* Preview Desktop Image */}
                    {section.style?.background?.background_image && (
                        <div className="space-y-2">
                            <p className="text-xs text-gray-500 font-medium">תמונת דסקטופ</p>
                            <div className="relative rounded-lg overflow-hidden border border-gray-200 aspect-video group">
                                <img 
                                    src={section.style.background.background_image} 
                                    alt="Desktop Background" 
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    onClick={() => handleStyleChange('background.background_image', '')}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="הסר תמונת דסקטופ"
                                >
                                    <HiTrash className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Preview Mobile Image */}
                    {section.style?.background?.background_image_mobile && (
                        <div className="space-y-2">
                            <p className="text-xs text-gray-500 font-medium">תמונת מובייל</p>
                            <div className="flex justify-center">
                                <div className="relative rounded-lg overflow-hidden border border-gray-200 w-20 h-32 group">
                                    <img 
                                        src={section.style.background.background_image_mobile} 
                                        alt="Mobile Background" 
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        onClick={() => handleStyleChange('background.background_image_mobile', '')}
                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="הסר תמונת מובייל"
                                    >
                                        <HiTrash className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Preview Video */}
                    {section.style?.background?.background_video && (
                        <div className="space-y-2">
                            <p className="text-xs text-gray-500 font-medium">וידאו רקע</p>
                            <div className="relative rounded-lg overflow-hidden border border-gray-200 aspect-video group">
                                <video 
                                    src={section.style.background.background_video} 
                                    className="w-full h-full object-cover"
                                    autoPlay
                                    muted
                                    loop
                                />
                                <button
                                    onClick={() => handleStyleChange('background.background_video', '')}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="הסר וידאו"
                                >
                                    <HiTrash className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Image/Video Settings */}
                    {(section.style?.background?.background_image || section.style?.background?.background_image_mobile || section.style?.background?.background_video) && (
                        <div className="space-y-4">

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
                  {renderSelect('יישור כותרת', 'title_align', [
                      { label: 'ימין', value: 'right' },
                      { label: 'מרכז', value: 'center' },
                      { label: 'שמאל', value: 'left' },
                  ])}
                  {renderSelect('מקור מוצרים', 'collection', [
                      { label: 'כל המוצרים', value: 'all' },
                      { label: 'קולקציית קיץ', value: 'summer' },
                      { label: 'מוצרים חדשים', value: 'new' },
                  ])}
                </div>
            </SettingGroup>
            <SettingGroup title="פריסה">
                <div className="space-y-4">
                  {renderSelect('מספר מוצרים בשורה (דסקטופ)', 'items_per_row', [
                      { label: '2 מוצרים', value: 2 },
                      { label: '3 מוצרים', value: 3 },
                      { label: '4 מוצרים', value: 4 },
                      { label: '5 מוצרים', value: 5 },
                  ])}
                  {renderSelect('מספר מוצרים בשורה (מובייל)', 'items_per_row_mobile', [
                      { label: '1 מוצר', value: 1 },
                      { label: '2 מוצרים', value: 2 },
                  ])}
                  {renderSelect('כמה מוצרים להציג (דסקטופ)', 'products_count', [
                      { label: '4 מוצרים', value: 4 },
                      { label: '6 מוצרים', value: 6 },
                      { label: '8 מוצרים', value: 8 },
                      { label: '10 מוצרים', value: 10 },
                      { label: '12 מוצרים', value: 12 },
                  ])}
                  {renderSelect('כמה מוצרים להציג (מובייל)', 'products_count_mobile', [
                      { label: '2 מוצרים', value: 2 },
                      { label: '4 מוצרים', value: 4 },
                      { label: '6 מוצרים', value: 6 },
                  ])}
                   {renderSelect('סוג תצוגה', 'display_type', [
                      { label: 'רשת (Grid)', value: 'grid' },
                      { label: 'קרוסלה (Carousel)', value: 'carousel' },
                   ])}
                </div>
            </SettingGroup>
             <SettingGroup title="כרטיס מוצר">
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
                    {renderSelect('יישור תוכן מוצר', 'content_align', [
                      { label: 'ימין', value: 'right' },
                      { label: 'מרכז', value: 'center' },
                      { label: 'שמאל', value: 'left' },
                    ])}
                </div>
             </SettingGroup>
             <SettingGroup title="קישור 'ראה עוד'">
                <div className="space-y-4">
                   {renderSelect('הצג קישור', 'show_view_all', [
                      { label: 'כן', value: true },
                      { label: 'לא', value: false },
                    ])}
                   {renderInput('טקסט הקישור', 'view_all_text', 'לכל המוצרים')}
                   {renderInput('כתובת הקישור', 'view_all_url', '/collections/all')}
                </div>
             </SettingGroup>
          </div>
        );

      case 'featured_collections':
        return (
            <div className="space-y-1">
                <SettingGroup title="כללי">
                    <div className="space-y-4">
                        {renderInput('כותרת הסקשן', 'title', 'קטגוריות פופולריות')}
                        {renderSelect('יישור כותרת', 'title_align', [
                            { label: 'ימין', value: 'right' },
                            { label: 'מרכז', value: 'center' },
                            { label: 'שמאל', value: 'left' },
                        ])}
                    </div>
                </SettingGroup>
                <SettingGroup title="פריסה">
                    <div className="space-y-4">
                        {renderSelect('מספר קטגוריות בשורה', 'items_per_row', [
                            { label: '2 קטגוריות', value: 2 },
                            { label: '3 קטגוריות', value: 3 },
                            { label: '4 קטגוריות', value: 4 },
                            { label: '5 קטגוריות', value: 5 },
                        ])}
                         {renderSelect('סוג תצוגה', 'display_type', [
                            { label: 'רשת (Grid)', value: 'grid' },
                            { label: 'קרוסלה (Carousel)', value: 'carousel' },
                        ])}
                        {renderSelect('יישור תוכן קטגוריה', 'content_align', [
                            { label: 'ימין', value: 'right' },
                            { label: 'מרכז', value: 'center' },
                            { label: 'שמאל', value: 'left' },
                        ])}
                    </div>
                </SettingGroup>
                <SettingGroup title="קישור 'ראה עוד'">
                    <div className="space-y-4">
                       {renderSelect('הצג קישור', 'show_view_all', [
                          { label: 'כן', value: true },
                          { label: 'לא', value: false },
                        ])}
                       {renderInput('טקסט הקישור', 'view_all_text', 'לכל הקטגוריות')}
                       {renderInput('כתובת הקישור', 'view_all_url', '/collections')}
                    </div>
                </SettingGroup>
            </div>
        );

      case 'image_with_text':
        // Find blocks
        const imageBlock = section.blocks?.find(b => b.type === 'image');
        const textBlock = section.blocks?.find(b => b.type === 'text');

        const updateBlockContent = (blockType: string, contentKey: string, value: any) => {
             const newBlocks = [...(section.blocks || [])];
             const blockIndex = newBlocks.findIndex(b => b.type === blockType);
             
             if (blockIndex >= 0) {
                 newBlocks[blockIndex] = {
                     ...newBlocks[blockIndex],
                     content: {
                         ...newBlocks[blockIndex].content,
                         [contentKey]: value
                     }
                 };
                 onUpdate({ blocks: newBlocks });
             }
        };
        
        const updateBlockStyle = (blockType: string, styleKey: string, value: any) => {
             const newBlocks = [...(section.blocks || [])];
             const blockIndex = newBlocks.findIndex(b => b.type === blockType);
             
             if (blockIndex >= 0) {
                 newBlocks[blockIndex] = {
                     ...newBlocks[blockIndex],
                     style: {
                         ...newBlocks[blockIndex].style,
                         [styleKey]: value
                     }
                 };
                 onUpdate({ blocks: newBlocks });
             }
        };

        return (
            <div className="space-y-1">
                <SettingGroup title="תמונה">
                    <div className="space-y-4">
                        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group">
                            {imageBlock?.content?.image_url ? (
                                <img 
                                    src={imageBlock.content.image_url} 
                                    alt="Selected" 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex items-center justify-center w-full h-full text-gray-400">
                                    <HiPhotograph className="w-8 h-8" />
                                </div>
                            )}
                            <button
                                onClick={() => {
                                    setMediaType('image');
                                    setTargetBlockId(imageBlock?.id || null);
                                    setIsMediaPickerOpen(true);
                                }}
                                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium"
                            >
                                החלף תמונה
                            </button>
                        </div>
                        {imageBlock?.content?.image_url && (
                             <button
                                onClick={() => updateBlockContent('image', 'image_url', '')}
                                className="text-red-600 text-sm hover:underline"
                            >
                                הסר תמונה
                            </button>
                        )}
                    </div>
                </SettingGroup>

                <SettingGroup title="תוכן טקסט">
                    <div className="space-y-4">
                        <SettingInput
                            label="כותרת"
                            value={textBlock?.content?.heading || ''}
                            onChange={(e) => updateBlockContent('text', 'heading', e.target.value)}
                        />
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">תוכן</label>
                            <textarea
                                className="w-full min-h-[100px] p-2 border border-gray-300 rounded-md text-sm"
                                value={textBlock?.content?.text || ''}
                                onChange={(e) => updateBlockContent('text', 'text', e.target.value)}
                            />
                        </div>
                         <SettingSelect
                            label="יישור טקסט"
                            value={textBlock?.style?.text_align || 'right'}
                            onChange={(e) => updateBlockStyle('text', 'text_align', e.target.value)}
                            options={[
                                { label: 'ימין', value: 'right' },
                                { label: 'מרכז', value: 'center' },
                                { label: 'שמאל', value: 'left' },
                            ]}
                        />
                    </div>
                </SettingGroup>

                <SettingGroup title="כפתור">
                    <div className="space-y-4">
                        <SettingInput
                            label="טקסט כפתור"
                            value={textBlock?.content?.button_text || ''}
                            onChange={(e) => updateBlockContent('text', 'button_text', e.target.value)}
                        />
                        <SettingInput
                            label="קישור"
                            value={textBlock?.content?.button_url || ''}
                            onChange={(e) => updateBlockContent('text', 'button_url', e.target.value)}
                            dir="ltr"
                        />
                    </div>
                </SettingGroup>

                <SettingGroup title="פריסה">
                    <div className="space-y-4">
                        {renderSelect('גובה הסקשן', 'height', [
                            { label: 'אוטומטי', value: 'auto' },
                            { label: 'מסך מלא', value: 'full_screen' },
                        ])}
                        {renderSelect('מיקום תמונה', 'layout', [
                            { label: 'תמונה מימין', value: 'image_right' },
                            { label: 'תמונה משמאל', value: 'image_left' },
                        ])}
                         {renderSelect('רוחב תמונה', 'image_width', [
                            { label: 'קטן (30%)', value: 'small' },
                            { label: 'בינוני (50%)', value: 'medium' },
                            { label: 'גדול (70%)', value: 'large' },
                        ])}
                    </div>
                </SettingGroup>
            </div>
        );
      
      case 'rich_text':
          return (
            <div className="space-y-1">
                <SettingGroup title="תוכן">
                     <div className="space-y-4">
                        <p className="text-sm text-gray-500">ערוך את הטקסט דרך רשימת הבלוקים בסרגל הצד</p>
                    </div>
                </SettingGroup>
                <SettingGroup title="פריסה">
                    <div className="space-y-4">
                        {renderSelect('יישור תוכן', 'content_align', [
                             { label: 'ימין', value: 'right' },
                             { label: 'מרכז', value: 'center' },
                             { label: 'שמאל', value: 'left' },
                        ])}
                        {renderSelect('רוחב תוכן', 'content_width', [
                             { label: 'צר', value: 'narrow' },
                             { label: 'רגיל', value: 'regular' },
                             { label: 'רחב', value: 'wide' },
                        ])}
                    </div>
                </SettingGroup>
            </div>
          );

      case 'newsletter':
          return (
            <div className="space-y-1">
                 <SettingGroup title="כללי">
                    <div className="space-y-4">
                        {renderSelect('גובה הסקשן', 'height', [
                            { label: 'קטן', value: 'small' },
                            { label: 'בינוני', value: 'medium' },
                            { label: 'גדול', value: 'large' },
                        ])}
                        {renderSelect('רוחב תוכן', 'content_width', [
                             { label: 'צר', value: 'narrow' },
                             { label: 'רגיל', value: 'regular' },
                        ])}
                    </div>
                </SettingGroup>
            </div>
          );

      case 'gallery':
          const galleryImageBlocks = section.blocks?.filter(b => b.type === 'image') || [];
          
          const addGalleryImage = (imageUrl: string) => {
              const newBlock = {
                  id: `gallery-image-${Date.now()}`,
                  type: 'image' as const,
                  content: {
                      image_url: imageUrl,
                      alt_text: ''
                  },
                  style: {},
                  settings: {}
              };
              onUpdate({
                  blocks: [...(section.blocks || []), newBlock]
              });
          };
          
          const removeGalleryImage = (blockId: string) => {
              const newBlocks = (section.blocks || []).filter(b => b.id !== blockId);
              onUpdate({ blocks: newBlocks });
          };
          
          return (
            <div className="space-y-1">
                <SettingGroup title="כללי">
                    <div className="space-y-4">
                        {renderInput('כותרת הסקשן', 'title', 'גלריה')}
                        {renderSelect('יישור כותרת', 'title_align', [
                            { label: 'ימין', value: 'right' },
                            { label: 'מרכז', value: 'center' },
                            { label: 'שמאל', value: 'left' },
                        ])}
                    </div>
                </SettingGroup>
                
                <SettingGroup title="תמונות">
                    <div className="space-y-4">
                        <button
                            onClick={() => {
                                setMediaType('image');
                                setTargetBlockId(null);
                                setIsMediaPickerOpen(true);
                                // Store callback to add images
                                (window as any).__galleryAddImage = addGalleryImage;
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-sm font-medium"
                        >
                            <HiPhotograph className="w-5 h-5" />
                            הוסף תמונות
                        </button>
                        
                        {galleryImageBlocks.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                                {galleryImageBlocks.map((block) => (
                                    <div key={block.id} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                                        {block.content?.image_url ? (
                                            <img src={block.content.image_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                                <HiPhotograph className="w-6 h-6 text-gray-400" />
                                            </div>
                                        )}
                                        <button
                                            onClick={() => removeGalleryImage(block.id)}
                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <HiTrash className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </SettingGroup>
                
                <SettingGroup title="פריסה">
                    <div className="space-y-4">
                        {renderSelect('מספר עמודות', 'items_per_row', [
                            { label: '2 עמודות', value: 2 },
                            { label: '3 עמודות', value: 3 },
                            { label: '4 עמודות', value: 4 },
                            { label: '5 עמודות', value: 5 },
                            { label: '6 עמודות', value: 6 },
                        ])}
                        {renderSelect('סוג תצוגה', 'display_type', [
                            { label: 'רשת (Grid)', value: 'grid' },
                            { label: 'קרוסלה (Carousel)', value: 'carousel' },
                        ])}
                    </div>
                </SettingGroup>
            </div>
          );

      case 'slideshow':
          const slides = section.blocks?.filter(b => b.type === 'image') || [];
          
          // Add a new slide with optional image
          const addSlide = (imageUrl?: string) => {
              const newBlock = {
                  id: `slide-${Date.now()}`,
                  type: 'image' as const,
                  content: {
                      image_url: imageUrl || '',
                      heading: 'כותרת חדשה',
                      subheading: 'תת כותרת',
                      button_text: 'כפתור',
                      button_url: '#'
                  },
                  style: {},
                  settings: {}
              };
              onUpdate({
                  blocks: [...(section.blocks || []), newBlock]
              });
          };
          
          const removeSlide = (blockId: string) => {
              const newBlocks = (section.blocks || []).filter(b => b.id !== blockId);
              onUpdate({ blocks: newBlocks });
          };

          const updateSlide = (blockId: string, updates: any) => {
             const newBlocks = [...(section.blocks || [])];
             const index = newBlocks.findIndex(b => b.id === blockId);
             if (index >= 0) {
                 newBlocks[index] = { ...newBlocks[index], content: { ...newBlocks[index].content, ...updates } };
                 onUpdate({ blocks: newBlocks });
             }
          };

          // Open media picker for specific slide image
          const openSlideImagePicker = (slideId: string) => {
              setMediaType('image');
              setTargetBlockId(slideId);
              setImageDeviceTarget('desktop');
              setIsMediaPickerOpen(true);
          };

          return (
            <div className="space-y-1">
                <SettingGroup title="הגדרות מצגת">
                    <div className="space-y-4">
                        {renderSelect('גובה', 'height', [
                            { label: 'קטן', value: 'small' },
                            { label: 'בינוני', value: 'medium' },
                            { label: 'גדול', value: 'large' },
                            { label: 'מסך מלא', value: 'full' },
                        ])}
                        {renderSelect('ניגון אוטומטי', 'autoplay', [
                            { label: 'כן', value: true },
                            { label: 'לא', value: false },
                        ])}
                        {getValue('autoplay') && renderInput('מהירות (שניות)', 'autoplay_speed', '5', 'number')}
                    </div>
                </SettingGroup>

                <SettingGroup title="שקופיות">
                    <div className="space-y-4">
                        <button
                            onClick={() => addSlide()}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-sm font-medium"
                        >
                            <HiPlus className="w-5 h-5" />
                            הוסף שקופית
                        </button>

                        <div className="space-y-3">
                            {slides.map((slide, index) => (
                                <div key={slide.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                    <div className="flex items-center gap-3 mb-3">
                                        {/* Clickable image thumbnail */}
                                        <button
                                            onClick={() => openSlideImagePicker(slide.id)}
                                            className="w-12 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-blue-400 transition-all group relative"
                                            title="לחץ להחלפת תמונה"
                                        >
                                            {slide.content?.image_url ? (
                                                <img src={slide.content.image_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <HiPhotograph className="w-6 h-6 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <HiRefresh className="w-4 h-4 text-white" />
                                            </div>
                                        </button>
                                        <div className="flex-1 font-medium text-sm">שקופית {index + 1}</div>
                                        <button onClick={() => removeSlide(slide.id)} className="text-red-500 p-1 hover:bg-red-50 rounded">
                                            <HiTrash className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <input 
                                            className="w-full text-xs p-2 border rounded" 
                                            placeholder="כותרת"
                                            value={slide.content?.heading || ''}
                                            onChange={(e) => updateSlide(slide.id, { heading: e.target.value })}
                                        />
                                        <input 
                                            className="w-full text-xs p-2 border rounded" 
                                            placeholder="תת כותרת"
                                            value={slide.content?.subheading || ''}
                                            onChange={(e) => updateSlide(slide.id, { subheading: e.target.value })}
                                        />
                                        <div className="flex gap-2">
                                            <input 
                                                className="w-1/2 text-xs p-2 border rounded" 
                                                placeholder="טקסט כפתור"
                                                value={slide.content?.button_text || ''}
                                                onChange={(e) => updateSlide(slide.id, { button_text: e.target.value })}
                                            />
                                            <input 
                                                className="w-1/2 text-xs p-2 border rounded" 
                                                placeholder="לינק"
                                                value={slide.content?.button_url || ''}
                                                onChange={(e) => updateSlide(slide.id, { button_url: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </SettingGroup>
            </div>
          );

      case 'testimonials':
          const testimonials = section.blocks?.filter(b => b.type === 'text') || [];
          
          const addTestimonial = () => {
              const newBlock = {
                  id: `testim-${Date.now()}`,
                  type: 'text' as const,
                  content: {
                      text: 'המלצה חדשה...',
                      heading: 'שם לקוח',
                      subheading: 'לקוח מאומת'
                  },
                  style: {},
                  settings: {}
              };
              onUpdate({
                  blocks: [...(section.blocks || []), newBlock]
              });
          };
          
          const removeTestimonial = (blockId: string) => {
              const newBlocks = (section.blocks || []).filter(b => b.id !== blockId);
              onUpdate({ blocks: newBlocks });
          };

          const updateTestimonial = (blockId: string, updates: any) => {
             const newBlocks = [...(section.blocks || [])];
             const index = newBlocks.findIndex(b => b.id === blockId);
             if (index >= 0) {
                 newBlocks[index] = { ...newBlocks[index], content: { ...newBlocks[index].content, ...updates } };
                 onUpdate({ blocks: newBlocks });
             }
          };

          return (
            <div className="space-y-1">
                <SettingGroup title="כללי">
                    <div className="space-y-4">
                        {renderInput('כותרת', 'title', 'לקוחות מספרים')}
                        {renderInput('תת כותרת', 'subtitle', 'מה חושבים עלינו')}
                        {renderSelect('מספר עמודות', 'columns', [
                            { label: '2', value: 2 },
                            { label: '3', value: 3 },
                            { label: '4', value: 4 },
                        ])}
                        {renderSelect('יישור טקסט', 'text_align', [
                            { label: 'ימין', value: 'right' },
                            { label: 'מרכז', value: 'center' },
                            { label: 'שמאל', value: 'left' },
                        ])}
                    </div>
                </SettingGroup>

                <SettingGroup title="המלצות">
                    <div className="space-y-4">
                        <button
                            onClick={addTestimonial}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-sm font-medium"
                        >
                            <HiPlus className="w-5 h-5" />
                            הוסף המלצה
                        </button>

                        <div className="space-y-3">
                            {testimonials.map((item, index) => (
                                <div key={item.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="flex-1 font-medium text-sm">המלצה {index + 1}</div>
                                        <button onClick={() => removeTestimonial(item.id)} className="text-red-500 p-1 hover:bg-red-50 rounded">
                                            <HiTrash className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <textarea 
                                            className="w-full text-xs p-2 border rounded resize-none" 
                                            placeholder="תוכן ההמלצה"
                                            rows={2}
                                            value={item.content?.text || ''}
                                            onChange={(e) => updateTestimonial(item.id, { text: e.target.value })}
                                        />
                                        <div className="flex gap-2">
                                            <input 
                                                className="w-1/2 text-xs p-2 border rounded" 
                                                placeholder="שם לקוח"
                                                value={item.content?.heading || ''}
                                                onChange={(e) => updateTestimonial(item.id, { heading: e.target.value })}
                                            />
                                            <input 
                                                className="w-1/2 text-xs p-2 border rounded" 
                                                placeholder="תיאור (לקוח מאומת)"
                                                value={item.content?.subheading || ''}
                                                onChange={(e) => updateTestimonial(item.id, { subheading: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </SettingGroup>
            </div>
          );

      case 'faq':
          const faqItems = section.blocks?.filter(b => b.type === 'text') || [];
          
          const addFaq = () => {
              const newBlock = {
                  id: `faq-${Date.now()}`,
                  type: 'text' as const,
                  content: {
                      heading: 'שאלה חדשה?',
                      text: 'תשובה...'
                  },
                  style: {},
                  settings: {}
              };
              onUpdate({
                  blocks: [...(section.blocks || []), newBlock]
              });
          };
          
          const removeFaq = (blockId: string) => {
              const newBlocks = (section.blocks || []).filter(b => b.id !== blockId);
              onUpdate({ blocks: newBlocks });
          };

          const updateFaq = (blockId: string, updates: any) => {
             const newBlocks = [...(section.blocks || [])];
             const index = newBlocks.findIndex(b => b.id === blockId);
             if (index >= 0) {
                 newBlocks[index] = { ...newBlocks[index], content: { ...newBlocks[index].content, ...updates } };
                 onUpdate({ blocks: newBlocks });
             }
          };

          return (
            <div className="space-y-1">
                <SettingGroup title="כללי">
                    <div className="space-y-4">
                        {renderInput('כותרת', 'title', 'שאלות ותשובות')}
                        {renderInput('תת כותרת', 'subtitle', 'כל המידע שחשוב לדעת')}
                        {renderSelect('רוחב', 'width', [
                            { label: 'רגיל', value: 'regular' },
                            { label: 'צר', value: 'narrow' },
                        ])}
                    </div>
                </SettingGroup>

                <SettingGroup title="שאלות">
                    <div className="space-y-4">
                        <button
                            onClick={addFaq}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-sm font-medium"
                        >
                            <HiPlus className="w-5 h-5" />
                            הוסף שאלה
                        </button>

                        <div className="space-y-3">
                            {faqItems.map((item, index) => (
                                <div key={item.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="flex-1 font-medium text-sm">שאלה {index + 1}</div>
                                        <button onClick={() => removeFaq(item.id)} className="text-red-500 p-1 hover:bg-red-50 rounded">
                                            <HiTrash className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <input 
                                            className="w-full text-xs p-2 border rounded" 
                                            placeholder="השאלה"
                                            value={item.content?.heading || ''}
                                            onChange={(e) => updateFaq(item.id, { heading: e.target.value })}
                                        />
                                        <textarea 
                                            className="w-full text-xs p-2 border rounded resize-none" 
                                            placeholder="התשובה"
                                            rows={2}
                                            value={item.content?.text || ''}
                                            onChange={(e) => updateFaq(item.id, { text: e.target.value })}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </SettingGroup>
            </div>
          );

      case 'video':
          return (
            <div className="space-y-1">
                <SettingGroup title="תוכן">
                    <div className="space-y-4">
                        {renderInput('כותרת', 'title', 'כותרת הוידאו')}
                        {renderInput('תיאור', 'description', 'תיאור קצר מתחת לוידאו')}
                    </div>
                </SettingGroup>
                
                <SettingGroup title="קובץ וידאו">
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                            {section.settings?.video_url ? (
                                <div className="space-y-2">
                                    <video src={section.settings.video_url} className="w-full rounded h-32 object-cover bg-black" />
                                    <div className="flex gap-2 justify-center">
                                        <button 
                                            onClick={() => {
                                                setMediaType('video');
                                                setTargetBlockId('video-main'); // Custom ID logic
                                                // Handle video update manually
                                                handleSettingChange('video_url', '');
                                            }}
                                            className="text-xs text-red-600 hover:underline"
                                        >
                                            הסר וידאו
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => {
                                        setMediaType('video');
                                        setTargetBlockId(null);
                                        setIsMediaPickerOpen(true);
                                        // Update handleMediaSelect to check for video section
                                        (window as any).__videoSelect = (url: string) => handleSettingChange('video_url', url);
                                    }}
                                    className="flex flex-col items-center gap-2 text-gray-500 hover:text-blue-600"
                                >
                                    <HiVideoCamera className="w-8 h-8" />
                                    <span className="text-sm">בחר וידאו</span>
                                </button>
                            )}
                        </div>
                        {renderInput('תמונת כיסוי (URL)', 'cover_image', 'https://...', 'text', 'אופציונלי', 'ltr')}
                    </div>
                </SettingGroup>
            </div>
          );

      case 'contact_form':
          return (
            <div className="space-y-1">
                <SettingGroup title="כללי">
                    <div className="space-y-4">
                        {renderInput('כותרת', 'title', 'צור קשר')}
                        {renderInput('תת כותרת', 'subtitle', 'נשמח לשמוע מכם')}
                        {renderInput('טקסט כפתור שליחה', 'submit_text', 'שלח הודעה')}
                    </div>
                </SettingGroup>
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
        title={mediaType === 'image' ? (section.type === 'gallery' ? 'בחר תמונות' : 'בחר תמונה') : 'בחר וידאו'}
        multiple={section.type === 'gallery'}
      />
    </div>
  );
}
