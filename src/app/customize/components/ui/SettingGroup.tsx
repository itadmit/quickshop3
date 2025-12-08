import React from 'react';
import { HiChevronDown, HiChevronUp } from 'react-icons/hi';

interface SettingGroupProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function SettingGroup({ title, children, defaultOpen = true }: SettingGroupProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-4 px-1 text-left hover:bg-gray-50/50 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-900">{title}</span>
        {isOpen ? (
          <HiChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <HiChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      
      {isOpen && (
        <div className="pb-4 px-1 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

