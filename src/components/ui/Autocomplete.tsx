'use client';

import { useState, useRef, useEffect, InputHTMLAttributes } from 'react';

interface AutocompleteOption {
  value: string;
  label: string;
}

interface AutocompleteProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onSelect'> {
  options?: AutocompleteOption[];
  loading?: boolean;
  onSelect?: (option: AutocompleteOption) => void;
  onChange?: (value: string) => void;
  className?: string;
}

export function Autocomplete({
  options = [],
  loading = false,
  onSelect,
  onChange,
  value,
  className = '',
  ...props
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange?.(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleSelect = (option: AutocompleteOption) => {
    onChange?.(option.value);
    onSelect?.(option);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || options.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < options.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          handleSelect(options[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const filteredOptions = (options || []).slice(0, 20); // מגבילים ל-20 תוצאות

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        className={`
          w-full py-2 border border-gray-300 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
          ${loading ? 'pr-4 pl-10' : 'px-4'}
          ${className}
        `}
        {...props}
      />
      
      {/* Loader בצד שמאל של האינפוט */}
      {loading && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
        </div>
      )}
      
      {isOpen && (filteredOptions.length > 0 || loading) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
          dir="rtl"
        >
          {loading ? (
            <div className="px-4 py-2 text-sm text-gray-500">טוען...</div>
          ) : filteredOptions.length === 0 ? (
            <div className="px-4 py-2 text-sm text-gray-500">לא נמצאו תוצאות</div>
          ) : (
            filteredOptions.map((option, index) => (
              <div
                key={`${option.value}-${index}`}
                onClick={() => handleSelect(option)}
                className={`
                  px-4 py-2 cursor-pointer text-sm text-gray-700 hover:bg-gray-100
                  ${highlightedIndex === index ? 'bg-gray-100' : ''}
                `}
              >
                {option.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

