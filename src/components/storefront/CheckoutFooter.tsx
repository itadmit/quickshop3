'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface NavigationItem {
  id: number;
  title: string;
  url: string | null;
  type: string;
  resource_handle: string | null;
  position: number;
}

interface CheckoutFooterProps {
  storeSlug: string;
}

export function CheckoutFooter({ storeSlug }: CheckoutFooterProps) {
  const [menuItems, setMenuItems] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        // Fetch checkout footer menu
        const response = await fetch(`/api/storefront/${storeSlug}/navigation?handle=checkout-footer`);
        if (response.ok) {
          const data = await response.json();
          if (data.menu?.items) {
            setMenuItems(data.menu.items.sort((a: NavigationItem, b: NavigationItem) => a.position - b.position));
          }
        }
      } catch (error) {
        console.error('Error fetching checkout footer menu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [storeSlug]);

  // אם אין פריטים בתפריט או עדיין טוען, לא להציג כלום
  if (loading || menuItems.length === 0) {
    return null;
  }

  // Build URL for each menu item
  const getItemUrl = (item: NavigationItem): string => {
    if (item.url) {
      // If it's an absolute URL, return as is
      if (item.url.startsWith('http')) {
        return item.url;
      }
      // Otherwise, prepend the store path
      return `/shops/${storeSlug}${item.url.startsWith('/') ? item.url : `/${item.url}`}`;
    }
    
    if (item.type === 'page' && item.resource_handle) {
      return `/shops/${storeSlug}/p/${item.resource_handle}`;
    }
    
    return '#';
  };

  return (
    <footer className="border-t border-gray-200 bg-white py-4">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex items-center justify-center gap-6 flex-wrap">
          {menuItems.map((item, index) => (
            <span key={item.id} className="flex items-center">
              <Link
                href={getItemUrl(item)}
                target={item.url?.startsWith('http') ? '_blank' : undefined}
                rel={item.url?.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                {item.title}
              </Link>
              {index < menuItems.length - 1 && (
                <span className="text-gray-300 mr-6">|</span>
              )}
            </span>
          ))}
        </nav>
      </div>
    </footer>
  );
}

