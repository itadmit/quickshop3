import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Order, UpdateOrderStatusRequest } from '@/types/order';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';
// Initialize event listeners
import '@/lib/events/listeners';

// POST /api/orders/:id/status - Update order status
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

    const body: UpdateOrderStatusRequest = await request.json();

    // Get existing order
    const existingOrder = await queryOne<Order>(
      'SELECT * FROM orders WHERE id = $1 AND store_id = $2',
      [orderId, user.store_id]
    );

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (body.financial_status) {
      updates.push(`financial_status = $${paramIndex}`);
      values.push(body.financial_status);
      paramIndex++;

      // If status changed to paid, emit order.paid event
      if (body.financial_status === 'paid' && existingOrder.financial_status !== 'paid') {
        await eventBus.emitEvent('order.paid', {
          order: {
            id: existingOrder.id,
            order_number: existingOrder.order_number,
            order_name: existingOrder.order_name,
            total_price: existingOrder.total_price,
          },
        }, {
          store_id: user.store_id,
          source: 'api',
          user_id: user.id,
        });
      }
    }

    if (body.fulfillment_status !== undefined) {
      updates.push(`fulfillment_status = $${paramIndex}`);
      values.push(body.fulfillment_status);
      paramIndex++;

      // If status changed to fulfilled, emit order.fulfilled event
      if (body.fulfillment_status === 'fulfilled' && existingOrder.fulfillment_status !== 'fulfilled') {
        await eventBus.emitEvent('order.fulfilled', {
          order: {
            id: existingOrder.id,
            order_number: existingOrder.order_number,
            order_name: existingOrder.order_name,
          },
        }, {
          store_id: user.store_id,
          source: 'api',
          user_id: user.id,
        });
      }
    }

    if (body.note !== undefined) {
      updates.push(`note = $${paramIndex}`);
      values.push(body.note);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No status fields to update' }, { status: 400 });
    }

    updates.push(`updated_at = now()`);
    values.push(orderId, user.store_id);

    const sql = `
      UPDATE orders 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1}
      RETURNING *
    `;

    const updatedOrder = await queryOne<Order>(sql, values);

    if (!updatedOrder) {
      return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
    }

    // Emit order.updated event
    await eventBus.emitEvent('order.updated', {
      order: {
        id: updatedOrder.id,
        order_number: updatedOrder.order_number,
        order_name: updatedOrder.order_name,
      },
      changes: {
        financial_status: body.financial_status,
        fulfillment_status: body.fulfillment_status,
      },
    }, {
      store_id: user.store_id,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ order: updatedOrder });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update order status' },
      { status: 500 }
    );
  }
}

