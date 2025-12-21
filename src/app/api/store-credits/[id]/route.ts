import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { quickshopItem } from '@/lib/utils/apiFormatter';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/store-credits/:id - Get store credit details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const storeCreditId = parseInt(id);
    const storeId = user.store_id;

    const storeCredit = await queryOne(
      `SELECT * FROM store_credits WHERE id = $1 AND store_id = $2`,
      [storeCreditId, storeId]
    );

    if (!storeCredit) {
      return NextResponse.json({ error: 'Store credit not found' }, { status: 404 });
    }

    // Get transactions
    const transactions = await query(
      `SELECT * FROM store_credit_transactions WHERE store_credit_id = $1 ORDER BY created_at DESC`,
      [storeCreditId]
    );

    return NextResponse.json(quickshopItem('store_credit', {
      ...storeCredit,
      transactions,
    }));
  } catch (error: any) {
    console.error('Error fetching store credit:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch store credit' },
      { status: 500 }
    );
  }
}

// PUT /api/store-credits/:id - Update store credit
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const storeCreditId = parseInt(id);
    const storeId = user.store_id;
    const body = await request.json();

    const existingCredit = await queryOne(
      `SELECT * FROM store_credits WHERE id = $1 AND store_id = $2`,
      [storeCreditId, storeId]
    );

    if (!existingCredit) {
      return NextResponse.json({ error: 'Store credit not found' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (body.expires_at !== undefined) {
      updates.push(`expires_at = $${paramIndex}`);
      values.push(body.expires_at || null);
      paramIndex++;
    }

    // Allow direct balance update for adjustments
    if (body.balance !== undefined) {
      const balanceDiff = parseFloat(body.balance) - parseFloat(existingCredit.balance);
      updates.push(`balance = $${paramIndex}`);
      values.push(body.balance);
      paramIndex++;

      // Record transaction for the adjustment
      if (balanceDiff !== 0) {
        await query(
          `INSERT INTO store_credit_transactions (
            store_credit_id, amount, transaction_type, description, admin_user_id, created_at
          )
          VALUES ($1, $2, $3, $4, $5, now())`,
          [
            storeCreditId,
            balanceDiff,
            'manual_adjustment',
            body.description || 'עריכת יתרה ידנית',
            user.id,
          ]
        );
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(quickshopItem('store_credit', existingCredit));
    }

    updates.push(`updated_at = now()`);
    values.push(storeCreditId, storeId);

    const storeCredit = await queryOne(
      `UPDATE store_credits 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    await eventBus.emitEvent('store_credit.updated', {
      store_credit: storeCredit,
      changes: body,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json(quickshopItem('store_credit', storeCredit));
  } catch (error: any) {
    console.error('Error updating store credit:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update store credit' },
      { status: 500 }
    );
  }
}

// DELETE /api/store-credits/:id - Delete store credit
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const storeCreditId = parseInt(id);
    const storeId = user.store_id;

    const storeCredit = await queryOne(
      `SELECT * FROM store_credits WHERE id = $1 AND store_id = $2`,
      [storeCreditId, storeId]
    );

    if (!storeCredit) {
      return NextResponse.json({ error: 'Store credit not found' }, { status: 404 });
    }

    // Delete transactions first
    await query(
      `DELETE FROM store_credit_transactions WHERE store_credit_id = $1`,
      [storeCreditId]
    );

    // Delete the store credit
    await query(
      `DELETE FROM store_credits WHERE id = $1 AND store_id = $2`,
      [storeCreditId, storeId]
    );

    await eventBus.emitEvent('store_credit.deleted', {
      store_credit: storeCredit,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting store credit:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete store credit' },
      { status: 500 }
    );
  }
}

