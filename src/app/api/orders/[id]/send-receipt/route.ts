import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { Order } from '@/types/order';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';
import { sendOrderReceiptEmail } from '@/lib/order-email';
// Initialize event listeners
import '@/lib/events/listeners';

// POST /api/orders/:id/send-receipt - Send receipt/invoice email
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

    const storeId = user.store_id;

    // Get order
    const order = await queryOne<Order>(
      'SELECT * FROM orders WHERE id = $1 AND store_id = $2',
      [orderId, storeId]
    );

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!order.email) {
      return NextResponse.json({ error: 'Order has no email address' }, { status: 400 });
    }

    // Send email via SendGrid
    try {
      await sendOrderReceiptEmail(orderId, storeId);
    } catch (error: any) {
      // If SendGrid is not configured, return a helpful error
      if (error.message?.includes('not configured')) {
        return NextResponse.json(
          { 
            error: 'SendGrid is not configured. Please configure SendGrid in settings before sending emails.',
            details: error.message 
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // Emit event for email sending
    await eventBus.emitEvent('order.receipt.sent', {
      order: {
        id: order.id,
        order_number: order.order_number,
        order_name: order.order_name,
        email: order.email,
        total_price: order.total_price,
      },
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    // Log the action
    await query(
      `INSERT INTO system_logs (store_id, level, source, message, context)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        storeId,
        'info',
        'api',
        `Receipt sent for order ${order.order_name}`,
        JSON.stringify({ order_id: orderId, email: order.email })
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Receipt sent successfully',
      order_id: orderId,
      email: order.email,
    });
  } catch (error: any) {
    console.error('Error sending receipt:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send receipt' },
      { status: 500 }
    );
  }
}

