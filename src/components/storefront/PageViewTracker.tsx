/**
 * PageView Tracker - מעקב אחר צפיות בדפים
 * 
 * שולח אירוע PageView לכל הפיקסלים בכל טעינת עמוד
 */

'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { emitTrackingEvent } from '@/lib/tracking/events';

export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Track PageView
    emitTrackingEvent({
      event: 'PageView',
      page_path: pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : ''),
      page_title: document.title,
      referrer: document.referrer || undefined,
    });
  }, [pathname, searchParams]);

  return null;
}

