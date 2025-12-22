import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { quickshopList, quickshopItem } from '@/lib/utils/apiFormatter';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/store-credits - List all store credits
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const storeId = user.store_id;
    const customerId = searchParams.get('customer_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let sql = `SELECT * FROM store_credits WHERE store_id = $1`;
    const params: any[] = [storeId];
    let paramIndex = 2;

    if (customerId) {
      sql += ` AND customer_id = $${paramIndex}`;
      params.push(parseInt(customerId));
      paramIndex++;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const storeCredits = await query(sql, params);

    return NextResponse.json(quickshopList('store_credits', storeCredits));
  } catch (error: any) {
    console.error('Error fetching store credits:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch store credits' },
      { status: 500 }
    );
  }
}

// POST /api/store-credits - Create or update store credit
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const storeId = user.store_id;
    const { customer_id, balance, currency = 'ILS', expires_at, transaction_type = 'manual_adjustment', description } = body;

    if (!customer_id || balance === undefined) {
      return NextResponse.json({ error: 'customer_id and balance are required' }, { status: 400 });
    }

    // Check if store credit exists
    const existing = await queryOne(
      `SELECT * FROM store_credits WHERE store_id = $1 AND customer_id = $2`,
      [storeId, customer_id]
    );

    let storeCredit;
    if (existing) {
      // Update balance
      const newBalance = parseFloat(existing.balance) + parseFloat(balance);
      
      // Build update dynamically
      const updateFields = ['balance = $1', 'updated_at = now()'];
      const values: any[] = [newBalance];
      let paramIndex = 2;

      if ('expires_at' in body) {
        updateFields.push(`expires_at = $${paramIndex++}`);
        values.push(expires_at || null);
      }

      values.push(existing.id);

      storeCredit = await queryOne(
        `UPDATE store_credits 
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING *`,
        values
      );
    } else {
      // Create new
      storeCredit = await queryOne(
        `INSERT INTO store_credits (
          store_id, customer_id, balance, currency, expires_at, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, now(), now())
        RETURNING *`,
        [storeId, customer_id, balance, currency, expires_at || null]
      );
    }

    // Create transaction record
    await query(
      `INSERT INTO store_credit_transactions (
        store_credit_id, order_id, amount, transaction_type, description, created_at
      )
      VALUES ($1, $2, $3, $4, $5, now())`,
      [
        storeCredit.id,
        body.order_id || null,
        balance,
        transaction_type,
        description || null,
      ]
    );

    await eventBus.emitEvent('store_credit.updated', {
      store_credit: storeCredit,
      amount: balance,
      transaction_type,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json(quickshopItem('store_credit', storeCredit));
  } catch (error: any) {
    console.error('Error creating/updating store credit:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create/update store credit' },
      { status: 500 }
    );
  }
}

