'use client';

import React, { useState, useEffect } from 'react';
import { ColorPicker } from '../ui/ColorPicker';
import { SettingSelect } from '../ui/SettingSelect';
import { SettingInput } from '../ui/SettingInput';
import { SettingGroup } from '../ui/SettingGroup';
import { useStoreId } from '@/hooks/useStoreId';
import { HiCode, HiSave, HiCheckCircle, HiXCircle, HiColorSwatch, HiDocumentText, HiViewGridAdd, HiCursorClick, HiLightningBolt, HiTemplate } from 'react-icons/hi';

interface ThemeSettings {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    text_light: string;
    border: string;
    surface?: string;
    muted?: string;
    error?: string;
    success?: string;
  };
  typography: {
    font_family_heading: string;
    font_family_body: string;
    font_size_base: string;
    line_height_base: string;
    heading_weight?: number;
    body_weight?: number;
  };
  layout: {
    max_width: string;
    container_padding: string;
    border_radius: string;
    section_spacing?: string;
    grid_gap?: string;
  };
  buttons: {
    borderRadius?: number;
    padding?: string;
    primaryStyle?: string;
    secondaryStyle?: string;
  };
  cards: {
    borderRadius?: number;
    shadow?: string;
    hoverEffect?: string;
  };
  animations: {
    enabled: boolean;
    duration: string;
    easing?: string;
  };
}

interface GeneralSettingsPanelProps {
  onUpdate?: () => void;
  onClose?: () => void;
}

const FONT_OPTIONS = [
  { label: 'Noto Sans Hebrew (מומלץ)', value: '"Noto Sans Hebrew", sans-serif' },
  { label: 'Assistant (עברית)', value: '"Assistant", sans-serif' },
  { label: 'Rubik (עברית)', value: '"Rubik", sans-serif' },
  { label: 'Heebo (עברית)', value: '"Heebo", sans-serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Helvetica Neue', value: '"Helvetica Neue", sans-serif' },
  { label: 'System UI', value: 'system-ui' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
];

const FONT_WEIGHT_OPTIONS = [
  { label: 'דק (300)', value: 300 },
  { label: 'רגיל (400)', value: 400 },
  { label: 'בינוני (500)', value: 500 },
  { label: 'חצי מודגש (600)', value: 600 },
  { label: 'מודגש (700)', value: 700 },
];

const SHADOW_OPTIONS = [
  { label: 'ללא צל', value: 'none' },
  { label: 'קטן', value: 'sm' },
  { label: 'בינוני', value: 'md' },
  { label: 'גדול', value: 'lg' },
];

const HOVER_EFFECT_OPTIONS = [
  { label: 'ללא אפקט', value: 'none' },
  { label: 'הרמה', value: 'lift' },
  { label: 'צל', value: 'shadow' },
  { label: 'זום', value: 'zoom' },
];

const BUTTON_STYLE_OPTIONS = [
  { label: 'מלא', value: 'solid' },
  { label: 'מסגרת', value: 'outline' },
  { label: 'שקוף', value: 'ghost' },
];

type TabType = 'colors' | 'typography' | 'layout' | 'components' | 'code';

export function GeneralSettingsPanel({ onUpdate, onClose }: GeneralSettingsPanelProps) {
  const storeId = useStoreId();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('colors');
  const [settings, setSettings] = useState<ThemeSettings>({
    colors: {
      primary: '#000000',
      secondary: '#666666',
      accent: '#10B981',
      background: '#FFFFFF',
      text: '#000000',
      text_light: '#6B7280',
      border: '#E5E7EB',
      surface: '#F9FAFB',
      muted: '#6B7280',
      error: '#EF4444',
      success: '#10B981',
    },
    typography: {
      font_family_heading: 'Heebo',
      font_family_body: 'Heebo',
      font_size_base: '16px',
      line_height_base: '1.6',
      heading_weight: 700,
      body_weight: 400,
    },
    layout: {
      max_width: '1200px',
      container_padding: '24px',
      border_radius: '4px',
      section_spacing: '64px',
      grid_gap: '24px',
    },
    buttons: {
      borderRadius: 4,
      padding: '12px 24px',
      primaryStyle: 'solid',
      secondaryStyle: 'outline',
    },
    cards: {
      borderRadius: 8,
      shadow: 'sm',
      hoverEffect: 'lift',
    },
    animations: {
      enabled: true,
      duration: '300ms',
      easing: 'ease-out',
    },
  });
  const [customCss, setCustomCss] = useState('');
  const [customJs, setCustomJs] = useState('');
  const [customHeadCode, setCustomHeadCode] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadSettings();
  }, [storeId]);

  const loadSettings = async () => {
    if (!storeId) return;
    
    try {
      setIsLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('/api/customizer/theme-settings', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings({
            colors: {
              primary: data.settings.colors?.primary || '#000000',
              secondary: data.settings.colors?.secondary || '#666666',
              accent: data.settings.colors?.accent || '#10B981',
              background: data.settings.colors?.background || '#FFFFFF',
              text: data.settings.colors?.text || '#000000',
              text_light: data.settings.colors?.text_light || '#6B7280',
              border: data.settings.colors?.border || '#E5E7EB',
              surface: data.settings.colors?.surface || '#F9FAFB',
              muted: data.settings.colors?.muted || '#6B7280',
              error: data.settings.colors?.error || '#EF4444',
              success: data.settings.colors?.success || '#10B981',
            },
            typography: {
              font_family_heading: data.settings.typography?.headingFont || data.settings.typography?.font_family_heading || 'Heebo',
              font_family_body: data.settings.typography?.bodyFont || data.settings.typography?.font_family_body || 'Heebo',
              font_size_base: data.settings.typography?.baseFontSize ? `${data.settings.typography.baseFontSize}px` : data.settings.typography?.font_size_base || '16px',
              line_height_base: data.settings.typography?.lineHeight?.toString() || data.settings.typography?.line_height_base || '1.6',
              heading_weight: data.settings.typography?.headingWeight || data.settings.typography?.heading_weight || 700,
              body_weight: data.settings.typography?.bodyWeight || data.settings.typography?.body_weight || 400,
            },
            layout: {
              max_width: data.settings.layout?.containerMaxWidth ? `${data.settings.layout.containerMaxWidth}px` : data.settings.layout?.max_width || '1200px',
              container_padding: data.settings.layout?.containerPadding ? `${data.settings.layout.containerPadding}px` : data.settings.layout?.container_padding || '24px',
              border_radius: data.settings.buttons?.borderRadius ? `${data.settings.buttons.borderRadius}px` : data.settings.layout?.border_radius || '4px',
              section_spacing: data.settings.layout?.sectionSpacing ? `${data.settings.layout.sectionSpacing}px` : data.settings.layout?.section_spacing || '64px',
              grid_gap: data.settings.layout?.gridGap ? `${data.settings.layout.gridGap}px` : data.settings.layout?.grid_gap || '24px',
            },
            buttons: {
              borderRadius: data.settings.buttons?.borderRadius || 4,
              padding: data.settings.buttons?.padding || '12px 24px',
              primaryStyle: data.settings.buttons?.primaryStyle || 'solid',
              secondaryStyle: data.settings.buttons?.secondaryStyle || 'outline',
            },
            cards: {
              borderRadius: data.settings.cards?.borderRadius || 8,
              shadow: data.settings.cards?.shadow || 'sm',
              hoverEffect: data.settings.cards?.hoverEffect || 'lift',
            },
            animations: {
              enabled: data.settings.animations?.enabled !== false,
              duration: data.settings.animations?.duration ? `${data.settings.animations.duration}ms` : '300ms',
              easing: data.settings.animations?.easing || 'ease-out',
            },
          });
        }
        setCustomCss(data.customCss || '');
        setCustomJs(data.customJs || '');
        setCustomHeadCode(data.customHeadCode || '');
      }
    } catch (error) {
      console.error('Error loading theme settings:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        setToast({ 
          message: 'הטעינה ארכה יותר מדי, נסה שוב',
          type: 'error'
        });
        setTimeout(() => setToast(null), 3000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (publish = false) => {
    if (!storeId) return;
    
    // Validation
    if (!isValidColor(settings.colors.primary) || !isValidColor(settings.colors.secondary)) {
      setToast({ 
        message: 'צבע לא תקין, השתמש בפורמט #RRGGBB',
        type: 'error'
      });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Prepare settings in the format expected by API
      const settingsToSave = {
        colors: settings.colors,
        typography: {
          headingFont: settings.typography.font_family_heading,
          bodyFont: settings.typography.font_family_body,
          baseFontSize: parseInt(settings.typography.font_size_base),
          lineHeight: parseFloat(settings.typography.line_height_base),
          headingWeight: settings.typography.heading_weight,
          bodyWeight: settings.typography.body_weight,
        },
        layout: {
          containerMaxWidth: parseInt(settings.layout.max_width),
          containerPadding: parseInt(settings.layout.container_padding),
          sectionSpacing: parseInt(settings.layout.section_spacing || '64'),
          gridGap: parseInt(settings.layout.grid_gap || '24'),
        },
        buttons: settings.buttons,
        cards: settings.cards,
        animations: {
          enabled: settings.animations.enabled,
          duration: parseInt(settings.animations.duration),
          easing: settings.animations.easing,
        },
      };

      const response = await fetch('/api/customizer/theme-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: settingsToSave,
          customCss,
          customJs,
          customHeadCode,
          isPublish: publish,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (onUpdate) onUpdate();
        // Show success message
        setToast({ 
          message: publish ? 'הגדרות פורסמו בהצלחה!' : 'הגדרות נשמרו כטיוטה',
          type: 'success'
        });
        setTimeout(() => {
          setToast(null);
          // Close modal after successful publish
          if (publish && onClose) {
            setTimeout(() => onClose(), 500);
          }
        }, 3000);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving theme settings:', error);
      setToast({ 
        message: 'שגיאה בשמירת ההגדרות',
        type: 'error'
      });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const isValidColor = (color: string): boolean => {
    return /^#[0-9A-F]{6}$/i.test(color);
  };

  const updateSettings = (path: string, value: any) => {
    const keys = path.split('.');
    const newSettings = { ...settings };
    let current: any = newSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setSettings(newSettings);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">טוען הגדרות...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'colors' as TabType, label: 'צבעים', icon: HiColorSwatch },
    { id: 'typography' as TabType, label: 'טיפוגרפיה', icon: HiDocumentText },
    { id: 'layout' as TabType, label: 'פריסה', icon: HiViewGridAdd },
    { id: 'components' as TabType, label: 'רכיבים', icon: HiTemplate },
    { id: 'code' as TabType, label: 'קוד מותאם', icon: HiCode },
  ];

  return (
    <div className="h-full flex flex-col" dir="rtl">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-rose-50 border border-rose-200'
          }`}>
            {toast.type === 'success' ? (
              <HiCheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <HiXCircle className="w-5 h-5 text-rose-400" />
            )}
            <span className={`text-sm font-medium ${toast.type === 'success' ? 'text-green-800' : 'text-rose-800'}`}>
              {toast.message}
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 px-6 pt-4 pb-3 border-b border-gray-200 bg-white">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">{renderTabContent()}</div>

      {/* Footer with Save Buttons */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white flex gap-3">
        <button
          onClick={() => handleSave(false)}
          disabled={isSaving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <HiSave className="w-4 h-4" />
          שמור כטיוטה
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={isSaving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>שומר...</span>
            </>
          ) : (
            <>
              <HiCheckCircle className="w-4 h-4" />
              <span>פרסם שינויים</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  function renderTabContent() {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">טוען הגדרות...</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'colors':
        return renderColorsTab();
      case 'typography':
        return renderTypographyTab();
      case 'layout':
        return renderLayoutTab();
      case 'components':
        return renderComponentsTab();
      case 'code':
        return renderCodeTab();
      default:
        return null;
    }
  }

  function renderColorsTab() {
    return (
      <div className="space-y-6">{renderColorsSection()}</div>
    );
  }

  function renderTypographyTab() {
    return (
      <div className="space-y-6">{renderTypographySection()}</div>
    );
  }

  function renderLayoutTab() {
    return (
      <div className="space-y-6">{renderLayoutSection()}</div>
    );
  }

  function renderComponentsTab() {
    return (
      <div className="space-y-6">
        {renderButtonsSection()}
        {renderCardsSection()}
        {renderAnimationsSection()}
      </div>
    );
  }

  function renderCodeTab() {
    return (
      <div className="space-y-6">{renderCustomCodeSection()}</div>
    );
  }

  function renderColorsSection() {
    return (
      <SettingGroup title="צבעי בסיס">
        <div className="space-y-4">
          <ColorPicker
            label="צבע ראשי"
            value={settings.colors.primary}
            onChange={(val) => updateSettings('colors.primary', val)}
          />
          <ColorPicker
            label="צבע משני"
            value={settings.colors.secondary}
            onChange={(val) => updateSettings('colors.secondary', val)}
          />
          <ColorPicker
            label="צבע דגש"
            value={settings.colors.accent}
            onChange={(val) => updateSettings('colors.accent', val)}
          />
          <ColorPicker
            label="צבע רקע"
            value={settings.colors.background}
            onChange={(val) => updateSettings('colors.background', val)}
          />
          <ColorPicker
            label="צבע טקסט"
            value={settings.colors.text}
            onChange={(val) => updateSettings('colors.text', val)}
          />
          <ColorPicker
            label="צבע טקסט משני"
            value={settings.colors.text_light}
            onChange={(val) => updateSettings('colors.text_light', val)}
          />
          <ColorPicker
            label="צבע מסגרת"
            value={settings.colors.border}
            onChange={(val) => updateSettings('colors.border', val)}
          />
          {settings.colors.surface && (
            <ColorPicker
              label="צבע משטח"
              value={settings.colors.surface}
              onChange={(val) => updateSettings('colors.surface', val)}
            />
          )}
          {settings.colors.error && (
            <ColorPicker
              label="צבע שגיאה"
              value={settings.colors.error}
              onChange={(val) => updateSettings('colors.error', val)}
            />
          )}
          {settings.colors.success && (
            <ColorPicker
              label="צבע הצלחה"
              value={settings.colors.success}
              onChange={(val) => updateSettings('colors.success', val)}
            />
          )}
        </div>
      </SettingGroup>
    );
  }

  function renderTypographySection() {
    return (
      <SettingGroup title="הגדרות פונט">
        <div className="space-y-4">
          <SettingSelect
            label="פונט כותרות"
            value={settings.typography.font_family_heading}
            onChange={(e) => updateSettings('typography.font_family_heading', e.target.value)}
            options={FONT_OPTIONS}
          />
          <SettingSelect
            label="פונט גוף"
            value={settings.typography.font_family_body}
            onChange={(e) => updateSettings('typography.font_family_body', e.target.value)}
            options={FONT_OPTIONS}
          />
          <SettingInput
            label="גודל פונט בסיסי"
            type="text"
            value={settings.typography.font_size_base}
            onChange={(e) => updateSettings('typography.font_size_base', e.target.value)}
            placeholder="16px"
          />
          <SettingInput
            label="גובה שורה"
            type="text"
            value={settings.typography.line_height_base}
            onChange={(e) => updateSettings('typography.line_height_base', e.target.value)}
            placeholder="1.6"
          />
          {settings.typography.heading_weight !== undefined && (
            <SettingSelect
              label="משקל פונט כותרות"
              value={settings.typography.heading_weight}
              onChange={(e) => updateSettings('typography.heading_weight', parseInt(e.target.value))}
              options={FONT_WEIGHT_OPTIONS}
            />
          )}
          {settings.typography.body_weight !== undefined && (
            <SettingSelect
              label="משקל פונט גוף"
              value={settings.typography.body_weight}
              onChange={(e) => updateSettings('typography.body_weight', parseInt(e.target.value))}
              options={FONT_WEIGHT_OPTIONS}
            />
          )}
        </div>
      </SettingGroup>
    );
  }

  function renderLayoutSection() {
    return (
      <SettingGroup title="הגדרות פריסה">
        <div className="space-y-4">
          <SettingInput
            label="רוחב מקסימלי"
            type="text"
            value={settings.layout.max_width}
            onChange={(e) => updateSettings('layout.max_width', e.target.value)}
            placeholder="1200px"
          />
          <SettingInput
            label="ריווח קונטיינר"
            type="text"
            value={settings.layout.container_padding}
            onChange={(e) => updateSettings('layout.container_padding', e.target.value)}
            placeholder="24px"
          />
          <SettingInput
            label="רדיוס פינות"
            type="text"
            value={settings.layout.border_radius}
            onChange={(e) => updateSettings('layout.border_radius', e.target.value)}
            placeholder="4px"
          />
          {settings.layout.section_spacing && (
            <SettingInput
              label="ריווח בין סקשנים"
              type="text"
              value={settings.layout.section_spacing}
              onChange={(e) => updateSettings('layout.section_spacing', e.target.value)}
              placeholder="64px"
            />
          )}
          {settings.layout.grid_gap && (
            <SettingInput
              label="ריווח רשת"
              type="text"
              value={settings.layout.grid_gap}
              onChange={(e) => updateSettings('layout.grid_gap', e.target.value)}
              placeholder="24px"
            />
          )}
        </div>
      </SettingGroup>
    );
  }

  function renderButtonsSection() {
    return (
      <SettingGroup title="כפתורים">
        <div className="space-y-4">
          <SettingInput
            label="רדיוס פינות"
            type="number"
            value={settings.buttons.borderRadius}
            onChange={(e) => updateSettings('buttons.borderRadius', parseInt(e.target.value) || 0)}
            placeholder="4"
          />
          <SettingInput
            label="ריווח פנימי"
            type="text"
            value={settings.buttons.padding}
            onChange={(e) => updateSettings('buttons.padding', e.target.value)}
            placeholder="12px 24px"
          />
          {settings.buttons.primaryStyle && (
            <SettingSelect
              label="סגנון כפתור ראשי"
              value={settings.buttons.primaryStyle}
              onChange={(e) => updateSettings('buttons.primaryStyle', e.target.value)}
              options={BUTTON_STYLE_OPTIONS}
            />
          )}
          {settings.buttons.secondaryStyle && (
            <SettingSelect
              label="סגנון כפתור משני"
              value={settings.buttons.secondaryStyle}
              onChange={(e) => updateSettings('buttons.secondaryStyle', e.target.value)}
              options={BUTTON_STYLE_OPTIONS}
            />
          )}
        </div>
      </SettingGroup>
    );
  }

  function renderCardsSection() {
    return (
      <SettingGroup title="כרטיסים">
        <div className="space-y-4">
          <SettingInput
            label="רדיוס פינות"
            type="number"
            value={settings.cards.borderRadius}
            onChange={(e) => updateSettings('cards.borderRadius', parseInt(e.target.value) || 0)}
            placeholder="8"
          />
          {settings.cards.shadow && (
            <SettingSelect
              label="צל"
              value={settings.cards.shadow}
              onChange={(e) => updateSettings('cards.shadow', e.target.value)}
              options={SHADOW_OPTIONS}
            />
          )}
          {settings.cards.hoverEffect && (
            <SettingSelect
              label="אפקט מעבר עכבר"
              value={settings.cards.hoverEffect}
              onChange={(e) => updateSettings('cards.hoverEffect', e.target.value)}
              options={HOVER_EFFECT_OPTIONS}
            />
          )}
        </div>
      </SettingGroup>
    );
  }

  function renderAnimationsSection() {
    return (
      <SettingGroup title="אנימציות">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-700">הפעל אנימציות</label>
            <button
              onClick={() => updateSettings('animations.enabled', !settings.animations.enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.animations.enabled ? 'bg-gray-900' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.animations.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          {settings.animations.enabled && (
            <>
              <SettingInput
                label="משך זמן"
                type="text"
                value={settings.animations.duration}
                onChange={(e) => updateSettings('animations.duration', e.target.value)}
                placeholder="300ms"
              />
              {settings.animations.easing && (
                <SettingInput
                  label="פונקציית מעבר"
                  type="text"
                  value={settings.animations.easing}
                  onChange={(e) => updateSettings('animations.easing', e.target.value)}
                  placeholder="ease-out"
                />
              )}
            </>
          )}
        </div>
      </SettingGroup>
    );
  }

  function renderCustomCodeSection() {
    return (
      <SettingGroup title="קוד מותאם אישית">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              CSS מותאם אישית
            </label>
            <textarea
              value={customCss}
              onChange={(e) => setCustomCss(e.target.value)}
              className="w-full h-32 px-3 py-2 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400/20 focus:border-gray-400"
              placeholder="/* הוסף קוד CSS מותאם אישית כאן */"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              JavaScript מותאם אישית
            </label>
            <textarea
              value={customJs}
              onChange={(e) => setCustomJs(e.target.value)}
              className="w-full h-32 px-3 py-2 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400/20 focus:border-gray-400"
              placeholder="// הוסף קוד JavaScript מותאם אישית כאן"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              קוד ל-Head
            </label>
            <textarea
              value={customHeadCode}
              onChange={(e) => setCustomHeadCode(e.target.value)}
              className="w-full h-32 px-3 py-2 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400/20 focus:border-gray-400"
              placeholder="<!-- הוסף קוד להזרקה ל-head כאן -->"
              dir="ltr"
            />
          </div>
        </div>
      </SettingGroup>
    );
  }
}

