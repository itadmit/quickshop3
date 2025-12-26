'use client';

import React, { useState } from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { SettingGroup } from '../ui/SettingGroup';
import { SettingInput } from '../ui/SettingInput';
import { SettingSelect } from '../ui/SettingSelect';
import { ModernColorPicker } from '../SettingsUI';
import { MediaPicker } from '@/components/MediaPicker';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { HiPhotograph, HiVideoCamera, HiTrash, HiPlus, HiDeviceMobile, HiDesktopComputer } from 'react-icons/hi';
import { useStoreId } from '@/hooks/useStoreId';
import { DeviceType } from '../Header';

interface ElementsPanelProps {
  sections: SectionSettings[];
  onSectionAdd: (sectionType: string, position?: number) => void;
  onSectionDelete: (sectionId: string) => void;
  onSectionUpdate: (sectionId: string, updates: Partial<SectionSettings>) => void;
  device: DeviceType;
}

const ELEMENT_TYPES = [
  { type: 'element_heading', name: 'כותרת', icon: '📝' },
  { type: 'element_content', name: 'תוכן', icon: '📄' },
  { type: 'element_button', name: 'כפתור', icon: '🔘' },
  { type: 'element_image', name: 'תמונה', icon: '🖼️' },
  { type: 'element_video', name: 'וידאו', icon: '🎥' },
  { type: 'element_divider', name: 'מפריד', icon: '➖' },
  { type: 'element_spacer', name: 'רווח', icon: '↕️' },
  { type: 'element_marquee', name: 'טקסט נע', icon: '➡️' },
];

export function ElementsPanel({
  sections,
  onSectionAdd,
  onSectionDelete,
  onSectionUpdate,
  device
}: ElementsPanelProps) {
  const storeId = useStoreId();
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [targetSectionId, setTargetSectionId] = useState<string | null>(null);
  const [imageDeviceTarget, setImageDeviceTarget] = useState<'desktop' | 'mobile'>('desktop');

  // Filter only element sections
  const elementSections = sections.filter(s => s.type.startsWith('element_'));

  const handleAddElement = (elementType: string) => {
    onSectionAdd(elementType, sections.length);
  };

  const handleMediaSelect = (files: string[]) => {
    if (files.length === 0 || !targetSectionId) return;
    
    const section = sections.find(s => s.id === targetSectionId);
    if (!section) return;

    const updates: any = {};
    if (mediaType === 'image') {
      if (imageDeviceTarget === 'mobile') {
        updates.image_url_mobile = files[0];
      } else {
        updates.image_url = files[0];
      }
    } else {
      if (imageDeviceTarget === 'mobile') {
        updates.video_url_mobile = files[0];
      } else {
        updates.video_url = files[0];
      }
    }

    onSectionUpdate(targetSectionId, { settings: { ...section.settings, ...updates } });
    setIsMediaPickerOpen(false);
    setTargetSectionId(null);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {/* Add Element Buttons */}
        <SettingGroup title="הוסף יחיד" defaultOpen={true}>
          <div className="grid grid-cols-2 gap-2">
            {ELEMENT_TYPES.map((element) => (
              <button
                key={element.type}
                onClick={() => handleAddElement(element.type)}
                className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all"
              >
                <span className="text-2xl">{element.icon}</span>
                <span className="text-sm font-medium text-gray-700">{element.name}</span>
              </button>
            ))}
          </div>
        </SettingGroup>

        {/* Elements List */}
        {elementSections.length > 0 && (
          <SettingGroup title={`יחידים (${elementSections.length})`} defaultOpen={true}>
            <div className="space-y-3">
              {elementSections.map((section, index) => {
                const elementType = ELEMENT_TYPES.find(e => e.type === section.type);
                return (
                  <div key={section.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{elementType?.icon}</span>
                        <span className="text-sm font-medium text-gray-700">
                          {elementType?.name} {index + 1}
                        </span>
                      </div>
                      <button
                        onClick={() => onSectionDelete(section.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                        title="מחק יחיד"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Element-specific settings */}
                    {section.type === 'element_heading' && (
                      <div className="space-y-3">
                        <SettingInput
                          label="כותרת"
                          value={section.settings?.heading || ''}
                          onChange={(e) => onSectionUpdate(section.id, {
                            settings: { ...section.settings, heading: e.target.value }
                          })}
                        />
                        <SettingSelect
                          label="גודל"
                          value={section.settings?.heading_size || 'large'}
                          onChange={(e) => onSectionUpdate(section.id, {
                            settings: { ...section.settings, heading_size: e.target.value }
                          })}
                          options={[
                            { label: 'קטן', value: 'small' },
                            { label: 'בינוני', value: 'medium' },
                            { label: 'גדול', value: 'large' },
                            { label: 'גדול מאוד', value: 'xlarge' },
                          ]}
                        />
                        <SettingSelect
                          label="יישור"
                          value={section.settings?.text_align || 'right'}
                          onChange={(e) => onSectionUpdate(section.id, {
                            settings: { ...section.settings, text_align: e.target.value }
                          })}
                          options={[
                            { label: 'ימין', value: 'right' },
                            { label: 'מרכז', value: 'center' },
                            { label: 'שמאל', value: 'left' },
                          ]}
                        />
                        <SettingSelect
                          label="משקל פונט"
                          value={section.settings?.font_weight || 'bold'}
                          onChange={(e) => onSectionUpdate(section.id, {
                            settings: { ...section.settings, font_weight: e.target.value }
                          })}
                          options={[
                            { label: 'רגיל', value: 'normal' },
                            { label: 'בינוני', value: 'medium' },
                            { label: 'מודגש', value: 'bold' },
                          ]}
                        />
                      </div>
                    )}

                    {section.type === 'element_content' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">תוכן</label>
                          <RichTextEditor
                            value={section.settings?.content || ''}
                            onChange={(html) => onSectionUpdate(section.id, {
                              settings: { ...section.settings, content: html }
                            })}
                            placeholder="הזן תוכן..."
                            className="min-h-[150px]"
                          />
                        </div>
                        <SettingSelect
                          label="גודל טקסט"
                          value={section.settings?.text_size || 'medium'}
                          onChange={(e) => onSectionUpdate(section.id, {
                            settings: { ...section.settings, text_size: e.target.value }
                          })}
                          options={[
                            { label: 'קטן', value: 'small' },
                            { label: 'בינוני', value: 'medium' },
                            { label: 'גדול', value: 'large' },
                            { label: 'גדול מאוד', value: 'xlarge' },
                          ]}
                        />
                        <SettingSelect
                          label="יישור"
                          value={section.settings?.text_align || 'right'}
                          onChange={(e) => onSectionUpdate(section.id, {
                            settings: { ...section.settings, text_align: e.target.value }
                          })}
                          options={[
                            { label: 'ימין', value: 'right' },
                            { label: 'מרכז', value: 'center' },
                            { label: 'שמאל', value: 'left' },
                          ]}
                        />
                      </div>
                    )}

                    {section.type === 'element_button' && (
                      <div className="space-y-3">
                        <SettingInput
                          label="טקסט כפתור"
                          value={section.settings?.button_text || ''}
                          onChange={(e) => onSectionUpdate(section.id, {
                            settings: { ...section.settings, button_text: e.target.value }
                          })}
                        />
                        <SettingInput
                          label="קישור"
                          value={section.settings?.button_url || ''}
                          onChange={(e) => onSectionUpdate(section.id, {
                            settings: { ...section.settings, button_url: e.target.value }
                          })}
                          dir="ltr"
                        />
                        <SettingSelect
                          label="גודל כפתור"
                          value={section.settings?.button_size || 'medium'}
                          onChange={(e) => onSectionUpdate(section.id, {
                            settings: { ...section.settings, button_size: e.target.value }
                          })}
                          options={[
                            { label: 'קטן', value: 'small' },
                            { label: 'בינוני', value: 'medium' },
                            { label: 'גדול', value: 'large' },
                            { label: 'גדול מאוד', value: 'xlarge' },
                          ]}
                        />
                        <SettingSelect
                          label="יישור"
                          value={section.settings?.button_align || 'right'}
                          onChange={(e) => onSectionUpdate(section.id, {
                            settings: { ...section.settings, button_align: e.target.value }
                          })}
                          options={[
                            { label: 'ימין', value: 'right' },
                            { label: 'מרכז', value: 'center' },
                            { label: 'שמאל', value: 'left' },
                          ]}
                        />
                      </div>
                    )}

                    {(section.type === 'element_image' || section.type === 'element_video') && (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setMediaType(section.type === 'element_image' ? 'image' : 'video');
                              setTargetSectionId(section.id);
                              setImageDeviceTarget('desktop');
                              setIsMediaPickerOpen(true);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                          >
                            <HiDesktopComputer className="w-4 h-4" />
                            מחשב
                          </button>
                          <button
                            onClick={() => {
                              setMediaType(section.type === 'element_image' ? 'image' : 'video');
                              setTargetSectionId(section.id);
                              setImageDeviceTarget('mobile');
                              setIsMediaPickerOpen(true);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                          >
                            <HiDeviceMobile className="w-4 h-4" />
                            מובייל
                          </button>
                        </div>
                        {section.type === 'element_image' && (
                          <>
                            {section.settings?.image_url && (
                              <div className="relative">
                                <img src={section.settings.image_url} alt="" className="w-full h-32 object-cover rounded-lg" />
                                <button
                                  onClick={() => onSectionUpdate(section.id, {
                                    settings: { ...section.settings, image_url: '' }
                                  })}
                                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded"
                                >
                                  <HiTrash className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                            <SettingSelect
                              label="רוחב תמונה"
                              value={section.settings?.image_width || 'full'}
                              onChange={(e) => onSectionUpdate(section.id, {
                                settings: { ...section.settings, image_width: e.target.value }
                              })}
                              options={[
                                { label: 'קטן', value: 'small' },
                                { label: 'בינוני', value: 'medium' },
                                { label: 'גדול', value: 'large' },
                                { label: 'גדול מאוד', value: 'xlarge' },
                                { label: 'מלא', value: 'full' },
                              ]}
                            />
                            <SettingSelect
                              label="יישור"
                              value={section.settings?.image_align || 'center'}
                              onChange={(e) => onSectionUpdate(section.id, {
                                settings: { ...section.settings, image_align: e.target.value }
                              })}
                              options={[
                                { label: 'ימין', value: 'right' },
                                { label: 'מרכז', value: 'center' },
                                { label: 'שמאל', value: 'left' },
                              ]}
                            />
                          </>
                        )}
                        {section.type === 'element_video' && (
                          <>
                            {section.settings?.video_url && (
                              <div className="relative">
                                <video src={section.settings.video_url} className="w-full h-32 object-cover rounded-lg" controls />
                                <button
                                  onClick={() => onSectionUpdate(section.id, {
                                    settings: { ...section.settings, video_url: '' }
                                  })}
                                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded"
                                >
                                  <HiTrash className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                            <SettingSelect
                              label="רוחב וידאו"
                              value={section.settings?.video_width || 'full'}
                              onChange={(e) => onSectionUpdate(section.id, {
                                settings: { ...section.settings, video_width: e.target.value }
                              })}
                              options={[
                                { label: 'קטן', value: 'small' },
                                { label: 'בינוני', value: 'medium' },
                                { label: 'גדול', value: 'large' },
                                { label: 'גדול מאוד', value: 'xlarge' },
                                { label: 'מלא', value: 'full' },
                              ]}
                            />
                            <SettingSelect
                              label="יישור"
                              value={section.settings?.video_align || 'center'}
                              onChange={(e) => onSectionUpdate(section.id, {
                                settings: { ...section.settings, video_align: e.target.value }
                              })}
                              options={[
                                { label: 'ימין', value: 'right' },
                                { label: 'מרכז', value: 'center' },
                                { label: 'שמאל', value: 'left' },
                              ]}
                            />
                          </>
                        )}
                      </div>
                    )}

                    {section.type === 'element_divider' && (
                      <div className="space-y-3">
                        <SettingSelect
                          label="סגנון"
                          value={section.settings?.divider_style || 'solid'}
                          onChange={(e) => onSectionUpdate(section.id, {
                            settings: { ...section.settings, divider_style: e.target.value }
                          })}
                          options={[
                            { label: 'רציף', value: 'solid' },
                            { label: 'מקווקו', value: 'dashed' },
                            { label: 'מנוקד', value: 'dotted' },
                          ]}
                        />
                        <SettingSelect
                          label="רוחב"
                          value={section.settings?.divider_width || 'full'}
                          onChange={(e) => onSectionUpdate(section.id, {
                            settings: { ...section.settings, divider_width: e.target.value }
                          })}
                          options={[
                            { label: 'קטן', value: 'small' },
                            { label: 'בינוני', value: 'medium' },
                            { label: 'גדול', value: 'large' },
                            { label: 'מלא', value: 'full' },
                          ]}
                        />
                        <SettingSelect
                          label="יישור"
                          value={section.settings?.divider_align || 'center'}
                          onChange={(e) => onSectionUpdate(section.id, {
                            settings: { ...section.settings, divider_align: e.target.value }
                          })}
                          options={[
                            { label: 'ימין', value: 'right' },
                            { label: 'מרכז', value: 'center' },
                            { label: 'שמאל', value: 'left' },
                          ]}
                        />
                        <SettingSelect
                          label="רווח"
                          value={section.settings?.spacing || 'medium'}
                          onChange={(e) => onSectionUpdate(section.id, {
                            settings: { ...section.settings, spacing: e.target.value }
                          })}
                          options={[
                            { label: 'ללא', value: 'none' },
                            { label: 'קטן', value: 'small' },
                            { label: 'בינוני', value: 'medium' },
                            { label: 'גדול', value: 'large' },
                            { label: 'גדול מאוד', value: 'xlarge' },
                          ]}
                        />
                      </div>
                    )}

                    {section.type === 'element_spacer' && (
                      <div className="space-y-3">
                        <SettingSelect
                          label="גובה"
                          value={section.settings?.height || 'medium'}
                          onChange={(e) => onSectionUpdate(section.id, {
                            settings: { ...section.settings, height: e.target.value }
                          })}
                          options={[
                            { label: 'קטן', value: 'small' },
                            { label: 'בינוני', value: 'medium' },
                            { label: 'גדול', value: 'large' },
                            { label: 'גדול מאוד', value: 'xlarge' },
                          ]}
                        />
                      </div>
                    )}

                    {section.type === 'element_marquee' && (
                      <div className="space-y-3">
                        <SettingInput
                          label="טקסט"
                          value={section.settings?.text || ''}
                          onChange={(e) => onSectionUpdate(section.id, {
                            settings: { ...section.settings, text: e.target.value }
                          })}
                        />
                        <SettingSelect
                          label="כיוון"
                          value={section.settings?.direction || 'right'}
                          onChange={(e) => onSectionUpdate(section.id, {
                            settings: { ...section.settings, direction: e.target.value }
                          })}
                          options={[
                            { label: 'ימין', value: 'right' },
                            { label: 'שמאל', value: 'left' },
                          ]}
                        />
                        <SettingSelect
                          label="מהירות"
                          value={section.settings?.speed || 'normal'}
                          onChange={(e) => onSectionUpdate(section.id, {
                            settings: { ...section.settings, speed: e.target.value }
                          })}
                          options={[
                            { label: 'איטי', value: 'slow' },
                            { label: 'רגיל', value: 'normal' },
                            { label: 'מהיר', value: 'fast' },
                          ]}
                        />
                        <SettingSelect
                          label="גודל טקסט"
                          value={section.settings?.text_size || 'medium'}
                          onChange={(e) => onSectionUpdate(section.id, {
                            settings: { ...section.settings, text_size: e.target.value }
                          })}
                          options={[
                            { label: 'קטן', value: 'small' },
                            { label: 'בינוני', value: 'medium' },
                            { label: 'גדול', value: 'large' },
                            { label: 'גדול מאוד', value: 'xlarge' },
                          ]}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </SettingGroup>
        )}

        {elementSections.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">אין יחידים. לחץ על כפתור למעלה כדי להוסיף יחיד חדש.</p>
          </div>
        )}
      </div>

      {/* Media Picker Modal */}
      {isMediaPickerOpen && (
        <MediaPicker
          open={isMediaPickerOpen}
          onClose={() => {
            setIsMediaPickerOpen(false);
            setTargetSectionId(null);
          }}
          onSelect={handleMediaSelect}
          type={mediaType}
          multiple={false}
        />
      )}
    </div>
  );
}
