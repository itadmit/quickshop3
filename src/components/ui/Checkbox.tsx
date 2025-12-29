'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { HiCheck } from 'react-icons/hi';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ checked, onCheckedChange, className = '', id, ...props }, ref) => {
    const generatedId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <div className="relative inline-flex items-center">
        <input
          ref={ref}
          id={generatedId}
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className="sr-only peer"
          {...props}
        />
        <label
          htmlFor={generatedId}
          onClick={(e) => e.stopPropagation()}
          className={`
            w-5 h-5 rounded-md border-2 cursor-pointer
            transition-all duration-200 ease-in-out
            flex items-center justify-center
            peer-checked:bg-green-500 peer-checked:border-green-500
            peer-checked:shadow-md peer-checked:shadow-green-200
            peer-focus:ring-2 peer-focus:ring-green-400 peer-focus:ring-offset-2
            peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
            border-gray-300 bg-white hover:border-green-400
            ${className}
          `}
        >
          <HiCheck 
            className={`
              w-3.5 h-3.5 text-white transition-all duration-150
              ${checked ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}
            `}
          />
        </label>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

