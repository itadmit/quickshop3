'use client';

import React, { useState, useEffect, useRef } from 'react';
import { HiX, HiDesktopComputer, HiDeviceMobile, HiRefresh } from 'react-icons/hi';
import { createPortal } from 'react-dom';

interface TypographyPopoverProps {
  open: boolean;
  onClose: () => void;
  anchorEl?: HTMLElement | null;
  typography: {
    color?: string;
    font_family?: string;
    font_size?: string;
    font_size_unit?: string;
    font_weight?: string;
    line_height?: string;
    line_height_unit?: string;
    letter_spacing?: string;
    letter_spacing_unit?: string;
    text_transform?: string;
    font_style?: string;
    text_decoration?: string;
  };
  onUpdate: (typography: TypographyPopoverProps['typography']) => void;
}

const UNITS = ['PX', 'EM', 'REM', 'VW', '%'];

export function TypographyPopover({ 
  open, 
  onClose, 
  anchorEl,
  typography, 
  onUpdate 
}: TypographyPopoverProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const popoverRef = useRef<HTMLDivElement>(null);

  // Calculate position - start from the button
  useEffect(() => {
    if (open && anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      const popoverWidth = 320;
      const margin = 10;
      
      // Position to the left of the anchor (RTL) - start from button position
      let left = rect.left - popoverWidth - margin;
      
      // If not enough space on left, position to the right
      if (left < margin) {
        left = rect.right + margin;
      }
      
      // Ensure it doesn't go off screen
      left = Math.max(margin, Math.min(left, window.innerWidth - popoverWidth - margin));
      
      // Start from button's top position
      setPosition({
        top: rect.top,
        left: left
      });
    }
  }, [open, anchorEl]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node) && anchorEl && !anchorEl.contains(event.target as Node)) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose, anchorEl]);

  if (!open) return null;

  const handleChange = (key: string, value: any) => {
    onUpdate({
      ...typography,
      [key]: value
    });
  };

  const handleUnitChange = (key: string, unit: string) => {
    // When unit changes, we might want to convert values, but for now just update unit
    handleChange(`${key}_unit`, unit);
  };

  const parseValue = (val: string | undefined) => {
    if (!val) return 0;
    return parseFloat(val.replace(/[^\d.-]/g, '')) || 0;
  };

  const renderSliderControl = (
    label: string, 
    valueKey: string, 
    unitKey: string, 
    min: number, 
    max: number, 
    step: number = 1,
    availableUnits: string[] = UNITS
  ) => {
    const currentValue = parseValue(typography[valueKey as keyof typeof typography]);
    const currentUnit = (typography[unitKey as keyof typeof typography] || 'PX').toUpperCase();

    return (
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-gray-500 font-medium">{label}</label>
          <HiDesktopComputer className="w-3 h-3 text-gray-400" />
        </div>
        
        <div className="flex gap-1 mb-2">
          {availableUnits.map(u => (
            <button
              key={u}
              onClick={() => handleUnitChange(valueKey, u)}
              className={`px-2 py-0.5 text-[10px] font-medium transition-colors rounded ${
                currentUnit === u 
                  ? 'text-gray-800 bg-gray-200 border border-gray-400' 
                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {u}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <input
            type="number"
            value={currentValue}
            onChange={(e) => {
              const val = e.target.value;
              handleChange(valueKey, val ? `${val}${currentUnit.toLowerCase()}` : '');
            }}
            className="w-16 p-1.5 text-xs border border-gray-200 rounded text-center focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 bg-white"
            dir="ltr"
          />
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={currentValue}
            onChange={(e) => handleChange(valueKey, `${e.target.value}${currentUnit.toLowerCase()}`)}
            className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-600 hover:accent-gray-700"
            style={{
              background: `linear-gradient(to right, #4b5563 0%, #4b5563 ${((currentValue - min) / (max - min)) * 100}%, #e5e7eb ${((currentValue - min) / (max - min)) * 100}%, #e5e7eb 100%)`
            }}
          />
        </div>
      </div>
    );
  };

  const content = (
      <div 
      ref={popoverRef}
      className="fixed z-[100] bg-white rounded-lg shadow-xl border border-gray-200 w-[320px] overflow-hidden"
      style={{ 
        top: Math.max(10, Math.min(window.innerHeight - 500, position.top)), 
        left: Math.max(10, position.left) 
      }}
      dir="rtl"
    >
      <div className="p-2 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center">
            <span className="text-gray-800 font-bold text-xs" style={{ fontFamily: 'Arial, sans-serif' }}>Aa</span>
          </div>
          <h3 className="text-xs font-semibold text-gray-800">טיפוגרפיה</h3>
        </div>
        <div className="flex items-center gap-0.5">
          <button 
            onClick={() => {
                // Reset to defaults
                onUpdate({});
            }}
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="אפס"
          >
            <HiRefresh className="w-3 h-3" />
          </button>
          <button 
            onClick={onClose} 
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <HiX className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="p-4 max-h-[600px] overflow-y-auto custom-scrollbar">
        {/* Font Family */}
        <div className="mb-4 space-y-1.5">
          <label className="text-xs text-gray-500 font-medium">סוג</label>
          <select 
            value={typography.font_family || '"Noto Sans Hebrew", sans-serif'}
            onChange={(e) => handleChange('font_family', e.target.value)}
            className="w-full p-2 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 bg-white hover:border-gray-400 transition-colors"
            style={{ fontFamily: typography.font_family || '"Noto Sans Hebrew", sans-serif' }}
          >
            <option value='"Noto Sans Hebrew", sans-serif' style={{ fontFamily: '"Noto Sans Hebrew", sans-serif' }}>ברירת מחדל</option>
            <option value='"Assistant", sans-serif' style={{ fontFamily: '"Assistant", sans-serif' }}>Assistant</option>
            <option value='"Rubik", sans-serif' style={{ fontFamily: '"Rubik", sans-serif' }}>Rubik</option>
            <option value='"Heebo", sans-serif' style={{ fontFamily: '"Heebo", sans-serif' }}>Heebo</option>
            <option value='Arial, sans-serif' style={{ fontFamily: 'Arial, sans-serif' }}>Arial</option>
            <option value='system-ui' style={{ fontFamily: 'system-ui' }}>System UI</option>
          </select>
        </div>

        {/* Font Size */}
        {renderSliderControl('גודל', 'font_size', 'font_size_unit', 0, 100, 1, ['PX', 'EM', 'REM', 'VW', '%'])}

        {/* Font Weight and Transform - Same Row */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500 font-medium">משקל</label>
            <select 
              value={typography.font_weight || '400'}
              onChange={(e) => handleChange('font_weight', e.target.value)}
              className="w-full p-2 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 bg-white hover:border-gray-400 transition-colors"
            >
              <option value="300">דק (300)</option>
              <option value="400">ברירת מחדל</option>
              <option value="500">בינוני (500)</option>
              <option value="600">חצי מודגש (600)</option>
              <option value="700">מודגש (700)</option>
              <option value="800">מודגש מאוד (800)</option>
              <option value="900">שחור (900)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500 font-medium">Transform</label>
            <select 
              value={typography.text_transform || 'none'}
              onChange={(e) => handleChange('text_transform', e.target.value)}
              className="w-full p-2 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 bg-white hover:border-gray-400 transition-colors"
            >
              <option value="none">ברירת מחדל</option>
              <option value="uppercase">אותיות גדולות</option>
              <option value="lowercase">אותיות קטנות</option>
              <option value="capitalize">אות רישית</option>
            </select>
          </div>
        </div>

        {/* Line Height */}
        {renderSliderControl('גובה שורה', 'line_height', 'line_height_unit', 0, 4, 0.1, ['PX', 'EM'])}

        {/* Letter Spacing */}
        {renderSliderControl('מרווח אותיות', 'letter_spacing', 'letter_spacing_unit', -5, 10, 0.1, ['PX', 'EM'])}
        
        {/* Color */}
        <div className="mb-4 space-y-1.5">
            <label className="text-xs text-gray-500 font-medium">צבע</label>
            <div className="flex items-center gap-2 border border-gray-200 p-1.5 rounded-md hover:border-gray-300 transition-colors bg-white">
                <input 
                    type="color" 
                    value={typography.color || '#000000'}
                    onChange={(e) => handleChange('color', e.target.value)}
                    className="w-7 h-7 p-0 border border-gray-200 rounded cursor-pointer"
                />
                <input 
                    type="text" 
                    value={typography.color || '#000000'}
                    onChange={(e) => handleChange('color', e.target.value)}
                    className="flex-1 text-xs outline-none font-mono uppercase bg-transparent"
                    dir="ltr"
                />
            </div>
        </div>

      </div>
    </div>
  );

  return createPortal(content, document.body);
}

