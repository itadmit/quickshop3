import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { quickshopList, quickshopItem } from '@/lib/utils/apiFormatter';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/popups - List all popups
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const storeId = user.store_id;
    const isActive = searchParams.get('is_active');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let sql = `SELECT * FROM popups WHERE store_id = $1`;
    const params: any[] = [storeId];
    let paramIndex = 2;

    if (isActive !== null) {
      sql += ` AND is_active = $${paramIndex}`;
      params.push(isActive === 'true');
      paramIndex++;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const popups = await query(sql, params);

    return NextResponse.json(quickshopList('popups', popups));
  } catch (error: any) {
    console.error('Error fetching popups:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch popups' },
      { status: 500 }
    );
  }
}

// POST /api/popups - Create popup
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const storeId = user.store_id;
    const {
      name,
      title,
      content_html,
      trigger_type = 'time',
      trigger_value,
      display_rules,
      is_active = true,
      starts_at,
      ends_at,
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const popup = await queryOne(
      `INSERT INTO popups (
        store_id, name, title, content_html, trigger_type, trigger_value,
        display_rules, is_active, starts_at, ends_at, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), now())
      RETURNING *`,
      [
        storeId,
        name,
        title || null,
        content_html || null,
        trigger_type,
        trigger_value || null,
        display_rules ? JSON.stringify(display_rules) : null,
        is_active,
        starts_at || null,
        ends_at || null,
      ]
    );

    await eventBus.emitEvent('popup.created', {
      popup: popup,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json(quickshopItem('popup', popup));
  } catch (error: any) {
    console.error('Error creating popup:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create popup' },
      { status: 500 }
    );
  }
}

