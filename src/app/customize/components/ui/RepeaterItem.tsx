import React from 'react';
import { HiChevronDown, HiTrash, HiMenuAlt4 } from 'react-icons/hi';

interface RepeaterItemProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  onRemove: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  preview?: React.ReactNode;
  dragHandle?: boolean;
}

export function RepeaterItem({
  title,
  isOpen,
  onToggle,
  onRemove,
  children,
  icon,
  preview,
  dragHandle = true
}: RepeaterItemProps) {
  return (
    <div 
      className={`border rounded-lg transition-all duration-200 overflow-hidden group ${
        isOpen 
          ? 'border-gray-900 ring-1 ring-gray-900/5 bg-white shadow-sm' 
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      {/* Header */}
      <div 
        className={`flex items-center justify-between p-3 cursor-pointer select-none transition-colors ${isOpen ? 'bg-gray-50 border-b border-gray-100' : 'hover:bg-gray-50'}`}
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {dragHandle && (
            <div className="text-gray-400 cursor-grab active:cursor-grabbing p-1 hover:text-gray-600 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              <HiMenuAlt4 className="w-4 h-4" />
            </div>
          )}
          
          {/* Thumbnail Preview */}
          <div className="w-8 h-8 rounded bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
            {preview ? (
              preview
            ) : icon ? (
              <div className="text-gray-500">{icon}</div>
            ) : (
              <div className="w-2 h-2 rounded-full bg-gray-300" />
            )}
          </div>
          
          <span className="font-medium text-sm text-gray-900 truncate">
            {title}
          </span>
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            title="מחק"
          >
            <HiTrash className="w-4 h-4" />
          </button>
          <div className={`p-1.5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            <HiChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Content */}
      {isOpen && (
        <div className="p-4 space-y-5 animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

