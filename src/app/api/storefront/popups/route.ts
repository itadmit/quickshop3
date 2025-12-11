import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/storefront/popups?storeId=X
 * טוען פופאפים פעילים לחנות מסוימת (ללא authentication - לפרונט)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId is required' },
        { status: 400 }
      );
    }

    const storeIdNum = parseInt(storeId, 10);
    if (isNaN(storeIdNum) || storeIdNum <= 0) {
      return NextResponse.json(
        { error: 'Invalid storeId' },
        { status: 400 }
      );
    }

    const now = new Date();

    // טעינת פופאפים פעילים בלבד
    const popups = await query(
      `SELECT 
        id, name, title, content_html, trigger_type, trigger_value,
        display_rules, starts_at, ends_at
      FROM popups 
      WHERE store_id = $1 
        AND is_active = true
        AND (starts_at IS NULL OR starts_at <= $2)
        AND (ends_at IS NULL OR ends_at >= $2)
      ORDER BY created_at DESC`,
      [storeIdNum, now]
    );

    return NextResponse.json({ popups });
  } catch (error: any) {
    console.error('Error fetching popups:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch popups' },
      { status: 500 }
    );
  }
}



