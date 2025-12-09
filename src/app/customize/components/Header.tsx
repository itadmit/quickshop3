'use client';

import React from 'react';
import { HiDeviceMobile, HiDeviceTablet, HiDesktopComputer, HiEye, HiUpload } from 'react-icons/hi';
import { cn } from '@/lib/utils';

export type DeviceType = 'desktop' | 'tablet' | 'mobile';

interface HeaderProps {
  onPreview: () => void;
  onPublish: () => void;
  device: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
  isPublishing?: boolean;
}

export function Header({ onPreview, onPublish, device, onDeviceChange, isPublishing = false }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-10 relative">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
        </div>
        <div className="flex flex-col">
            <h1 className="text-sm font-bold text-gray-900 leading-tight">עורך החנות</h1>
            <span className="text-xs text-gray-500">תבנית New York</span>
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
