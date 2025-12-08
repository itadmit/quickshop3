'use client';

import { InputHTMLAttributes, useRef, useEffect } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', type, ...props }: InputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input || type !== 'number') return;

    // Prevent wheel scroll from changing number input value
    const handleWheel = (e: WheelEvent) => {
      // Only prevent if input is focused
      if (document.activeElement === input) {
        e.preventDefault();
        // Prevent the default behavior but keep focus
        e.stopPropagation();
      }
    };

    input.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      input.removeEventListener('wheel', handleWheel);
    };
  }, [type]);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        type={type}
        className={`
          w-full px-4 py-2 border border-gray-300 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

