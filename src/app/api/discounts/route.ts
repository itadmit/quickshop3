import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { DiscountCode, CreateDiscountCodeRequest } from '@/types/discount';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/discounts - List all discount codes
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const isActive = searchParams.get('is_active');

    let sql = 'SELECT * FROM discount_codes WHERE store_id = $1';
    const params: any[] = [user.store_id];

    if (isActive !== null) {
      sql += ' AND is_active = $2';
      params.push(isActive === 'true');
    }

    sql += ' ORDER BY created_at DESC';

    const discounts = await query<DiscountCode>(sql, params);

    return NextResponse.json({ discounts });
  } catch (error: any) {
    console.error('Error fetching discount codes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch discount codes' },
      { status: 500 }
    );
  }
}

// POST /api/discounts - Create discount code
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateDiscountCodeRequest = await request.json();
    const storeId = user.store_id;

    // Check if code already exists
    const existing = await queryOne<DiscountCode>(
      'SELECT * FROM discount_codes WHERE store_id = $1 AND code = $2',
      [storeId, body.code]
    );

    if (existing) {
      return NextResponse.json({ error: 'Discount code already exists' }, { status: 400 });
    }

    const discount = await queryOne<DiscountCode>(
      `INSERT INTO discount_codes (
        store_id, code, discount_type, value, minimum_order_amount,
        usage_limit, applies_to, starts_at, ends_at, is_active,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), now())
      RETURNING *`,
      [
        storeId,
        body.code,
        body.discount_type,
        body.value || null,
        body.minimum_order_amount || null,
        body.usage_limit || null,
        body.applies_to || 'all',
        body.starts_at || null,
        body.ends_at || null,
        body.is_active !== undefined ? body.is_active : true,
      ]
    );

    if (!discount) {
      throw new Error('Failed to create discount code');
    }

    // Emit event
    await eventBus.emitEvent('discount.created', {
      discount: {
        id: discount.id,
        code: discount.code,
        discount_type: discount.discount_type,
        value: discount.value,
      },
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ discount }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating discount code:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create discount code' },
      { status: 500 }
    );
  }
}

