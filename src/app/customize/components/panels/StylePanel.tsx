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

  // Special styling for Header
  if (section.type === 'header') {
    return (
      <div className="pb-8">
        <SettingGroup title="צבעים">
          <div className="space-y-4">
            <ColorPicker
              label="צבע רקע"
              value={getStyleValue('background.background_color', '#FFFFFF')}
              onChange={(val) => handleStyleChange('background.background_color', val)}
            />
            <ColorPicker
              label="צבע טקסט / לוגו"
              value={getStyleValue('typography.color', '#000000')}
              onChange={(val) => handleStyleChange('typography.color', val)}
            />
            <ColorPicker
              label="צבע קישורי תפריט"
              value={getStyleValue('navigation.color', '#374151')}
              onChange={(val) => handleStyleChange('navigation.color', val)}
            />
            <ColorPicker
              label="צבע קישורי תפריט - מעבר עכבר"
              value={getStyleValue('navigation.hover_color', '#000000')}
              onChange={(val) => handleStyleChange('navigation.hover_color', val)}
            />
            <ColorPicker
              label="צבע אייקונים"
              value={getStyleValue('icons.color', '#4B5563')}
              onChange={(val) => handleStyleChange('icons.color', val)}
            />
            <ColorPicker
              label="צבע אייקונים - מעבר עכבר"
              value={getStyleValue('icons.hover_color', '#000000')}
              onChange={(val) => handleStyleChange('icons.hover_color', val)}
            />
          </div>
        </SettingGroup>

        <SettingGroup title="גבולות">
          <div className="space-y-4">
            <SettingSelect
              label="גבול תחתון"
              value={getStyleValue('border.bottom_style', 'solid')}
              onChange={(e) => handleStyleChange('border.bottom_style', e.target.value)}
              options={[
                { label: 'קו רציף', value: 'solid' },
                { label: 'צל', value: 'shadow' },
                { label: 'ללא', value: 'none' },
              ]}
            />
            {getStyleValue('border.bottom_style', 'solid') === 'solid' && (
              <ColorPicker
                label="צבע גבול"
                value={getStyleValue('border.border_color', '#E5E7EB')}
                onChange={(val) => handleStyleChange('border.border_color', val)}
              />
            )}
          </div>
        </SettingGroup>

        <SettingGroup title="מרווחים">
          <div className="space-y-6">
            <RangeSlider
              label="גובה הדר - דסקטופ"
              value={parseInt(getStyleValue('spacing.height_desktop', '64'))}
              min={48}
              max={120}
              step={4}
              unit="px"
              onChange={(val) => handleStyleChange('spacing.height_desktop', `${val}px`)}
            />
            <RangeSlider
              label="גובה הדר - מובייל"
              value={parseInt(getStyleValue('spacing.height_mobile', '56'))}
              min={40}
              max={80}
              step={4}
              unit="px"
              onChange={(val) => handleStyleChange('spacing.height_mobile', `${val}px`)}
            />
          </div>
        </SettingGroup>
      </div>
    );
  }

  // Special styling for Footer
  if (section.type === 'footer') {
    return (
      <div className="pb-8">
        <SettingGroup title="צבעים">
          <div className="space-y-4">
            <ColorPicker
              label="צבע רקע"
              value={getStyleValue('background.background_color', '#111827')}
              onChange={(val) => handleStyleChange('background.background_color', val)}
            />
            <ColorPicker
              label="צבע כותרות"
              value={getStyleValue('typography.heading_color', '#FFFFFF')}
              onChange={(val) => handleStyleChange('typography.heading_color', val)}
            />
            <ColorPicker
              label="צבע טקסט"
              value={getStyleValue('typography.color', '#9CA3AF')}
              onChange={(val) => handleStyleChange('typography.color', val)}
            />
            <ColorPicker
              label="צבע קישורים"
              value={getStyleValue('links.color', '#9CA3AF')}
              onChange={(val) => handleStyleChange('links.color', val)}
            />
            <ColorPicker
              label="צבע קישורים - מעבר עכבר"
              value={getStyleValue('links.hover_color', '#FFFFFF')}
              onChange={(val) => handleStyleChange('links.hover_color', val)}
            />
          </div>
        </SettingGroup>

        <SettingGroup title="מרווחים">
          <div className="space-y-6">
            <RangeSlider
              label="מרווח עליון"
              value={parseInt(getStyleValue('spacing.padding_top', '48'))}
              min={0}
              max={120}
              step={4}
              unit="px"
              onChange={(val) => handleStyleChange('spacing.padding_top', `${val}px`)}
            />
            <RangeSlider
              label="מרווח תחתון"
              value={parseInt(getStyleValue('spacing.padding_bottom', '48'))}
              min={0}
              max={120}
              step={4}
              unit="px"
              onChange={(val) => handleStyleChange('spacing.padding_bottom', `${val}px`)}
            />
          </div>
        </SettingGroup>
      </div>
    );
  }

  // Default styling for other sections
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
