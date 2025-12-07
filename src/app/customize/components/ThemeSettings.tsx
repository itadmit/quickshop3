/**
 * Customizer Module - Theme Settings Panel
 * פאנל הגדרות תבנית גלובליות
 */

'use client';

import { useState, useEffect } from 'react';
import { ThemeGlobalSettings } from '@/lib/customizer/types';

interface ThemeSettingsProps {
  onClose: () => void;
  onUpdate: () => void;
}

export function ThemeSettings({ onClose, onUpdate }: ThemeSettingsProps) {
  const [settings, setSettings] = useState<ThemeGlobalSettings>({
    colors: {
      primary: '#000000',
      secondary: '#666666',
      accent: '#10B981',
      background: '#FFFFFF',
      surface: '#F9FAFB',
      text: '#000000',
      muted: '#6B7280',
      border: '#E5E7EB',
      error: '#EF4444',
      success: '#10B981',
    },
    typography: {
      headingFont: 'Heebo',
      bodyFont: 'Heebo',
      baseFontSize: 16,
      lineHeight: 1.6,
      headingWeight: 700,
      bodyWeight: 400,
    },
    layout: {
      containerMaxWidth: 1200,
      containerPadding: 24,
      sectionSpacing: 64,
      gridGap: 24,
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
      duration: 300,
      easing: 'ease-out',
    },
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const response = await fetch('/api/customizer/theme-settings');
      const data = await response.json();
      
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading theme settings:', error);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      // TODO: Save to API
      const response = await fetch('/api/customizer/theme-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        onUpdate();
        onClose();
      }
    } catch (error) {
      console.error('Error saving theme settings:', error);
      alert('שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  }

  function updateColor(key: keyof typeof settings.colors, value: string) {
    setSettings((prev) => ({
      ...prev,
      colors: {
        ...prev.colors,
        [key]: value,
      },
    }));
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">⚙️ הגדרות תבנית</h3>
          <p className="text-sm text-gray-500">הגדרות גלובליות לכל העמודים</p>
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
        {/* Colors */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">צבעים</h4>
          <div className="space-y-3">
            {Object.entries(settings.colors).map(([key, value]) => (
              <div key={key} className="flex items-center gap-3">
                <label className="w-24 text-sm text-gray-700 capitalize">
                  {key.replace(/_/g, ' ')}
                </label>
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => updateColor(key as keyof typeof settings.colors, e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => updateColor(key as keyof typeof settings.colors, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Typography */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">טיפוגרפיה</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">גופן כותרות</label>
              <select
                value={settings.typography.headingFont}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    typography: { ...prev.typography, headingFont: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="Heebo">Heebo</option>
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Georgia">Georgia</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">גופן גוף</label>
              <select
                value={settings.typography.bodyFont}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    typography: { ...prev.typography, bodyFont: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="Heebo">Heebo</option>
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Georgia">Georgia</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                גודל בסיס: {settings.typography.baseFontSize}px
              </label>
              <input
                type="range"
                min="12"
                max="24"
                value={settings.typography.baseFontSize}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    typography: { ...prev.typography, baseFontSize: parseInt(e.target.value) },
                  }))
                }
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Layout */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">פריסה</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                רוחב מקסימלי: {settings.layout.containerMaxWidth}px
              </label>
              <input
                type="range"
                min="800"
                max="1920"
                step="40"
                value={settings.layout.containerMaxWidth}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    layout: { ...prev.layout, containerMaxWidth: parseInt(e.target.value) },
                  }))
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                ריווח בין סקשנים: {settings.layout.sectionSpacing}px
              </label>
              <input
                type="range"
                min="0"
                max="120"
                step="8"
                value={settings.layout.sectionSpacing}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    layout: { ...prev.layout, sectionSpacing: parseInt(e.target.value) },
                  }))
                }
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">כפתורים</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                פינות מעוגלות: {settings.buttons?.borderRadius || 4}px
              </label>
              <input
                type="range"
                min="0"
                max="20"
                value={settings.buttons?.borderRadius || 4}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    buttons: { ...prev.buttons!, borderRadius: parseInt(e.target.value) },
                  }))
                }
                className="w-full"
              />
            </div>
          </div>
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

