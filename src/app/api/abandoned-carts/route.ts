import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { quickshopList, quickshopItem } from '@/lib/utils/apiFormatter';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/abandoned-carts - List all abandoned carts
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const storeId = user.store_id;
    const customerId = searchParams.get('customer_id');
    const email = searchParams.get('email');
    const recovered = searchParams.get('recovered'); // 'true' or 'false'
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let sql = `SELECT * FROM abandoned_carts WHERE store_id = $1`;
    const params: any[] = [storeId];
    let paramIndex = 2;

    if (customerId) {
      sql += ` AND customer_id = $${paramIndex}`;
      params.push(parseInt(customerId));
      paramIndex++;
    }

    if (email) {
      sql += ` AND email = $${paramIndex}`;
      params.push(email);
      paramIndex++;
    }

    if (recovered === 'true') {
      sql += ` AND recovered_at IS NOT NULL`;
    } else if (recovered === 'false') {
      sql += ` AND recovered_at IS NULL`;
    }

    sql += ` ORDER BY abandoned_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const abandonedCarts = await query(sql, params);

    return NextResponse.json(quickshopList('abandoned_carts', abandonedCarts));
  } catch (error: any) {
    console.error('Error fetching abandoned carts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch abandoned carts' },
      { status: 500 }
    );
  }
}

// POST /api/abandoned-carts - Create abandoned cart
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const storeId = user.store_id;
    const {
      customer_id,
      email,
      token,
      cart_data,
      total_price,
      currency = 'ILS',
    } = body;

    if (!cart_data || !token) {
      return NextResponse.json({ error: 'cart_data and token are required' }, { status: 400 });
    }

    // Check if abandoned cart already exists with this token
    const existing = await queryOne(
      `SELECT * FROM abandoned_carts WHERE token = $1`,
      [token]
    );

    let abandonedCart;
    if (existing) {
      // Update existing
      abandonedCart = await queryOne(
        `UPDATE abandoned_carts 
         SET cart_data = $1, total_price = $2, last_activity_at = now(), updated_at = now()
         WHERE token = $3
         RETURNING *`,
        [JSON.stringify(cart_data), total_price || null, token]
      );
    } else {
      // Create new
      abandonedCart = await queryOne(
        `INSERT INTO abandoned_carts (
          store_id, customer_id, email, token, cart_data, total_price, currency,
          abandoned_at, last_activity_at, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now(), now(), now())
        RETURNING *`,
        [
          storeId,
          customer_id || null,
          email || null,
          token,
          JSON.stringify(cart_data),
          total_price || null,
          currency,
        ]
      );
    }

    // Emit cart.abandoned event
    if (!existing) {
      await eventBus.emitEvent('cart.abandoned', {
        cart: {
          id: abandonedCart.id,
          token: abandonedCart.token,
          customer_id: abandonedCart.customer_id,
          email: abandonedCart.email,
          cart_data: cart_data,
          total_price: total_price,
          currency: currency,
        },
      }, {
        store_id: storeId,
        source: 'api',
      });
    }

    return NextResponse.json(quickshopItem('abandoned_cart', abandonedCart));
  } catch (error: any) {
    console.error('Error creating abandoned cart:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create abandoned cart' },
      { status: 500 }
    );
  }
}

