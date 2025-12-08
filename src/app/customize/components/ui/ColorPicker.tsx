import React, { useState, useEffect, useRef } from 'react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    if (newValue.startsWith('#') && (newValue.length === 4 || newValue.length === 7)) {
        onChange(newValue);
    }
  };

  const handleBlur = () => {
      if (localValue !== value) {
          onChange(localValue);
      }
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-700">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <div className="relative w-8 h-8 rounded-full border border-gray-200 overflow-hidden shadow-sm flex-shrink-0 cursor-pointer hover:scale-105 transition-transform">
           <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer p-0 border-0"
          />
          <div 
            className="w-full h-full"
            style={{ backgroundColor: value }}
          />
        </div>
        <div className="flex-1 relative">
            <input
                ref={inputRef}
                type="text"
                value={localValue}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full pl-3 pr-8 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all uppercase font-mono text-gray-600"
                maxLength={7}
            />
             <div 
                className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-gray-100 shadow-sm"
                style={{ backgroundColor: value }}
            />
        </div>
      </div>
    </div>
  );
}

