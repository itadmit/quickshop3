'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { HiArrowRight, HiSave, HiCode, HiEye, HiRefresh } from 'react-icons/hi';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface CustomCode {
  css: string;
  headScripts: string;
  bodyScripts: string;
}

const defaultCode: CustomCode = {
  css: `/* CSS מותאם אישית
   הוסף כאן את הסגנונות שלך */

/* דוגמה:
.my-custom-class {
  color: #333;
  font-size: 16px;
}
*/`,
  headScripts: `<!-- סקריפטים לתוך <head>
     הוסף כאן סקריפטים שצריכים להיטען בראש העמוד -->

<!-- דוגמה: Google Analytics, Facebook Pixel וכו' -->`,
  bodyScripts: `<!-- סקריפטים לפני </body>
     הוסף כאן סקריפטים שצריכים להיטען בסוף העמוד -->

<!-- דוגמה: Chat widgets, Tracking scripts וכו' -->`,
};

export default function ThemeCodePage() {
  const { toast } = useOptimisticToast();
  const [activeTab, setActiveTab] = useState<'css' | 'headScripts' | 'bodyScripts'>('css');
  const [code, setCode] = useState<CustomCode>(defaultCode);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load saved code on mount
  useEffect(() => {
    const loadCode = async () => {
      try {
        const response = await fetch('/api/theme/custom-code');
        if (response.ok) {
          const data = await response.json();
          if (data.code) {
            setCode(data.code);
          }
        }
      } catch (error) {
        console.error('Failed to load custom code:', error);
      }
    };
    loadCode();
  }, []);

  const handleCodeChange = (value: string) => {
    setCode(prev => ({ ...prev, [activeTab]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/theme/custom-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (response.ok) {
        toast({
          title: 'נשמר בהצלחה',
          description: 'הקוד המותאם אישית נשמר',
        });
        setHasChanges(false);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בשמירת הקוד',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('האם אתה בטוח שברצונך לאפס את הקוד לברירת המחדל?')) {
      setCode(defaultCode);
      setHasChanges(true);
    }
  };

  const tabs = [
    { id: 'css', label: 'CSS מותאם אישית', icon: '🎨' },
    { id: 'headScripts', label: 'סקריפטים (Head)', icon: '📜' },
    { id: 'bodyScripts', label: 'סקריפטים (Body)', icon: '⚡' },
  ] as const;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/themes"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <HiArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <HiCode className="w-6 h-6" />
              עריכת קוד מותאם אישית
            </h1>
            <p className="text-gray-500 mt-1">הוסף CSS וסקריפטים מותאמים אישית לחנות שלך</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <HiRefresh className="w-4 h-4" />
            איפוס
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
              hasChanges
                ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            <HiSave className="w-4 h-4" />
            {isSaving ? 'שומר...' : 'שמור שינויים'}
          </button>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <span className="text-2xl">⚠️</span>
        <div>
          <h3 className="font-medium text-amber-800">שים לב</h3>
          <p className="text-sm text-amber-700 mt-1">
            שינויים בקוד מותאם אישית עלולים להשפיע על המראה והתפקוד של החנות. 
            מומלץ לבדוק את השינויים בתצוגה מקדימה לפני השמירה.
          </p>
        </div>
      </div>

      {/* Editor */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'text-gray-900 border-gray-900 bg-white'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Code Editor */}
        <div className="relative">
          <textarea
            value={code[activeTab]}
            onChange={(e) => handleCodeChange(e.target.value)}
            className="w-full h-[500px] p-6 font-mono text-sm bg-gray-900 text-gray-100 focus:outline-none resize-none"
            style={{ 
              direction: 'ltr', 
              textAlign: 'left',
              tabSize: 2,
            }}
            spellCheck={false}
            placeholder={activeTab === 'css' ? '/* הוסף CSS כאן */' : '<!-- הוסף סקריפטים כאן -->'}
          />
          
          {/* Line numbers indicator */}
          <div className="absolute top-4 left-4 text-xs text-gray-500 font-mono">
            {code[activeTab].split('\n').length} שורות
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {activeTab === 'css' && 'הקוד יתווסף לקובץ ה-CSS הראשי של החנות'}
            {activeTab === 'headScripts' && 'הסקריפטים יתווספו לפני סגירת תגית <head>'}
            {activeTab === 'bodyScripts' && 'הסקריפטים יתווספו לפני סגירת תגית </body>'}
          </div>
          <div className="flex items-center gap-2 text-sm">
            {hasChanges && (
              <span className="text-amber-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                יש שינויים שלא נשמרו
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-2xl mb-3">🎨</div>
          <h3 className="font-semibold text-gray-900 mb-2">CSS מותאם אישית</h3>
          <p className="text-sm text-gray-600">
            הוסף סגנונות CSS מותאמים כדי לשנות את המראה של רכיבים ספציפיים בחנות.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-2xl mb-3">📜</div>
          <h3 className="font-semibold text-gray-900 mb-2">סקריפטי Head</h3>
          <p className="text-sm text-gray-600">
            מתאים לסקריפטי מעקב כמו Google Analytics, Facebook Pixel, או meta tags.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-2xl mb-3">⚡</div>
          <h3 className="font-semibold text-gray-900 mb-2">סקריפטי Body</h3>
          <p className="text-sm text-gray-600">
            מתאים לווידג'טים כמו צ'אט חי, כפתורי שיתוף חברתי, או סקריפטים שצריכים DOM מוכן.
          </p>
        </div>
      </div>
    </div>
  );
}

