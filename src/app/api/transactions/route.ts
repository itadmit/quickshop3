import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Transaction, CreateTransactionRequest } from '@/types/transaction';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/transactions - List transactions
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('order_id');
    const kind = searchParams.get('kind');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    let sql = 'SELECT * FROM transactions WHERE store_id = $1';
    const params: any[] = [user.store_id];
    let paramIndex = 2;

    if (orderId) {
      sql += ` AND order_id = $${paramIndex}`;
      params.push(orderId);
      paramIndex++;
    }

    if (kind) {
      sql += ` AND kind = $${paramIndex}`;
      params.push(kind);
      paramIndex++;
    }

    if (status) {
      sql += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const transactions = await query<Transaction>(sql, params);

    return NextResponse.json({ transactions });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

// POST /api/transactions - Create transaction
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateTransactionRequest = await request.json();
    const storeId = user.store_id;

    const transaction = await queryOne<Transaction>(
      `INSERT INTO transactions (
        store_id, order_id, kind, status, amount, currency, gateway,
        authorization_code, receipt, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())
      RETURNING *`,
      [
        storeId,
        body.order_id,
        body.kind,
        'pending',
        body.amount,
        'ILS',
        body.gateway || null,
        body.authorization_code || null,
        body.receipt ? JSON.stringify(body.receipt) : null,
      ]
    );

    if (!transaction) {
      throw new Error('Failed to create transaction');
    }

    // Emit transaction.created event
    await eventBus.emitEvent('transaction.created', {
      transaction: {
        id: transaction.id,
        order_id: transaction.order_id,
        kind: transaction.kind,
        amount: transaction.amount,
      },
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    // If transaction is successful, emit transaction.succeeded
    if (transaction.status === 'success') {
      await eventBus.emitEvent('transaction.succeeded', {
        transaction: {
          id: transaction.id,
          order_id: transaction.order_id,
          amount: transaction.amount,
        },
      }, {
        store_id: storeId,
        source: 'api',
        user_id: user.id,
      });
    }

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create transaction' },
      { status: 500 }
    );
  }
}

