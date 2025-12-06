import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { quickshopList, quickshopItem } from '@/lib/utils/apiFormatter';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/gift-cards - List all gift cards
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const storeId = user.store_id;
    const customerId = searchParams.get('customer_id');
    const code = searchParams.get('code');
    const isActive = searchParams.get('is_active');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let sql = `SELECT * FROM gift_cards WHERE store_id = $1`;
    const params: any[] = [storeId];
    let paramIndex = 2;

    if (customerId) {
      sql += ` AND customer_id = $${paramIndex}`;
      params.push(parseInt(customerId));
      paramIndex++;
    }

    if (code) {
      sql += ` AND code = $${paramIndex}`;
      params.push(code);
      paramIndex++;
    }

    if (isActive !== null) {
      sql += ` AND is_active = $${paramIndex}`;
      params.push(isActive === 'true');
      paramIndex++;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const giftCards = await query(sql, params);

    return NextResponse.json(quickshopList('gift_cards', giftCards));
  } catch (error: any) {
    console.error('Error fetching gift cards:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch gift cards' },
      { status: 500 }
    );
  }
}

// POST /api/gift-cards - Create gift card
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const storeId = user.store_id;
    const { code, initial_value, currency = 'ILS', expires_at, customer_id, order_id, note } = body;

    if (!code || !initial_value) {
      return NextResponse.json({ error: 'code and initial_value are required' }, { status: 400 });
    }

    // Check if code already exists
    const existing = await queryOne(
      `SELECT * FROM gift_cards WHERE code = $1 OR (store_id = $2 AND code = $3)`,
      [code, storeId, code]
    );

    if (existing) {
      return NextResponse.json({ error: 'Gift card code already exists' }, { status: 400 });
    }

    const giftCard = await queryOne(
      `INSERT INTO gift_cards (
        store_id, code, initial_value, current_value, currency, expires_at, 
        customer_id, order_id, note, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())
      RETURNING *`,
      [
        storeId,
        code,
        initial_value,
        initial_value, // current_value starts same as initial_value
        currency,
        expires_at || null,
        customer_id || null,
        order_id || null,
        note || null,
      ]
    );

    await eventBus.emitEvent('gift_card.created', {
      gift_card: giftCard,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json(quickshopItem('gift_card', giftCard));
  } catch (error: any) {
    console.error('Error creating gift card:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create gift card' },
      { status: 500 }
    );
  }
}

