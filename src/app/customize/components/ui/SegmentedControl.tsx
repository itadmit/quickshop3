import React from 'react';

interface SegmentedControlProps {
  options: { label: string; value: string; icon?: React.ReactNode }[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export function SegmentedControl({ options, value, onChange, label, className = '' }: SegmentedControlProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="bg-gray-100 p-1 rounded-lg flex relative">
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all relative z-10 ${
                isSelected
                  ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
              }`}
              type="button"
            >
              {option.icon && <span className={isSelected ? 'text-gray-900' : 'text-gray-500'}>{option.icon}</span>}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

