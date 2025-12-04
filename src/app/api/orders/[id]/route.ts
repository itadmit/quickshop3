import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Order, OrderWithDetails, OrderLineItem, OrderFulfillment, OrderRefund, UpdateOrderStatusRequest } from '@/types/order';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/orders/:id - Get order details
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
    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    // Get order
    const order = await queryOne<Order>(
      'SELECT * FROM orders WHERE id = $1 AND store_id = $2',
      [orderId, user.store_id]
    );

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get line items, fulfillments, and refunds
    const [lineItems, fulfillments, refunds] = await Promise.all([
      query<OrderLineItem>(
        'SELECT * FROM order_line_items WHERE order_id = $1 ORDER BY id',
        [orderId]
      ),
      query<OrderFulfillment>(
        'SELECT * FROM order_fulfillments WHERE order_id = $1 ORDER BY created_at DESC',
        [orderId]
      ),
      query<OrderRefund>(
        'SELECT * FROM order_refunds WHERE order_id = $1 ORDER BY created_at DESC',
        [orderId]
      ),
    ]);

    // Get customer info if exists
    let customer = null;
    if (order.customer_id) {
      customer = await queryOne<{ id: number; first_name: string; last_name: string; email: string }>(
        'SELECT id, first_name, last_name, email FROM customers WHERE id = $1',
        [order.customer_id]
      );
    }

    const orderWithDetails: OrderWithDetails = {
      ...order,
      line_items: lineItems,
      fulfillments,
      refunds,
      customer: customer || undefined,
    };

    return NextResponse.json({ order: orderWithDetails });
  } catch (error: any) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PUT /api/orders/:id - Update order
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
    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const body = await request.json();

    // Get existing order
    const existingOrder = await queryOne<Order>(
      'SELECT * FROM orders WHERE id = $1 AND store_id = $2',
      [orderId, user.store_id]
    );

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (body.note !== undefined) {
      updates.push(`note = $${paramIndex}`);
      values.push(body.note);
      paramIndex++;
    }

    if (body.tags !== undefined) {
      updates.push(`tags = $${paramIndex}`);
      values.push(body.tags);
      paramIndex++;
    }

    if (body.billing_address !== undefined) {
      updates.push(`billing_address = $${paramIndex}`);
      values.push(JSON.stringify(body.billing_address));
      paramIndex++;
    }

    if (body.shipping_address !== undefined) {
      updates.push(`shipping_address = $${paramIndex}`);
      values.push(JSON.stringify(body.shipping_address));
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
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
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    // Emit order.updated event
    await eventBus.emitEvent('order.updated', {
      order: {
        id: updatedOrder.id,
        order_number: updatedOrder.order_number,
        order_name: updatedOrder.order_name,
      },
      changes: body,
    }, {
      store_id: user.store_id,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ order: updatedOrder });
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update order' },
      { status: 500 }
    );
  }
}

