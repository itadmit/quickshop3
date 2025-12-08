/**
 * Customizer Module - Widget Settings Panel
 * פאנל עריכת הגדרות וידג'ט
 */

'use client';

import { useState, useEffect } from 'react';
import { TemplateWidget, SettingDefinition } from '@/lib/customizer/types';
import { getWidgetDefinition } from '@/lib/customizer/widgets';
import { HiX } from 'react-icons/hi';

interface WidgetSettingsProps {
  widget: TemplateWidget;
  templateType: 'product' | 'collection';
  onClose: () => void;
  onUpdate: (updatedWidget: TemplateWidget) => void;
}

export function WidgetSettings({
  widget,
  templateType,
  onClose,
  onUpdate,
}: WidgetSettingsProps) {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const widgetDef = getWidgetDefinition(widget.widget_type, templateType);

  useEffect(() => {
    if (widget) {
      setSettings(widget.settings_json || {});
    }
  }, [widget]);

  if (!widget || !widgetDef) {
    return null;
  }

  async function handleSave() {
    try {
      setSaving(true);
      const response = await fetch(`/api/customizer/templates/widgets/${widget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        const updatedWidget = { ...widget, settings_json: settings };
        onUpdate(updatedWidget);
        onClose();
      }
    } catch (error) {
      console.error('Error updating widget:', error);
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

  function renderSetting(setting: SettingDefinition) {
    switch (setting.type) {
      case 'text':
        return (
          <div key={setting.id} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {setting.label}
            </label>
            <input
              type="text"
              value={settings[setting.id] || setting.default || ''}
              onChange={(e) => updateSetting(setting.id, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder={setting.placeholder}
            />
            {setting.help && (
              <p className="text-xs text-gray-500 mt-1">{setting.help}</p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={setting.id} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {setting.label}
            </label>
            <input
              type="number"
              value={settings[setting.id] ?? setting.default ?? 0}
              onChange={(e) => updateSetting(setting.id, parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              min={setting.min}
              max={setting.max}
              step={setting.step}
            />
            {setting.help && (
              <p className="text-xs text-gray-500 mt-1">{setting.help}</p>
            )}
          </div>
        );

      case 'range':
        return (
          <div key={setting.id} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {setting.label}: {settings[setting.id] ?? setting.default ?? setting.min}
            </label>
            <input
              type="range"
              value={settings[setting.id] ?? setting.default ?? setting.min}
              onChange={(e) => updateSetting(setting.id, parseInt(e.target.value))}
              className="w-full"
              min={setting.min}
              max={setting.max}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{setting.min}</span>
              <span>{setting.max}</span>
            </div>
          </div>
        );

      case 'select':
        return (
          <div key={setting.id} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {setting.label}
            </label>
            <select
              value={settings[setting.id] || setting.default || ''}
              onChange={(e) => updateSetting(setting.id, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              {setting.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {setting.help && (
              <p className="text-xs text-gray-500 mt-1">{setting.help}</p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={setting.id} className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings[setting.id] ?? setting.default ?? false}
                onChange={(e) => updateSetting(setting.id, e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                {setting.label}
              </span>
            </label>
          </div>
        );

      case 'textarea':
        return (
          <div key={setting.id} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {setting.label}
            </label>
            <textarea
              value={settings[setting.id] || setting.default || ''}
              onChange={(e) => updateSetting(setting.id, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              rows={setting.rows || 4}
              placeholder={setting.placeholder}
            />
          </div>
        );

      case 'color':
        return (
          <div key={setting.id} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {setting.label}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings[setting.id] || setting.default || '#000000'}
                onChange={(e) => updateSetting(setting.id, e.target.value)}
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings[setting.id] || setting.default || '#000000'}
                onChange={(e) => updateSetting(setting.id, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                placeholder="#000000"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {widgetDef.name}
          </h3>
          <p className="text-sm text-gray-500">עריכת הגדרות וידג'ט</p>
          {widget.is_dynamic && (
            <p className="text-xs text-blue-600 mt-1">{widgetDef.variable}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-md"
          title="סגור"
        >
          <HiX className="w-5 h-5" />
        </button>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {widgetDef.settings && widgetDef.settings.length > 0 ? (
          widgetDef.settings.map((setting) => renderSetting(setting))
        ) : (
          <div className="text-sm text-gray-500 text-center py-8">
            אין הגדרות זמינות עבור וידג'ט זה
          </div>
        )}
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

