'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { SettingGroup } from '../ui/SettingGroup';
import { RangeSlider } from '../ui/RangeSlider';
import { ColorPicker } from '../ui/ColorPicker';
import { SettingSelect } from '../ui/SettingSelect';
import { SettingInput } from '../ui/SettingInput';
import { TypographyPopover } from './TypographyPopover';

interface StylePanelProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
}

export function StylePanel({ section, onUpdate }: StylePanelProps) {
  const [typographyAnchor, setTypographyAnchor] = useState<HTMLElement | null>(null);
  const [selectedTypographyType, setSelectedTypographyType] = useState<'heading' | 'content' | 'button' | null>(null);
  const headingButtonRef = useRef<HTMLButtonElement>(null);
  const contentButtonRef = useRef<HTMLButtonElement>(null);
  const buttonButtonRef = useRef<HTMLButtonElement>(null);

  const handleStyleChange = (path: string, value: any) => {
    const keys = path.split('.');
    
    // Deep clone the style object to avoid mutation issues
    const style = JSON.parse(JSON.stringify(section.style || {}));

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

  const openTypographyPopover = (type: 'heading' | 'content' | 'button', buttonRef: React.RefObject<HTMLButtonElement>) => {
    if (buttonRef.current) {
      setTypographyAnchor(buttonRef.current);
      setSelectedTypographyType(type);
    }
  };

  const getTypographyForType = (type: 'heading' | 'content' | 'button') => {
    const basePath = type === 'heading' ? 'typography.heading' : 
                     type === 'content' ? 'typography.content' : 
                     'typography.button';
    
    return {
      color: getStyleValue(`${basePath}.color`, type === 'heading' ? '#000000' : type === 'content' ? '#000000' : '#FFFFFF'),
      font_family: getStyleValue(`${basePath}.font_family`, getStyleValue('typography.font_family', '"Noto Sans Hebrew", sans-serif')),
      font_size: getStyleValue(`${basePath}.font_size`, ''),
      font_size_unit: getStyleValue(`${basePath}.font_size_unit`, 'px'),
      font_weight: getStyleValue(`${basePath}.font_weight`, type === 'heading' ? '700' : '400'),
      line_height: getStyleValue(`${basePath}.line_height`, ''),
      line_height_unit: getStyleValue(`${basePath}.line_height_unit`, ''),
      letter_spacing: getStyleValue(`${basePath}.letter_spacing`, ''),
      letter_spacing_unit: getStyleValue(`${basePath}.letter_spacing_unit`, ''),
      text_transform: getStyleValue(`${basePath}.text_transform`, 'none'),
    };
  };

  const updateTypographyForType = (type: 'heading' | 'content' | 'button', typography: any) => {
    const basePath = type === 'heading' ? 'typography.heading' : 
                     type === 'content' ? 'typography.content' : 
                     'typography.button';
    
    const style = JSON.parse(JSON.stringify(section.style || {}));
    if (!style.typography) style.typography = {};
    if (!style.typography[type]) style.typography[type] = {};
    
    Object.keys(typography).forEach(key => {
      style.typography[type][key] = typography[key];
    });
    
    onUpdate({ style });
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

  // Check if section has text content
  const hasTextContent = [
    'element_heading', 'element_content', 'rich_text', 'image_with_text', 
    'hero_banner', 'multicolumn', 'faq', 'slideshow', 'testimonials',
    'featured_products', 'featured_collections'
  ].includes(section.type);

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

      {/* Typography Group - Only show for sections with text */}
      {hasTextContent && (
        <SettingGroup title="טיפוגרפיה">
          <div className="space-y-3">
            {/* Heading Typography */}
            {['hero_banner', 'image_with_text', 'rich_text', 'multicolumn', 'faq', 'slideshow', 'featured_products', 'featured_collections', 'element_heading'].includes(section.type) && (
              <div className="flex items-center justify-between p-2 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                <span className="text-sm font-medium text-gray-700">טיפוגרפיה כותרת</span>
                <button
                  ref={headingButtonRef}
                  onClick={() => openTypographyPopover('heading', headingButtonRef)}
                  className={`p-1.5 rounded transition-colors ${selectedTypographyType === 'heading' && typographyAnchor ? 'text-gray-800 bg-gray-200' : 'text-gray-500 hover:bg-gray-100'}`}
                  title="ערוך טיפוגרפיה כותרת"
                >
                  <span className="text-sm font-bold" style={{ fontFamily: 'Arial, sans-serif' }}>Aa</span>
                </button>
              </div>
            )}

            {/* Content Typography */}
            {['rich_text', 'image_with_text', 'multicolumn', 'faq', 'element_content'].includes(section.type) && (
              <div className="flex items-center justify-between p-2 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                <span className="text-sm font-medium text-gray-700">טיפוגרפיה תוכן</span>
                <button
                  ref={contentButtonRef}
                  onClick={() => openTypographyPopover('content', contentButtonRef)}
                  className={`p-1.5 rounded transition-colors ${selectedTypographyType === 'content' && typographyAnchor ? 'text-gray-800 bg-gray-200' : 'text-gray-500 hover:bg-gray-100'}`}
                  title="ערוך טיפוגרפיה תוכן"
                >
                  <span className="text-sm font-bold" style={{ fontFamily: 'Arial, sans-serif' }}>Aa</span>
                </button>
              </div>
            )}

            {/* Button Typography */}
            {['hero_banner', 'image_with_text', 'rich_text', 'multicolumn', 'slideshow', 'element_button'].includes(section.type) && (
              <div className="flex items-center justify-between p-2 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                <span className="text-sm font-medium text-gray-700">טיפוגרפיה כפתור</span>
                <button
                  ref={buttonButtonRef}
                  onClick={() => openTypographyPopover('button', buttonButtonRef)}
                  className={`p-1.5 rounded transition-colors ${selectedTypographyType === 'button' && typographyAnchor ? 'text-gray-800 bg-gray-200' : 'text-gray-500 hover:bg-gray-100'}`}
                  title="ערוך טיפוגרפיה כפתור"
                >
                  <span className="text-sm font-bold" style={{ fontFamily: 'Arial, sans-serif' }}>Aa</span>
                </button>
              </div>
            )}
          </div>
        </SettingGroup>
      )}

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

      {/* Typography Popover */}
      {selectedTypographyType && typographyAnchor && (
        <TypographyPopover
          open={Boolean(typographyAnchor)}
          anchorEl={typographyAnchor}
          onClose={() => {
            setTypographyAnchor(null);
            setSelectedTypographyType(null);
          }}
          typography={getTypographyForType(selectedTypographyType)}
          onUpdate={(typography) => {
            updateTypographyForType(selectedTypographyType, typography);
          }}
        />
      )}
    </div>
  );
}
