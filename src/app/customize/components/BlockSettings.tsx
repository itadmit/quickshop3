/**
 * Customizer Module - Block Settings Panel
 * פאנל עריכת הגדרות בלוק
 */

'use client';

import { useState, useEffect } from 'react';
import { updateBlock } from '../actions';
import { SectionBlock } from '@/lib/customizer/types';
import { HiX } from 'react-icons/hi';

interface BlockSettingsProps {
  block: SectionBlock;
  onClose: () => void;
  onUpdate: () => void;
}

export function BlockSettings({ block, onClose, onUpdate }: BlockSettingsProps) {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (block) {
      setSettings(block.settings_json || {});
    }
  }, [block]);

  async function handleSave() {
    try {
      setSaving(true);
      await updateBlock({
        block_id: block.id,
        settings,
      });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating block:', error);
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

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {block.block_type}
          </h3>
          <p className="text-sm text-gray-500">עריכת הגדרות בלוק</p>
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
        {/* Block Type Specific Settings */}
        {block.block_type === 'image_slide' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                תמונה
              </label>
              <input
                type="url"
                value={settings.image || ''}
                onChange={(e) => updateSetting('image', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                כותרת
              </label>
              <input
                type="text"
                value={settings.heading || ''}
                onChange={(e) => updateSetting('heading', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="הכנס כותרת"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                תיאור
              </label>
              <textarea
                value={settings.description || ''}
                onChange={(e) => updateSetting('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                rows={3}
                placeholder="הכנס תיאור"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                טקסט כפתור
              </label>
              <input
                type="text"
                value={settings.button_text || ''}
                onChange={(e) => updateSetting('button_text', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="קנה עכשיו"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                קישור כפתור
              </label>
              <input
                type="url"
                value={settings.button_link || ''}
                onChange={(e) => updateSetting('button_link', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="/collections/new"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                יישור תוכן
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => updateSetting('content_alignment', 'right')}
                  className={`flex-1 px-3 py-2 rounded-md text-sm ${
                    settings.content_alignment === 'right'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ימין
                </button>
                <button
                  onClick={() => updateSetting('content_alignment', 'center')}
                  className={`flex-1 px-3 py-2 rounded-md text-sm ${
                    settings.content_alignment === 'center'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  מרכז
                </button>
                <button
                  onClick={() => updateSetting('content_alignment', 'left')}
                  className={`flex-1 px-3 py-2 rounded-md text-sm ${
                    settings.content_alignment === 'left'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  שמאל
                </button>
              </div>
            </div>
          </>
        )}

        {block.block_type === 'collection' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                קטגוריה
              </label>
              <select
                value={settings.collection_id || ''}
                onChange={(e) => updateSetting('collection_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">בחר קטגוריה</option>
                {/* TODO: Load collections from API */}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                תמונה
              </label>
              <input
                type="url"
                value={settings.image || ''}
                onChange={(e) => updateSetting('image', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </>
        )}

        {block.block_type === 'testimonial' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                שם הכותב
              </label>
              <input
                type="text"
                value={settings.author || ''}
                onChange={(e) => updateSetting('author', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="שם הכותב"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                תוכן הביקורת
              </label>
              <textarea
                value={settings.content || ''}
                onChange={(e) => updateSetting('content', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                rows={4}
                placeholder="תוכן הביקורת"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                דירוג (1-5)
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={settings.rating || 5}
                onChange={(e) => updateSetting('rating', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-gray-500 mt-1">
                {settings.rating || 5} כוכבים
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                תמונה
              </label>
              <input
                type="url"
                value={settings.image || ''}
                onChange={(e) => updateSetting('image', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </>
        )}

        {block.block_type === 'question' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                שאלה
              </label>
              <input
                type="text"
                value={settings.question || ''}
                onChange={(e) => updateSetting('question', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="הכנס שאלה"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                תשובה
              </label>
              <textarea
                value={settings.answer || ''}
                onChange={(e) => updateSetting('answer', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                rows={4}
                placeholder="הכנס תשובה"
              />
            </div>
          </>
        )}

        {block.block_type === 'tab' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                כותרת טאב
              </label>
              <input
                type="text"
                value={settings.title || ''}
                onChange={(e) => updateSetting('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="כותרת הטאב"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                תוכן טאב
              </label>
              <textarea
                value={settings.content || ''}
                onChange={(e) => updateSetting('content', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                rows={6}
                placeholder="תוכן הטאב"
              />
            </div>
          </>
        )}

        {/* Generic Settings for all blocks */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">הגדרות כלליות</h4>
          
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={block.is_visible}
                onChange={(e) => {
                  // This will be handled by parent component
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                disabled
              />
              <span className="text-sm text-gray-700">גלוי</span>
            </label>
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

