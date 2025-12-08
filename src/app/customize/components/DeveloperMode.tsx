/**
 * Customizer Module - Developer Mode Component
 * עורך קוד למתכנתים (CSS, HTML, JS)
 */

'use client';

import { useState, useEffect } from 'react';
import { PageType } from '@/lib/customizer/types';
import { HiCode } from 'react-icons/hi';

interface DeveloperModeProps {
  pageType: PageType;
  pageHandle?: string;
  onSave: (code: { css?: string; html?: string; js?: string }) => void;
}

export function DeveloperMode({ pageType, pageHandle, onSave }: DeveloperModeProps) {
  const [activeTab, setActiveTab] = useState<'css' | 'html' | 'js'>('css');
  const [cssCode, setCssCode] = useState('');
  const [htmlCode, setHtmlCode] = useState('');
  const [jsCode, setJsCode] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load existing code
    loadCode();
  }, [pageType, pageHandle]);

  async function loadCode() {
    try {
      const params = new URLSearchParams({
        pageType,
        draft: 'true',
      });
      if (pageHandle) {
        params.append('handle', pageHandle);
      }

      const response = await fetch(`/api/customizer/pages?${params}`);
      const data = await response.json();

      if (data.config) {
        setCssCode(data.config.custom_css || '');
        setJsCode(data.config.custom_js || '');
        // HTML would be in a different place, for now empty
        setHtmlCode('');
      }
    } catch (error) {
      console.error('Error loading code:', error);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      await onSave({
        css: cssCode,
        html: htmlCode,
        js: jsCode,
      });
    } catch (error) {
      console.error('Error saving code:', error);
      alert('שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  }

  const currentCode = {
    css: cssCode,
    html: htmlCode,
    js: jsCode,
  }[activeTab];

  const setCurrentCode = (value: string) => {
    switch (activeTab) {
      case 'css':
        setCssCode(value);
        break;
      case 'html':
        setHtmlCode(value);
        break;
      case 'js':
        setJsCode(value);
        break;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <HiCode className="w-5 h-5" />
            מצב מפתח
          </h3>
          <p className="text-sm text-gray-400">עריכת קוד CSS, HTML, JavaScript</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('css')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'css'
              ? 'border-green-500 text-green-400'
              : 'border-transparent text-gray-400 hover:text-gray-300'
          }`}
        >
          CSS
        </button>
        <button
          onClick={() => setActiveTab('html')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'html'
              ? 'border-green-500 text-green-400'
              : 'border-transparent text-gray-400 hover:text-gray-300'
          }`}
        >
          HTML
        </button>
        <button
          onClick={() => setActiveTab('js')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'js'
              ? 'border-green-500 text-green-400'
              : 'border-transparent text-gray-400 hover:text-gray-300'
          }`}
        >
          JavaScript
        </button>
      </div>

      {/* Code Editor */}
      <div className="flex-1 overflow-hidden">
        <textarea
          value={currentCode}
          onChange={(e) => setCurrentCode(e.target.value)}
          className="w-full h-full p-4 bg-gray-950 text-gray-100 font-mono text-sm resize-none focus:outline-none"
          placeholder={
            activeTab === 'css'
              ? '/* CSS מותאם */\n.my-custom-class {\n  color: #000;\n}'
              : activeTab === 'html'
              ? '<!-- HTML מותאם -->\n<div class="custom-section">\n  <!-- תוכן -->\n</div>'
              : '// JavaScript מותאם\n(function() {\n  // קוד שלך כאן\n})();'
          }
          spellCheck={false}
        />
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-gray-700 bg-gray-800 text-xs text-gray-400">
        <div className="flex items-center justify-between">
          <span>
            {activeTab === 'css' && '💡 CSS יוחל על כל העמוד'}
            {activeTab === 'html' && '💡 HTML יוחדר לפני סוף body'}
            {activeTab === 'js' && '💡 JavaScript יופעל לאחר טעינת העמוד'}
          </span>
          <span>
            שורות: {currentCode.split('\n').length} | תווים: {currentCode.length}
          </span>
        </div>
      </div>
    </div>
  );
}

