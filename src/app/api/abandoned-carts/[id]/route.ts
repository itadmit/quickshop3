import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { quickshopItem } from '@/lib/utils/apiFormatter';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/abandoned-carts/:id - Get abandoned cart details
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
    const abandonedCartId = parseInt(id);
    const storeId = user.store_id;

    const abandonedCart = await queryOne(
      `SELECT * FROM abandoned_carts WHERE id = $1 AND store_id = $2`,
      [abandonedCartId, storeId]
    );

    if (!abandonedCart) {
      return NextResponse.json({ error: 'Abandoned cart not found' }, { status: 404 });
    }

    return NextResponse.json(quickshopItem('abandoned_cart', abandonedCart));
  } catch (error: any) {
    console.error('Error fetching abandoned cart:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch abandoned cart' },
      { status: 500 }
    );
  }
}

// PUT /api/abandoned-carts/:id/recover - Mark cart as recovered
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
    const abandonedCartId = parseInt(id);
    const storeId = user.store_id;

    const abandonedCart = await queryOne(
      `SELECT * FROM abandoned_carts WHERE id = $1 AND store_id = $2`,
      [abandonedCartId, storeId]
    );

    if (!abandonedCart) {
      return NextResponse.json({ error: 'Abandoned cart not found' }, { status: 404 });
    }

    const recoveredCart = await queryOne(
      `UPDATE abandoned_carts 
       SET recovered_at = now(), updated_at = now()
       WHERE id = $1 AND store_id = $2
       RETURNING *`,
      [abandonedCartId, storeId]
    );

    return NextResponse.json(quickshopItem('abandoned_cart', recoveredCart));
  } catch (error: any) {
    console.error('Error recovering abandoned cart:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to recover abandoned cart' },
      { status: 500 }
    );
  }
}

// DELETE /api/abandoned-carts/:id - Delete abandoned cart
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
    const abandonedCartId = parseInt(id);
    const storeId = user.store_id;

    const abandonedCart = await queryOne(
      `SELECT * FROM abandoned_carts WHERE id = $1 AND store_id = $2`,
      [abandonedCartId, storeId]
    );

    if (!abandonedCart) {
      return NextResponse.json({ error: 'Abandoned cart not found' }, { status: 404 });
    }

    await query(
      `DELETE FROM abandoned_carts WHERE id = $1 AND store_id = $2`,
      [abandonedCartId, storeId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting abandoned cart:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete abandoned cart' },
      { status: 500 }
    );
  }
}

