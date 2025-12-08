import React from 'react';

interface SettingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  suffix?: string;
}

export function SettingInput({ label, description, suffix, className = '', ...props }: SettingInputProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <label className="block text-xs font-medium text-gray-700">
          {label}
        </label>
        {description && (
          <span className="text-[10px] text-gray-400">{description}</span>
        )}
      </div>
      <div className="relative">
        <input
          className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${className}`}
          {...props}
        />
        {suffix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

