import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { quickshopItem } from '@/lib/utils/apiFormatter';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/wishlist/:id - Get wishlist details
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
    const wishlistId = parseInt(id);
    const storeId = user.store_id;

    const wishlist = await queryOne(
      `SELECT * FROM wishlists WHERE id = $1 AND store_id = $2`,
      [wishlistId, storeId]
    );

    if (!wishlist) {
      return NextResponse.json({ error: 'Wishlist not found' }, { status: 404 });
    }

    // Get items
    const items = await query(
      `SELECT 
        wi.*,
        p.title as product_title,
        p.handle as product_handle,
        pi.src as product_image
      FROM wishlist_items wi
      LEFT JOIN products p ON p.id = wi.product_id
      LEFT JOIN LATERAL (
        SELECT src FROM product_images 
        WHERE product_id = p.id 
        ORDER BY position 
        LIMIT 1
      ) pi ON true
      WHERE wi.wishlist_id = $1
      ORDER BY wi.created_at DESC`,
      [wishlistId]
    );

    return NextResponse.json(quickshopItem('wishlist', {
      ...wishlist,
      items,
    }));
  } catch (error: any) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch wishlist' },
      { status: 500 }
    );
  }
}

// PUT /api/wishlist/:id - Update wishlist
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
    const wishlistId = parseInt(id);
    const storeId = user.store_id;
    const body = await request.json();

    const existingWishlist = await queryOne(
      `SELECT * FROM wishlists WHERE id = $1 AND store_id = $2`,
      [wishlistId, storeId]
    );

    if (!existingWishlist) {
      return NextResponse.json({ error: 'Wishlist not found' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (body.name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(body.name);
      paramIndex++;
    }

    if (body.is_public !== undefined) {
      updates.push(`is_public = $${paramIndex}`);
      values.push(body.is_public);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json(quickshopItem('wishlist', existingWishlist));
    }

    updates.push(`updated_at = now()`);
    values.push(wishlistId, storeId);

    const wishlist = await queryOne(
      `UPDATE wishlists 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    return NextResponse.json(quickshopItem('wishlist', wishlist));
  } catch (error: any) {
    console.error('Error updating wishlist:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update wishlist' },
      { status: 500 }
    );
  }
}

// DELETE /api/wishlist/:id - Delete wishlist
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
    const wishlistId = parseInt(id);
    const storeId = user.store_id;

    const wishlist = await queryOne(
      `SELECT * FROM wishlists WHERE id = $1 AND store_id = $2`,
      [wishlistId, storeId]
    );

    if (!wishlist) {
      return NextResponse.json({ error: 'Wishlist not found' }, { status: 404 });
    }

    await query(
      `DELETE FROM wishlists WHERE id = $1 AND store_id = $2`,
      [wishlistId, storeId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting wishlist:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete wishlist' },
      { status: 500 }
    );
  }
}

