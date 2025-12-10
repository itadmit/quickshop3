import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/order-statuses - Get all custom order statuses for the store
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const statuses = await query(
      `SELECT id, name, display_name, status_type, color, is_default, position 
       FROM custom_order_statuses 
       WHERE store_id = $1 
       ORDER BY position ASC, created_at ASC`,
      [user.store_id]
    );

    return NextResponse.json({ statuses });
  } catch (error: any) {
    console.error('Error fetching custom order statuses:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch custom order statuses' },
      { status: 500 }
    );
  }
}

// POST /api/order-statuses - Create a new custom order status
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, display_name, status_type, color, position } = body;

    if (!name || !display_name || !status_type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, display_name, status_type' },
        { status: 400 }
      );
    }

    // Check if status with same name already exists
    const existing = await query(
      'SELECT id FROM custom_order_statuses WHERE store_id = $1 AND name = $2',
      [user.store_id, name]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Status with this name already exists' },
        { status: 400 }
      );
    }

    // Get max position if not provided
    let finalPosition = position;
    if (finalPosition === undefined || finalPosition === null) {
      const maxPosResult = await query(
        'SELECT COALESCE(MAX(position), 0) + 1 as max_pos FROM custom_order_statuses WHERE store_id = $1',
        [user.store_id]
      );
      finalPosition = maxPosResult[0]?.max_pos || 1;
    }

    const result = await query(
      `INSERT INTO custom_order_statuses (store_id, name, display_name, status_type, color, position)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, display_name, status_type, color, is_default, position, created_at`,
      [user.store_id, name, display_name, status_type, color || null, finalPosition]
    );

    return NextResponse.json({ status: result[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating custom order status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create custom order status' },
      { status: 500 }
    );
  }
}

