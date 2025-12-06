import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { Order } from '@/types/order';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';
import { quickshopItem } from '@/lib/utils/apiFormatter';
// Initialize event listeners
import '@/lib/events/listeners';

// POST /api/orders/:id/mark-fraud - Mark order as fraud/risk
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

    const body = await request.json();
    const { risk_level, reason } = body; // risk_level: 'fraud' | 'risk' | 'none', reason: string

    const storeId = user.store_id;

    // Get order
    const order = await queryOne<Order>(
      'SELECT * FROM orders WHERE id = $1 AND store_id = $2',
      [orderId, storeId]
    );

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update tags - add/remove fraud/risk tags
    let tags = order.tags ? order.tags.split(',').map(t => t.trim()).filter(t => t) : [];
    
    // Remove existing fraud/risk tags
    tags = tags.filter(t => !['fraud', 'risk', 'high-risk'].includes(t.toLowerCase()));
    
    // Add new tag based on risk_level
    if (risk_level === 'fraud') {
      tags.push('fraud');
    } else if (risk_level === 'risk') {
      tags.push('risk');
    } else if (risk_level === 'high-risk') {
      tags.push('high-risk');
    }

    // Update cancel_reason if marking as fraud
    const cancelReason = risk_level === 'fraud' ? 'fraud' : order.cancel_reason;
    const cancelledAt = risk_level === 'fraud' ? new Date() : order.cancelled_at;

    // Update order
    const updatedOrder = await queryOne<Order>(
      `UPDATE orders 
       SET tags = $1, cancel_reason = $2, cancelled_at = $3, updated_at = now()
       WHERE id = $4 AND store_id = $5
       RETURNING *`,
      [
        tags.length > 0 ? tags.join(', ') : null,
        cancelReason,
        cancelledAt,
        orderId,
        storeId
      ]
    );

    if (!updatedOrder) {
      throw new Error('Failed to update order');
    }

    // Log the action
    await query(
      `INSERT INTO system_logs (store_id, level, source, message, context)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        storeId,
        'warn',
        'api',
        `Order ${order.order_name} marked as ${risk_level}`,
        JSON.stringify({ 
          order_id: orderId, 
          risk_level, 
          reason,
          user_id: user.id 
        })
      ]
    );

    // Emit event
    await eventBus.emitEvent('order.marked_fraud', {
      order: {
        id: order.id,
        order_number: order.order_number,
        order_name: order.order_name,
      },
      risk_level,
      reason,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({
      success: true,
      ...quickshopItem('order', updatedOrder),
      risk_level,
    });
  } catch (error: any) {
    console.error('Error marking order as fraud:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark order as fraud' },
      { status: 500 }
    );
  }
}

