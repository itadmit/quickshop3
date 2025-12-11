import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// POST /api/orders/:id/mark-read - Mark order as read
export async function POST(
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
    const storeId = user.store_id;

    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    // Verify order belongs to store
    const order = await query<{ id: number; store_id: number }>(
      'SELECT id, store_id FROM orders WHERE id = $1',
      [orderId]
    );

    if (!order || order.length === 0 || order[0].store_id !== storeId) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Mark as read
    await query(
      'UPDATE orders SET is_read = true, updated_at = now() WHERE id = $1',
      [orderId]
    );

    return NextResponse.json({
      success: true,
      message: 'Order marked as read',
    });
  } catch (error: any) {
    console.error('Error marking order as read:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark order as read' },
      { status: 500 }
    );
  }
}



