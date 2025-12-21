/**
 * Category View Tracker - מעקב אחר צפיות בקטגוריות
 * 
 * שולח אירוע ViewCategory כשמסתכלים על קטגוריה
 */

'use client';

import { useEffect } from 'react';
import { emitTrackingEvent } from '@/lib/tracking/events';

interface CategoryViewTrackerProps {
  categoryId: number;
  categoryName: string;
  itemsCount?: number;
}

export function CategoryViewTracker({
  categoryId,
  categoryName,
  itemsCount,
}: CategoryViewTrackerProps) {
  useEffect(() => {
    // Track ViewCategory
    emitTrackingEvent({
      event: 'ViewCategory',
      category_id: String(categoryId),
      category_name: categoryName,
      items_count: itemsCount,
    });
  }, [categoryId, categoryName, itemsCount]);

  return null;
}

