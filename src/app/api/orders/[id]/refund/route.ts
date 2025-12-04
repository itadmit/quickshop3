import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Order, OrderRefund, CreateRefundRequest } from '@/types/order';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';
// Initialize event listeners
import '@/lib/events/listeners';

// POST /api/orders/:id/refund - Create refund for order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const body: CreateRefundRequest = await request.json();

    // Get existing order
    const existingOrder = await queryOne<Order>(
      'SELECT * FROM orders WHERE id = $1 AND store_id = $2',
      [orderId, user.store_id]
    );

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Create refund record
    const refundResult = await queryOne<OrderRefund>(
      `INSERT INTO order_refunds (
        order_id, note, user_id, refund_line_items, transactions, currency, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, now())
      RETURNING *`,
      [
        orderId,
        body.note || null,
        user.id,
        body.refund_line_items ? JSON.stringify(body.refund_line_items) : null,
        null, // Transactions will be created separately
        existingOrder.currency || 'ILS',
      ]
    );

    if (!refundResult) {
      throw new Error('Failed to create refund');
    }

    // Update order financial status to refunded or partially_refunded
    const newFinancialStatus = existingOrder.financial_status === 'paid' 
      ? 'refunded' 
      : 'partially_refunded';

    await query(
      `UPDATE orders 
       SET financial_status = $1, updated_at = now()
       WHERE id = $2`,
      [newFinancialStatus, orderId]
    );

    // Emit order.refunded event
    await eventBus.emitEvent('order.refunded', {
      order: {
        id: existingOrder.id,
        order_number: existingOrder.order_number,
        order_name: existingOrder.order_name,
        total_price: existingOrder.total_price,
      },
      refund: {
        id: refundResult.id,
        amount: body.amount || existingOrder.total_price,
        refund_line_items: body.refund_line_items || [],
      },
    }, {
      store_id: user.store_id,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ refund: refundResult }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating refund:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create refund' },
      { status: 500 }
    );
  }
}

