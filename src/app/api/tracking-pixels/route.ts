import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/tracking-pixels - Get all pixels for a store
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json(
        { error: 'Store ID required' },
        { status: 400 }
      );
    }

    const pixels = await query<any>(
      `SELECT id, store_id, name, pixel_type, pixel_id, pixel_code, 
              CASE WHEN access_token IS NOT NULL THEN '***' ELSE NULL END as access_token,
              placement, is_active, events, created_at
       FROM tracking_pixels 
       WHERE store_id = $1 
       ORDER BY created_at DESC`,
      [storeId]
    );

    const codes = await query<any>(
      `SELECT id, store_id, name, code_type, code_content, placement
       FROM tracking_codes 
       WHERE store_id = $1 
       ORDER BY id`,
      [storeId]
    );

    return NextResponse.json({ pixels, codes });
  } catch (error: any) {
    console.error('Error fetching tracking pixels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracking pixels' },
      { status: 500 }
    );
  }
}

// POST /api/tracking-pixels - Create new pixel
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      storeId,
      name,
      pixel_type,
      pixel_id,
      pixel_code,
      access_token,
      placement = 'head',
      is_active = true,
      events = [],
    } = body;

    if (!storeId) {
      return NextResponse.json(
        { error: 'Store ID required' },
        { status: 400 }
      );
    }

    if (!pixel_type) {
      return NextResponse.json(
        { error: 'Pixel type required' },
        { status: 400 }
      );
    }

    // For non-custom pixels, pixel_id is required
    if (pixel_type !== 'custom' && !pixel_id) {
      return NextResponse.json(
        { error: 'Pixel ID required' },
        { status: 400 }
      );
    }

    // For custom pixels, pixel_code is required
    if (pixel_type === 'custom' && !pixel_code) {
      return NextResponse.json(
        { error: 'Pixel code required for custom type' },
        { status: 400 }
      );
    }

    const result = await queryOne<{ id: number }>(
      `INSERT INTO tracking_pixels 
       (store_id, name, pixel_type, pixel_id, pixel_code, access_token, placement, is_active, events)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        storeId,
        name || `${pixel_type} Pixel`,
        pixel_type,
        pixel_id || null,
        pixel_code || null,
        access_token || null,
        placement,
        is_active,
        JSON.stringify(events),
      ]
    );

    return NextResponse.json({ success: true, id: result?.id });
  } catch (error: any) {
    console.error('Error creating tracking pixel:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create tracking pixel' },
      { status: 500 }
    );
  }
}

