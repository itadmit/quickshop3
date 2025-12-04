'use client';

import { ReactNode, useState, useRef, useEffect, createContext, useContext } from 'react';
import { HiChevronDown } from 'react-icons/hi';

interface SelectContextType {
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextType | undefined>(undefined);

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
}

export function Select({ value, onValueChange, children }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative" ref={ref}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ children, className = '' }: { children: ReactNode; className?: string }) {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectTrigger must be used within Select');

  return (
    <button
      type="button"
      onClick={() => context.setOpen(!context.open)}
      className={`
        w-full px-4 py-2 border border-gray-300 rounded-lg bg-white
        flex items-center justify-between
        focus:outline-none focus:ring-2 focus:ring-green-500
        ${className}
      `}
    >
      {children}
      <HiChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${context.open ? 'rotate-180' : ''}`} />
    </button>
  );
}

export function SelectValue({ placeholder, children }: { placeholder?: string; children?: ReactNode }) {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectValue must be used within Select');

  // If children provided, use them (for custom display)
  if (children) {
    return <span className="text-gray-700">{children}</span>;
  }

  return <span className="text-gray-700">{context.value || placeholder || 'בחר...'}</span>;
}

export function SelectContent({ children }: { children: ReactNode }) {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectContent must be used within Select');

  if (!context.open) return null;

  return (
    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
      {children}
    </div>
  );
}

export function SelectItem({ value, children, className = '' }: { value: string; children: ReactNode; className?: string }) {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectItem must be used within Select');

  const isSelected = context.value === value;

  return (
    <div
      onClick={() => {
        context.onValueChange?.(value);
        context.setOpen(false);
      }}
      className={`
        px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700
        ${isSelected ? 'bg-green-50 text-green-700' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

