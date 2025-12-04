import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/orders/:id/notes - Get order notes
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
    const storeId = user.store_id;

    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    // Verify order belongs to store
    const order = await queryOne<{ id: number; store_id: number }>(
      'SELECT id, store_id FROM orders WHERE id = $1',
      [orderId]
    );

    if (!order || order.store_id !== storeId) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get notes from system_logs (we'll use this as a simple notes system)
    const notes = await query<{
      id: number;
      message: string;
      created_at: Date;
      user_id: number | null;
    }>(
      `SELECT id, message, created_at, user_id
       FROM system_logs
       WHERE store_id = $1 
         AND source = 'order_note'
         AND context->>'order_id' = $2
       ORDER BY created_at DESC`,
      [storeId, orderId.toString()]
    );

    return NextResponse.json({ notes });
  } catch (error: any) {
    console.error('Error fetching order notes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch order notes' },
      { status: 500 }
    );
  }
}

// POST /api/orders/:id/notes - Add note to order
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
    const storeId = user.store_id;

    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const body = await request.json();
    const { note } = body;

    if (!note || !note.trim()) {
      return NextResponse.json({ error: 'Note is required' }, { status: 400 });
    }

    // Verify order belongs to store
    const order = await queryOne<{ id: number; store_id: number; order_name: string | null }>(
      'SELECT id, store_id, order_name FROM orders WHERE id = $1',
      [orderId]
    );

    if (!order || order.store_id !== storeId) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Add note to system_logs
    const result = await queryOne<{
      id: number;
      message: string;
      created_at: Date;
      user_id: number | null;
    }>(
      `INSERT INTO system_logs (store_id, level, source, message, context, user_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, message, created_at, user_id`,
      [
        storeId,
        'info',
        'order_note',
        note.trim(),
        JSON.stringify({ order_id: orderId }),
        user.id,
      ]
    );

    // Emit event
    await eventBus.emitEvent('order.note.added', {
      order_id: orderId,
      note: note.trim(),
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({
      note: result,
      message: 'Note added successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding order note:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add order note' },
      { status: 500 }
    );
  }
}

