/**
 * Tracking Pixels Service - מערכת פיקסלים ומעקב
 * 
 * טוען פיקסלים מ-DB ומטמיע אותם בפרונט
 */

import { query } from '@/lib/db';

export interface TrackingPixel {
  id: number;
  store_id: number;
  name: string;
  pixel_type: string; // facebook, google_analytics, tiktok, custom
  pixel_id: string | null;
  pixel_code: string | null;
  placement: string; // head, body, footer
  is_active: boolean;
}

export interface TrackingCode {
  id: number;
  store_id: number;
  name: string;
  code_type: string | null; // script, noscript, custom_html
  code_content: string;
  placement: string; // head, body, footer
}

/**
 * טוען פיקסלים פעילים לחנות
 */
export async function getActivePixels(storeId: number): Promise<TrackingPixel[]> {
  return query<TrackingPixel>(
    'SELECT id, store_id, name, pixel_type, pixel_id, pixel_code, placement, is_active FROM tracking_pixels WHERE store_id = $1 AND is_active = true ORDER BY placement, id',
    [storeId]
  );
}

/**
 * טוען קודי מעקב פעילים לחנות
 */
export async function getActiveTrackingCodes(storeId: number): Promise<TrackingCode[]> {
  return query<TrackingCode>(
    'SELECT id, store_id, name, code_type, code_content, placement FROM tracking_codes WHERE store_id = $1 ORDER BY placement, id',
    [storeId]
  );
}

/**
 * טוען כל הפיקסלים והקודים לחנות
 */
export async function getAllTracking(storeId: number): Promise<{
  pixels: TrackingPixel[];
  codes: TrackingCode[];
}> {
  const [pixels, codes] = await Promise.all([
    getActivePixels(storeId),
    getActiveTrackingCodes(storeId),
  ]);

  return { pixels, codes };
}

