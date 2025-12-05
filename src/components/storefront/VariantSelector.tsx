'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface VariantOption {
  id: number;
  name: string;
  value: string;
  available: boolean;
  metadata?: {
    color?: string;
    image?: string;
    images?: string[];
    pattern?: string;
  };
}

interface VariantSelectorProps {
  type: 'color' | 'size' | 'other';
  label: string;
  options: VariantOption[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  syncWithURL?: boolean;
  urlParam?: string;
}

export function VariantSelector({
  type,
  label,
  options,
  selectedValue,
  onSelect,
  syncWithURL = true,
  urlParam,
}: VariantSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<string>(selectedValue || options[0]?.value || '');

  // Sync with selectedValue prop (for parent-controlled selection)
  useEffect(() => {
    if (selectedValue && selectedValue !== selected) {
      setSelected(selectedValue);
    }
  }, [selectedValue, selected]);

  // Sync with URL params
  useEffect(() => {
    if (syncWithURL && urlParam) {
      const urlValue = searchParams.get(urlParam);
      if (urlValue && options.some(opt => opt.value === urlValue)) {
        setSelected(urlValue);
        onSelect(urlValue);
      }
    }
  }, [searchParams, syncWithURL, urlParam, options, onSelect]);

  // Update URL when selection changes
  useEffect(() => {
    if (syncWithURL && urlParam && selected) {
      const params = new URLSearchParams(searchParams.toString());
      params.set(urlParam, selected);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [selected, syncWithURL, urlParam, router, searchParams]);

  const handleSelect = (value: string) => {
    setSelected(value);
    onSelect(value);
  };

  if (type === 'color') {
    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {label}:
        </label>
        <div className="flex gap-3 flex-wrap">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.value)}
              disabled={!option.available}
              className={`w-10 h-10 rounded-full border-2 transition-all ${
                selected === option.value
                  ? 'border-black scale-110'
                  : 'border-gray-300 hover:border-gray-400'
              } ${
                !option.available
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer'
              }`}
              style={{ backgroundColor: option.metadata?.color || option.value }}
              aria-label={`${label}: ${option.name}`}
              aria-pressed={selected === option.value}
              title={option.name}
            >
              {selected === option.value && (
                <span className="text-white text-xs">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'size') {
    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {label}:
        </label>
        <div className="flex gap-2 flex-wrap">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.value)}
              disabled={!option.available}
              className={`px-4 py-2 border-2 rounded-lg font-medium transition-all ${
                selected === option.value
                  ? 'border-black bg-black text-white'
                  : 'border-gray-300 hover:border-gray-400'
              } ${
                !option.available
                  ? 'opacity-50 cursor-not-allowed line-through'
                  : 'cursor-pointer'
              }`}
              aria-label={`${label}: ${option.name}`}
              aria-pressed={selected === option.value}
            >
              {option.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Generic selector (dropdown)
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}:
      </label>
      <select
        value={selected}
        onChange={(e) => handleSelect(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
        aria-label={label}
      >
        {options.map((option) => (
          <option
            key={option.id}
            value={option.value}
            disabled={!option.available}
          >
            {option.name} {!option.available && '(לא זמין)'}
          </option>
        ))}
      </select>
    </div>
  );
}

