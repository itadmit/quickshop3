'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Scroll to top component - scrolls to top when route changes
 * This ensures that when navigating between pages, the page starts from the top
 */
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // Scroll to top when pathname changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' as ScrollBehavior, // Use 'instant' for immediate scroll, or 'smooth' for smooth scroll
    });
  }, [pathname]);

  return null;
}

