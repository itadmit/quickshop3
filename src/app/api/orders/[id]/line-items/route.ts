import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Order, OrderLineItem } from '@/types/order';
import { getUserFromRequest } from '@/lib/auth';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// PUT /api/orders/:id/line-items - Update order line items
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
    const { line_items } = body;

    if (!line_items || !Array.isArray(line_items)) {
      return NextResponse.json({ error: 'Invalid line_items array' }, { status: 400 });
    }

    // Get existing order
    const existingOrder = await queryOne<Order>(
      'SELECT * FROM orders WHERE id = $1 AND store_id = $2',
      [orderId, user.store_id]
    );

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update each line item
    let newSubtotal = 0;
    for (const itemUpdate of line_items) {
      const { id: itemId, quantity, price } = itemUpdate;
      
      if (!itemId || quantity === undefined || price === undefined) {
        continue;
      }

      // Verify line item belongs to this order
      const existingItem = await queryOne<OrderLineItem>(
        'SELECT * FROM order_line_items WHERE id = $1 AND order_id = $2',
        [itemId, orderId]
      );

      if (!existingItem) {
        continue;
      }

      // Update line item
      await query(
        `UPDATE order_line_items 
         SET quantity = $1, price = $2, updated_at = now()
         WHERE id = $3 AND order_id = $4`,
        [quantity, price, itemId, orderId]
      );

      newSubtotal += parseFloat(price) * quantity;
    }

    // Recalculate order totals
    const totalShipping = parseFloat(existingOrder.total_shipping_price || '0');
    const totalTax = parseFloat(existingOrder.total_tax || '0');
    const totalDiscounts = parseFloat(existingOrder.total_discounts || '0');
    const newTotal = newSubtotal + totalShipping + totalTax - totalDiscounts;

    // Update order totals
    await query(
      `UPDATE orders 
       SET subtotal_price = $1, total_price = $2, updated_at = now()
       WHERE id = $3 AND store_id = $4`,
      [newSubtotal.toString(), newTotal.toString(), orderId, user.store_id]
    );

    // Emit order.updated event
    await eventBus.emitEvent('order.updated', {
      order: {
        id: existingOrder.id,
        order_number: existingOrder.order_number,
        order_name: existingOrder.order_name,
      },
      changes: { line_items },
    }, {
      store_id: user.store_id,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating line items:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update line items' },
      { status: 500 }
    );
  }
}



