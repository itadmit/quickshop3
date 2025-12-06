import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
// Initialize event listeners
import '@/lib/events/listeners';

// DELETE /api/wishlist/:id/items/:itemId - Remove item from wishlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, itemId } = await params;
    const wishlistId = parseInt(id);
    const itemIdNum = parseInt(itemId);
    const storeId = user.store_id;

    // Verify wishlist exists and belongs to store
    const wishlist = await queryOne(
      `SELECT * FROM wishlists WHERE id = $1 AND store_id = $2`,
      [wishlistId, storeId]
    );

    if (!wishlist) {
      return NextResponse.json({ error: 'Wishlist not found' }, { status: 404 });
    }

    await query(
      `DELETE FROM wishlist_items WHERE id = $1 AND wishlist_id = $2`,
      [itemIdNum, wishlistId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing item from wishlist:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove item from wishlist' },
      { status: 500 }
    );
  }
}

