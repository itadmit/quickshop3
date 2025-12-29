'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';

interface Category {
  id: number;
  name: string;
  handle: string;
  children?: Category[];
}

interface MegaMenuProps {
  categories: Category[];
}

export function MegaMenu({ categories }: MegaMenuProps) {
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const params = useParams();
  const storeSlug = params?.storeSlug as string || '';
  const { t } = useTranslation('storefront');

  const handleMouseEnter = (categoryId: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setHoveredCategory(categoryId);
    setOpenDropdown(categoryId);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setHoveredCategory(null);
      setOpenDropdown(null);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <nav className="mega-menu" aria-label="ניווט ראשי">
      <div className="flex items-center gap-6">
        {categories.map((category) => (
          <div
            key={category.id}
            className="relative"
            onMouseEnter={() => handleMouseEnter(category.id)}
            onMouseLeave={handleMouseLeave}
          >
            <Link
              href={`/shops/${storeSlug}/categories/${category.handle}`}
              prefetch={true}
              className="text-gray-700 hover:text-gray-900 font-medium transition-colors py-2 block"
              aria-haspopup={category.children && category.children.length > 0 ? 'true' : undefined}
              aria-expanded={openDropdown === category.id ? 'true' : 'false'}
            >
              {category.name}
              {category.children && category.children.length > 0 && (
                <span className="mr-1 text-xs">▼</span>
              )}
            </Link>

            {category.children && category.children.length > 0 && openDropdown === category.id && (
              <div
                className="absolute top-full right-0 mt-2 bg-white border border-gray-200 shadow-lg rounded-lg p-6 min-w-[600px] z-50"
                role="menu"
                aria-label={`תת-קטגוריות של ${category.name}`}
              >
                <div className="grid grid-cols-3 gap-6">
                  {category.children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/shops/${storeSlug}/categories/${child.handle}`}
                      className="text-gray-700 hover:text-black transition-colors py-2 block"
                      role="menuitem"
                      onClick={() => {
                        setOpenDropdown(null);
                        setHoveredCategory(null);
                      }}
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}

