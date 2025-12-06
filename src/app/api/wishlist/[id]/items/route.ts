import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { quickshopList, quickshopItem } from '@/lib/utils/apiFormatter';
// Initialize event listeners
import '@/lib/events/listeners';

// POST /api/wishlist/:id/items - Add item to wishlist
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
    const wishlistId = parseInt(id);
    const storeId = user.store_id;
    const body = await request.json();
    const { product_id, variant_id, quantity = 1, note } = body;

    if (!product_id) {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
    }

    // Verify wishlist exists and belongs to store
    const wishlist = await queryOne(
      `SELECT * FROM wishlists WHERE id = $1 AND store_id = $2`,
      [wishlistId, storeId]
    );

    if (!wishlist) {
      return NextResponse.json({ error: 'Wishlist not found' }, { status: 404 });
    }

    // Check if item already exists
    const existingItem = await queryOne(
      `SELECT * FROM wishlist_items 
       WHERE wishlist_id = $1 AND product_id = $2 AND ($3::int IS NULL OR variant_id = $3)`,
      [wishlistId, product_id, variant_id || null]
    );

    if (existingItem) {
      // Update quantity
      const updatedItem = await queryOne(
        `UPDATE wishlist_items 
         SET quantity = quantity + $1, note = COALESCE($2, note)
         WHERE id = $3
         RETURNING *`,
        [quantity, note || null, existingItem.id]
      );

      return NextResponse.json(quickshopItem('wishlist_item', updatedItem));
    }

    // Create new item
    const item = await queryOne(
      `INSERT INTO wishlist_items (wishlist_id, product_id, variant_id, quantity, note, created_at)
       VALUES ($1, $2, $3, $4, $5, now())
       RETURNING *`,
      [wishlistId, product_id, variant_id || null, quantity, note || null]
    );

    return NextResponse.json(quickshopItem('wishlist_item', item));
  } catch (error: any) {
    console.error('Error adding item to wishlist:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add item to wishlist' },
      { status: 500 }
    );
  }
}


