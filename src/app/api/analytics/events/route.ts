import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getStoreIdBySlug } from '@/lib/utils/store';

/**
 * POST /api/analytics/events
 * שומר events של אנליטיקס ב-database (מצד הלקוח)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeSlug, storeId: directStoreId, event, metadata } = body;

    // קבלת store_id
    let storeId = directStoreId;
    if (!storeId && storeSlug) {
      storeId = await getStoreIdBySlug(storeSlug);
    }

    if (!storeId) {
      return NextResponse.json(
        { error: 'Store ID or slug required' },
        { status: 400 }
      );
    }

    if (!event) {
      return NextResponse.json(
        { error: 'Event type required' },
        { status: 400 }
      );
    }

    // שמירת ה-event ב-analytics_events
    await query(
      `INSERT INTO analytics_events (store_id, event_type, metadata)
       VALUES ($1, $2, $3)`,
      [storeId, event, JSON.stringify(metadata || {})]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving analytics event:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save event' },
      { status: 500 }
    );
  }
}

