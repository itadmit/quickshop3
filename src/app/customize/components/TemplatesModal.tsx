'use client';

import React, { useState } from 'react';
import { HiX, HiDownload, HiUpload, HiCheckCircle } from 'react-icons/hi';
import { SectionSettings } from '@/lib/customizer/types';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: SectionSettings[];
  onImport: (sections: SectionSettings[]) => void;
}

export function TemplatesModal({ isOpen, onClose, sections, onImport }: TemplatesModalProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('import');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    try {
      const templateData = {
        version: '1.0',
        name: 'תבנית מותאמת',
        description: 'תבנית שנוצרה ב-' + new Date().toLocaleDateString('he-IL'),
        sections: sections,
        exportedAt: new Date().toISOString()
      };

      const jsonString = JSON.stringify(templateData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `template-${new Date().getTime()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2000);
    } catch (error) {
      console.error('Error exporting template:', error);
      setImportError('שגיאה בייצוא התבנית');
    }
  };

  const handleImport = () => {
    try {
      setImportError(null);
      
      if (!importText.trim()) {
        setImportError('אנא הזן נתוני תבנית');
        return;
      }

      const templateData = JSON.parse(importText);
      
      if (!templateData.sections || !Array.isArray(templateData.sections)) {
        setImportError('פורמט תבנית לא תקין - חסרים sections');
        return;
      }

      // Validate sections structure
      const validSections = templateData.sections.filter((section: any) => {
        return section.id && section.type && section.name !== undefined;
      });

      if (validSections.length === 0) {
        setImportError('לא נמצאו sections תקינים בתבנית');
        return;
      }

      // Confirm import
      const confirmed = window.confirm(
        `האם אתה בטוח שברצונך לייבא תבנית זו?\nזה יחליף את כל ה-sections הנוכחיים.\n\nנמצאו ${validSections.length} sections.`
      );

      if (confirmed) {
        onImport(validSections);
        setImportText('');
        onClose();
      }
    } catch (error) {
      console.error('Error importing template:', error);
      setImportError('שגיאה בייבוא התבנית - אנא ודא שהקוד JSON תקין');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportText(content);
    };
    reader.onerror = () => {
      setImportError('שגיאה בקריאת הקובץ');
    };
    reader.readAsText(file);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" 
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">תבניות</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="סגור"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 px-6 py-3.5 text-sm font-medium transition-all ${
              activeTab === 'import'
                ? 'text-gray-900 border-b-2 border-gray-900 bg-gray-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <HiUpload className="w-4 h-4" />
              ייבוא
            </div>
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 px-6 py-3.5 text-sm font-medium transition-all ${
              activeTab === 'export'
                ? 'text-gray-900 border-b-2 border-gray-900 bg-gray-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <HiDownload className="w-4 h-4" />
              ייצוא
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'import' && (
            <div className="p-6 space-y-5">
              {/* Warning Box */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-yellow-900 mb-1.5">אזהרה</h3>
                <p className="text-sm text-yellow-800 leading-relaxed">
                  ייבוא תבנית יחליף את כל ה-sections הנוכחיים שלך. ודא שיש לך גיבוי לפני המשך.
                </p>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  העלה קובץ JSON
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-600 file:ml-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-900 file:text-white hover:file:bg-gray-800 file:cursor-pointer transition-colors"
                />
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">או</span>
                </div>
              </div>

              {/* Text Area */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  הדבק תוכן JSON
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => {
                    setImportText(e.target.value);
                    setImportError(null);
                  }}
                  placeholder='{"version": "1.0", "sections": [...]}'
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors resize-none"
                />
              </div>

              {/* Error Message */}
              {importError && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                  <p className="text-sm text-rose-800 font-medium">{importError}</p>
                </div>
              )}

              {/* Import Button */}
              <button
                onClick={handleImport}
                disabled={!importText.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
              >
                <HiUpload className="w-5 h-5" />
                <span>ייבא תבנית</span>
              </button>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="p-6 space-y-5">
              {/* Info Box */}
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                <p className="text-sm text-gray-800 leading-relaxed">
                  ייצא את כל ה-sections הנוכחיים שלך כקובץ JSON. תוכל להשתמש בקובץ זה כדי לשתף תבניות או לשחזר אותן מאוחר יותר.
                </p>
              </div>

              {/* Stats */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">מספר sections</span>
                    <span className="text-base font-semibold text-gray-900">{sections.length}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-sm text-gray-600">סוגי sections</span>
                      <div className="flex flex-wrap gap-1.5 justify-end max-w-[60%]">
                        {[...new Set(sections.map(s => s.type))].map((type, idx) => (
                          <span 
                            key={idx}
                            className="inline-block px-2 py-1 text-xs font-medium bg-white text-gray-700 rounded border border-gray-300"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Export Button */}
              <button
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium shadow-sm"
              >
                {exportSuccess ? (
                  <>
                    <HiCheckCircle className="w-5 h-5" />
                    <span>היוצא בהצלחה!</span>
                  </>
                ) : (
                  <>
                    <HiDownload className="w-5 h-5" />
                    <span>ייצא תבנית</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

