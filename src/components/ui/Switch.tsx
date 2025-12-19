'use client';

import { InputHTMLAttributes } from 'react';

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function Switch({ checked, onCheckedChange, className = '', ...props }: SwitchProps) {
  return (
    <label className={`relative inline-flex items-center cursor-pointer ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="sr-only peer"
        {...props}
      />
      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:bg-green-600 transition-colors">
        <div 
          className={`absolute top-0.5 w-5 h-5 bg-white border border-gray-300 rounded-full transition-all ${
            checked ? 'left-0.5 border-white' : 'left-[22px]'
          }`}
        />
      </div>
    </label>
  );
}
