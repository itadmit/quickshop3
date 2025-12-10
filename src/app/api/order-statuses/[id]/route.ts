import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/order-statuses/:id - Get a specific custom order status
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
    const statusId = parseInt(id);

    if (isNaN(statusId)) {
      return NextResponse.json({ error: 'Invalid status ID' }, { status: 400 });
    }

    const status = await queryOne(
      `SELECT id, name, display_name, status_type, color, is_default, position, created_at, updated_at
       FROM custom_order_statuses 
       WHERE id = $1 AND store_id = $2`,
      [statusId, user.store_id]
    );

    if (!status) {
      return NextResponse.json({ error: 'Status not found' }, { status: 404 });
    }

    return NextResponse.json({ status });
  } catch (error: any) {
    console.error('Error fetching custom order status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch custom order status' },
      { status: 500 }
    );
  }
}

// PUT /api/order-statuses/:id - Update a custom order status
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
    const statusId = parseInt(id);

    if (isNaN(statusId)) {
      return NextResponse.json({ error: 'Invalid status ID' }, { status: 400 });
    }

    const body = await request.json();
    const { display_name, color, position } = body;

    // Check if status exists and belongs to store
    const existing = await queryOne(
      'SELECT id FROM custom_order_statuses WHERE id = $1 AND store_id = $2',
      [statusId, user.store_id]
    );

    if (!existing) {
      return NextResponse.json({ error: 'Status not found' }, { status: 404 });
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (display_name !== undefined) {
      updates.push(`display_name = $${paramIndex}`);
      values.push(display_name);
      paramIndex++;
    }

    if (color !== undefined) {
      updates.push(`color = $${paramIndex}`);
      values.push(color);
      paramIndex++;
    }

    if (position !== undefined) {
      updates.push(`position = $${paramIndex}`);
      values.push(position);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push(`updated_at = now()`);
    values.push(statusId, user.store_id);

    const result = await query(
      `UPDATE custom_order_statuses 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1}
       RETURNING id, name, display_name, status_type, color, is_default, position, updated_at`,
      values
    );

    return NextResponse.json({ status: result[0] });
  } catch (error: any) {
    console.error('Error updating custom order status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update custom order status' },
      { status: 500 }
    );
  }
}

// DELETE /api/order-statuses/:id - Delete a custom order status
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const statusId = parseInt(id);

    if (isNaN(statusId)) {
      return NextResponse.json({ error: 'Invalid status ID' }, { status: 400 });
    }

    // Check if status exists and belongs to store
    const existing = await queryOne(
      'SELECT id, is_default FROM custom_order_statuses WHERE id = $1 AND store_id = $2',
      [statusId, user.store_id]
    );

    if (!existing) {
      return NextResponse.json({ error: 'Status not found' }, { status: 404 });
    }

    if (existing.is_default) {
      return NextResponse.json(
        { error: 'Cannot delete default status' },
        { status: 400 }
      );
    }

    // Check if any orders are using this status
    const ordersUsingStatus = await query(
      'SELECT COUNT(*) as count FROM orders WHERE store_id = $1 AND fulfillment_status = (SELECT name FROM custom_order_statuses WHERE id = $2)',
      [user.store_id, statusId]
    );

    if (ordersUsingStatus[0]?.count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete status that is in use by orders' },
        { status: 400 }
      );
    }

    await query(
      'DELETE FROM custom_order_statuses WHERE id = $1 AND store_id = $2',
      [statusId, user.store_id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting custom order status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete custom order status' },
      { status: 500 }
    );
  }
}

