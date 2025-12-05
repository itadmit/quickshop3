/**
 * Product View Tracker - מעקב אחר צפיות במוצרים
 * 
 * שולח אירוע ViewContent כשמסתכלים על מוצר
 */

'use client';

import { useEffect } from 'react';
import { emitTrackingEvent } from '@/lib/tracking/events';

interface ProductViewTrackerProps {
  productId: number;
  productTitle: string;
  price: number;
  currency?: string;
}

export function ProductViewTracker({
  productId,
  productTitle,
  price,
  currency = 'ILS',
}: ProductViewTrackerProps) {
  useEffect(() => {
    // Track ViewContent
    emitTrackingEvent({
      event: 'ViewContent',
      content_type: 'product',
      content_ids: [String(productId)],
      contents: [{
        id: String(productId),
        quantity: 1,
        item_price: price,
      }],
      currency,
      value: price,
    });
  }, [productId, price, currency]);

  return null;
}

