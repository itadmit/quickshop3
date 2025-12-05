'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface RadioGroupContextType {
  value?: string;
  onValueChange?: (value: string) => void;
}

const RadioGroupContext = createContext<RadioGroupContextType | undefined>(undefined);

interface RadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export function RadioGroup({ value, onValueChange, children, className = '' }: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div className={`space-y-2 ${className}`}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

interface RadioGroupItemProps {
  value: string;
  id?: string;
  children?: ReactNode;
  className?: string;
}

export function RadioGroupItem({ value, id, children, className = '' }: RadioGroupItemProps) {
  const context = useContext(RadioGroupContext);
  if (!context) throw new Error('RadioGroupItem must be used within RadioGroup');

  const isSelected = context.value === value;
  const generatedId = id || `radio-${value}-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`flex items-center space-x-2 space-x-reverse ${className}`}>
      <input
        type="radio"
        id={generatedId}
        value={value}
        checked={isSelected}
        onChange={() => context.onValueChange?.(value)}
        className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500 cursor-pointer"
      />
      {children && (
        <label htmlFor={generatedId} className="cursor-pointer flex-1">
          {children}
        </label>
      )}
    </div>
  );
}

