'use client';

import React, { useState } from 'react';
import { HiChevronDown, HiCheck, HiChevronUp } from 'react-icons/hi';

// --- Layout Components ---

interface SettingGroupProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function SettingGroup({ title, children }: SettingGroupProps) {
  return (
    <div className="border-b border-gray-200 last:border-0">
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
      </div>
      <div className="p-4 space-y-4 bg-white">{children}</div>
    </div>
  );
}

interface SettingRowProps {
  label?: string;
  helpText?: string;
  children: React.ReactNode;
  className?: string;
}

export function SettingRow({ label, helpText, children, className = '' }: SettingRowProps) {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      {children}
      {helpText && (
        <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">{helpText}</p>
      )}
    </div>
  );
}

// --- Input Components ---

interface BaseInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  fullWidth?: boolean;
}

export function ModernInput({ fullWidth = true, className = '', ...props }: BaseInputProps) {
  return (
    <input
      className={`
        block rounded-md border-gray-300 shadow-sm 
        focus:border-green-500 focus:ring-green-500 sm:text-sm py-2 px-3
        disabled:bg-gray-100 disabled:text-gray-500
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    />
  );
}

interface ModernTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  fullWidth?: boolean;
}

export function ModernTextArea({ fullWidth = true, className = '', rows = 3, ...props }: ModernTextAreaProps) {
  return (
    <textarea
      rows={rows}
      className={`
        block rounded-md border-gray-300 shadow-sm 
        focus:border-green-500 focus:ring-green-500 sm:text-sm py-2 px-3
        disabled:bg-gray-100 disabled:text-gray-500
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    />
  );
}

interface ModernSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<{ value: string | number; label: string }>;
  fullWidth?: boolean;
}

export function ModernSelect({ options, fullWidth = true, className = '', ...props }: ModernSelectProps) {
  return (
    <div className="relative">
      <select
        className={`
          block rounded-md border-gray-300 shadow-sm 
          focus:border-green-500 focus:ring-green-500 sm:text-sm py-2 px-3 pr-8
          disabled:bg-gray-100 disabled:text-gray-500 appearance-none
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
        <HiChevronDown className="h-4 w-4" />
      </div>
    </div>
  );
}

interface ModernToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function ModernToggle({ checked, onChange, label }: ModernToggleProps) {
  return (
    <div className="flex items-center justify-between">
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${checked ? 'bg-green-600' : 'bg-gray-200'}
        `}
        role="switch"
        aria-checked={checked}
      >
        <span
          aria-hidden="true"
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
            ${checked ? 'translate-x-0' : 'translate-x-5'}
          `}
        />
      </button>
    </div>
  );
}

interface ModernSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  unit?: string;
}

export function ModernSlider({ value, min, max, step = 1, onChange, unit }: ModernSliderProps) {
  return (
    <div className="flex items-center gap-4">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
      <div className="w-16 flex items-center justify-end border border-gray-300 rounded px-2 py-1 bg-white">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const val = Math.min(Math.max(Number(e.target.value), min), max);
            onChange(val);
          }}
          className="w-full text-right text-sm focus:outline-none p-0 border-none"
        />
        {unit && <span className="text-xs text-gray-500 mr-1">{unit}</span>}
      </div>
    </div>
  );
}

interface ModernColorPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function ModernColorPicker({ value, onChange }: ModernColorPickerProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-300 shadow-sm">
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 p-0 m-0 border-none cursor-pointer"
        />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 uppercase font-mono text-sm border border-gray-300 rounded-md px-3 py-2 focus:border-green-500 focus:ring-green-500"
        placeholder="#000000"
      />
    </div>
  );
}

