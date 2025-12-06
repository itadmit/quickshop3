import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { quickshopList } from '@/lib/utils/apiFormatter';

// GET /api/orders/:id/timeline - Get order timeline events
export async function GET(
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

    // Verify order belongs to store
    const order = await queryOne<{ id: number; store_id: number }>(
      'SELECT id, store_id FROM orders WHERE id = $1',
      [orderId]
    );

    if (!order || order.store_id !== user.store_id) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get events from system_logs related to this order
    // Include both events with order_id in context and order_note source
    const events = await query<{
      id: number;
      event_type: string;
      message: string;
      created_at: Date;
      user_id: number | null;
    }>(
      `SELECT 
        id,
        source as event_type,
        message,
        created_at,
        user_id
      FROM system_logs
      WHERE store_id = $1 
        AND (
          (context->>'order_id')::text = $2
          OR message LIKE $3
          OR source = 'order_note' AND (context->>'order_id')::text = $2
        )
      ORDER BY created_at DESC
      LIMIT 100`,
      [user.store_id, orderId.toString(), `%order_id:${orderId}%`]
    );

    // Also get order status changes from order history
    const orderHistory = await query<{
      id: number;
      event_type: string;
      message: string;
      created_at: Date;
      user_id: number | null;
    }>(
      `SELECT 
        id,
        'order.status_changed' as event_type,
        CONCAT('סטטוס עודכן: ', financial_status, ' -> ', fulfillment_status) as message,
        updated_at as created_at,
        user_id
      FROM orders
      WHERE id = $1 AND store_id = $2
      UNION ALL
      SELECT 
        id,
        'order.created' as event_type,
        CONCAT('הזמנה נוצרה: ', order_name) as message,
        created_at,
        user_id
      FROM orders
      WHERE id = $1 AND store_id = $2
      ORDER BY created_at DESC`,
      [orderId, user.store_id]
    );

    // Combine and sort all events
    const allEvents = [...events, ...orderHistory].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json(quickshopList('events', allEvents));
  } catch (error: any) {
    console.error('Error fetching timeline:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch timeline' },
      { status: 500 }
    );
  }
}

