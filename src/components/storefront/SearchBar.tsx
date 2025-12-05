'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { HiSearch, HiX } from 'react-icons/hi';
import { useTranslation } from '@/hooks/useTranslation';
import { TextSkeleton } from '@/components/ui/Skeleton';

export function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const params = useParams();
  const storeSlug = params?.storeSlug as string || '';
  const { t, loading: translationsLoading } = useTranslation('storefront');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setIsExpanded(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setIsExpanded(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shops/${storeSlug}/search?q=${encodeURIComponent(searchQuery)}`);
      setIsOpen(false);
      setIsExpanded(false);
      setSearchQuery('');
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          setIsExpanded(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label={translationsLoading ? 'חפש' : t('navigation.search')}
      >
        <HiSearch className="w-5 h-5 text-gray-600" />
      </button>
    );
  }

  return (
    <div className="relative">
      <form onSubmit={handleSearch} className="flex items-center">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={translationsLoading ? 'חפש מוצרים...' : (t('navigation.search_placeholder') || 'חפש מוצרים...')}
            className="w-64 px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            aria-label={translationsLoading ? 'חפש' : t('navigation.search')}
          />
          <button
            type="button"
            onClick={() => {
              setIsExpanded(false);
              setSearchQuery('');
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="סגור חיפוש"
          >
            <HiX className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <button
          type="submit"
          className="mr-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={translationsLoading ? 'חפש' : t('navigation.search')}
        >
          <HiSearch className="w-5 h-5 text-gray-600" />
        </button>
      </form>
    </div>
  );
}

