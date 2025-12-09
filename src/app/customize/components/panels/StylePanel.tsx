'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { SettingGroup } from '../ui/SettingGroup';
import { RangeSlider } from '../ui/RangeSlider';
import { ColorPicker } from '../ui/ColorPicker';
import { SettingSelect } from '../ui/SettingSelect';

interface StylePanelProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
}

export function StylePanel({ section, onUpdate }: StylePanelProps) {
  const handleStyleChange = (path: string, value: any) => {
    const keys = path.split('.');
    const style = { ...section.style };

    let current = style;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;

    onUpdate({ style });
  };

  const getStyleValue = (path: string, defaultValue: any = '') => {
    const keys = path.split('.');
    let current = section.style || {};

    for (const key of keys) {
      if (current[key] === undefined) return defaultValue;
      current = current[key];
    }

    return current;
  };

  return (
    <div className="pb-8">
      {/* Spacing Group */}
      <SettingGroup title="מרווחים">
        <div className="space-y-6">
            <RangeSlider
                label="מרווח עליון"
                value={parseInt(getStyleValue('spacing.padding_top', '0'))}
                min={0}
                max={200}
                step={4}
                unit="px"
                onChange={(val) => handleStyleChange('spacing.padding_top', `${val}px`)}
            />
            <RangeSlider
                label="מרווח תחתון"
                value={parseInt(getStyleValue('spacing.padding_bottom', '0'))}
                min={0}
                max={200}
                step={4}
                unit="px"
                onChange={(val) => handleStyleChange('spacing.padding_bottom', `${val}px`)}
            />
             <RangeSlider
                label="מרווח ימני"
                value={parseInt(getStyleValue('spacing.padding_right', '0'))}
                min={0}
                max={200}
                step={4}
                unit="px"
                onChange={(val) => handleStyleChange('spacing.padding_right', `${val}px`)}
            />
            <RangeSlider
                label="מרווח שמאלי"
                value={parseInt(getStyleValue('spacing.padding_left', '0'))}
                min={0}
                max={200}
                step={4}
                unit="px"
                onChange={(val) => handleStyleChange('spacing.padding_left', `${val}px`)}
            />
        </div>
      </SettingGroup>

      {/* Background Group */}
      <SettingGroup title="רקע">
        <div className="space-y-4">
           <ColorPicker
            label="צבע רקע"
            value={getStyleValue('background.background_color', '#ffffff')}
            onChange={(val) => handleStyleChange('background.background_color', val)}
          />
           <RangeSlider
                label="שקיפות שכבת כיסוי"
                value={parseFloat(getStyleValue('background.overlay_opacity', '0'))}
                min={0}
                max={1}
                step={0.1}
                unit=""
                onChange={(val) => handleStyleChange('background.overlay_opacity', val)}
            />
        </div>
      </SettingGroup>

      {/* Typography Group */}
      <SettingGroup title="טיפוגרפיה">
        <div className="space-y-4">
          <ColorPicker
            label="צבע טקסט"
            value={getStyleValue('typography.color', '#000000')}
            onChange={(val) => handleStyleChange('typography.color', val)}
          />
          <SettingSelect
            label="פונט"
            value={getStyleValue('typography.font_family', '"Noto Sans Hebrew", sans-serif')}
            onChange={(e) => handleStyleChange('typography.font_family', e.target.value)}
            options={[
              { label: 'Noto Sans Hebrew (מומלץ)', value: '"Noto Sans Hebrew", sans-serif' },
              { label: 'Assistant (עברית)', value: '"Assistant", sans-serif' },
              { label: 'Rubik (עברית)', value: '"Rubik", sans-serif' },
              { label: 'Heebo (עברית)', value: '"Heebo", sans-serif' },
              { label: 'Arial', value: 'Arial, sans-serif' },
              { label: 'System UI', value: 'system-ui' },
            ]}
          />
        </div>
      </SettingGroup>

      {/* Button Group */}
      <SettingGroup title="כפתור">
        <div className="space-y-4">
          <SettingSelect
            label="סגנון כפתור"
            value={getStyleValue('button.style', 'solid')}
            onChange={(e) => handleStyleChange('button.style', e.target.value)}
            options={[
              { label: 'מלא', value: 'solid' },
              { label: 'מתאר', value: 'outline' },
              { label: 'לבן', value: 'white' },
              { label: 'שחור', value: 'black' },
              { label: 'קו תחתון', value: 'underline' },
            ]}
          />
          <ColorPicker
            label="צבע רקע כפתור"
            value={getStyleValue('button.background_color', '#2563EB')}
            onChange={(val) => handleStyleChange('button.background_color', val)}
          />
          <ColorPicker
            label="צבע טקסט כפתור"
            value={getStyleValue('button.text_color', '#FFFFFF')}
            onChange={(val) => handleStyleChange('button.text_color', val)}
          />
          <ColorPicker
            label="צבע רקע מעבר עכבר"
            value={getStyleValue('button.hover_background_color', '#1E40AF')}
            onChange={(val) => handleStyleChange('button.hover_background_color', val)}
          />
          <ColorPicker
            label="צבע טקסט מעבר עכבר"
            value={getStyleValue('button.hover_text_color', '#FFFFFF')}
            onChange={(val) => handleStyleChange('button.hover_text_color', val)}
          />
          <RangeSlider
            label="רדיוס פינות כפתור"
            value={parseInt(getStyleValue('button.border_radius', '8'))}
            min={0}
            max={50}
            step={2}
            unit="px"
            onChange={(val) => handleStyleChange('button.border_radius', `${val}px`)}
          />
        </div>
      </SettingGroup>

       {/* Border Group */}
       <SettingGroup title="גבולות">
        <div className="space-y-4">
           <RangeSlider
                label="רדיוס פינות"
                value={parseInt(getStyleValue('border.border_radius', '0'))}
                min={0}
                max={40}
                step={2}
                unit="px"
                onChange={(val) => handleStyleChange('border.border_radius', `${val}px`)}
            />
        </div>
      </SettingGroup>
    </div>
  );
}
