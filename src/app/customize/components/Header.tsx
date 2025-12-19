'use client';

import React from 'react';
import { HiDeviceMobile, HiDeviceTablet, HiDesktopComputer, HiEye, HiUpload, HiDownload, HiChevronDown, HiCog, HiArrowRight } from 'react-icons/hi';
import { cn } from '@/lib/utils';
import { PageType } from '@/lib/customizer/types';
import Link from 'next/link';

export type DeviceType = 'desktop' | 'tablet' | 'mobile';

// Page type options for the dropdown
const PAGE_TYPE_OPTIONS: Array<{ value: PageType; label: string; description: string }> = [
  { value: 'home', label: 'דף הבית', description: 'עמוד ראשי של החנות' },
  { value: 'product', label: 'עמוד מוצר', description: 'תבנית לעמודי מוצר' },
  { value: 'collection', label: 'עמוד קטגוריה', description: 'תבנית לעמודי קטגוריה' },
  { value: 'checkout', label: 'עמוד צ\'ק אאוט', description: 'התאמת עמוד התשלום' },
  { value: 'page', label: 'עמוד תוכן', description: 'תבנית לעמודי תוכן' },
];

interface HeaderProps {
  onPreview: () => void;
  onPublish: () => void;
  onTemplates: () => void;
  onGeneralSettings?: () => void;
  device: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
  isPublishing?: boolean;
  pageType?: PageType;
  onPageTypeChange?: (pageType: PageType) => void;
}

export function Header({ 
  onPreview, 
  onPublish, 
  onTemplates,
  onGeneralSettings,
  device, 
  onDeviceChange, 
  isPublishing = false,
  pageType = 'home',
  onPageTypeChange
}: HeaderProps) {
  const [isPageTypeOpen, setIsPageTypeOpen] = React.useState(false);
  const currentPage = PAGE_TYPE_OPTIONS.find(p => p.value === pageType) || PAGE_TYPE_OPTIONS[0];

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-10 relative">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
          title="חזרה לדשבורד"
        >
          <HiArrowRight className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
        </Link>
        <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
        </div>
        <div className="flex flex-col">
            <h1 className="text-sm font-bold text-gray-900 leading-tight">עורך החנות</h1>
            <span className="text-xs text-gray-500">תבנית New York</span>
        </div>
      </div>

      {/* Page Type Selector - Center */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <div className="relative">
          <button
            onClick={() => setIsPageTypeOpen(!isPageTypeOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200"
          >
            <span className="text-sm font-medium text-gray-900">{currentPage.label}</span>
            <HiChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform", isPageTypeOpen && "rotate-180")} />
          </button>
          
          {isPageTypeOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsPageTypeOpen(false)} 
              />
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[200px] z-20">
                {PAGE_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onPageTypeChange?.(option.value);
                      setIsPageTypeOpen(false);
                    }}
                    className={cn(
                      "w-full px-4 py-2 text-right hover:bg-gray-50 transition-colors",
                      pageType === option.value && "bg-gray-100"
                    )}
                  >
                    <div className="text-sm font-medium text-gray-900">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Device Preview Buttons */}
        <div className="hidden md:flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200 gap-1">
          <button 
            onClick={() => onDeviceChange('desktop')}
            className={cn(
              "p-2 rounded-md transition-all",
              device === 'desktop' 
                ? "bg-white text-gray-900 shadow-sm" 
                : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
            )}
            title="דסקטופ"
          >
            <HiDesktopComputer className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => onDeviceChange('tablet')}
            className={cn(
              "p-2 rounded-md transition-all",
              device === 'tablet' 
                ? "bg-white text-gray-900 shadow-sm" 
                : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
            )}
            title="טאבלט"
          >
            <HiDeviceTablet className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => onDeviceChange('mobile')}
            className={cn(
              "p-2 rounded-md transition-all",
              device === 'mobile' 
                ? "bg-white text-gray-900 shadow-sm" 
                : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
            )}
            title="מובייל"
          >
            <HiDeviceMobile className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Action Buttons */}
        {onGeneralSettings && (
          <button
            onClick={onGeneralSettings}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
            title="הגדרות כלליות"
          >
            <HiCog className="w-4 h-4" />
            <span className="hidden sm:inline">הגדרות כלליות</span>
          </button>
        )}
        <button
          onClick={onTemplates}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <HiDownload className="w-4 h-4" />
          <span className="hidden sm:inline">ייבוא/ייצוא</span>
        </button>

        <button
          onClick={onPreview}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <HiEye className="w-4 h-4" />
          <span className="hidden sm:inline">תצוגה מקדימה</span>
        </button>

        <button
          onClick={onPublish}
          disabled={isPublishing}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm min-w-[100px] justify-center",
            isPublishing 
              ? "bg-gray-400 cursor-not-allowed" 
              : "bg-gray-900 hover:bg-gray-800"
          )}
        >
          {isPublishing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>שומר...</span>
            </>
          ) : (
            <>
          <HiUpload className="w-4 h-4" />
          <span>פרסם</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
