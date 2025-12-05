'use client';

import { useState, useRef, useEffect } from 'react';

interface Country {
  code: string;
  name: string;
  currency: string;
  flag?: string;
}

const countries: Country[] = [
  { code: 'IL', name: 'ישראל', currency: 'ILS' },
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
  { code: 'EU', name: 'Europe', currency: 'EUR' },
  { code: 'CA', name: 'Canada', currency: 'CAD' },
  { code: 'AU', name: 'Australia', currency: 'AUD' },
];

export function CountrySelector() {
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load saved preference from localStorage
    const saved = localStorage.getItem('selectedCountry');
    if (saved) {
      const country = countries.find(c => c.code === saved);
      if (country) {
        setSelectedCountry(country);
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  const handleSelectCountry = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    localStorage.setItem('selectedCountry', country.code);
    // TODO: Update store locale/currency via API
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
        aria-label="בחירת מדינה ומטבע"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span>{selectedCountry.code}</span>
        <span className="text-gray-400">/</span>
        <span>{selectedCountry.currency}</span>
        <span className="text-xs text-gray-400">▼</span>
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 bg-white border border-gray-200 shadow-lg rounded-lg py-2 min-w-[200px] z-50"
          role="menu"
          aria-label="רשימת מדינות"
        >
          {countries.map((country) => (
            <button
              key={country.code}
              onClick={() => handleSelectCountry(country)}
              className={`w-full text-right px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                selectedCountry.code === country.code ? 'bg-gray-50 font-medium' : ''
              }`}
              role="menuitem"
            >
              <div className="flex items-center justify-between">
                <span>{country.name}</span>
                <span className="text-gray-500">{country.currency}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

