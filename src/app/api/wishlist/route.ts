import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { quickshopList, quickshopItem } from '@/lib/utils/apiFormatter';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/wishlist - List all wishlists
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const storeId = user.store_id;
    const customerId = searchParams.get('customer_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let sql = `
      SELECT 
        w.*,
        COUNT(wi.id) as item_count
      FROM wishlists w
      LEFT JOIN wishlist_items wi ON wi.wishlist_id = w.id
      WHERE w.store_id = $1
    `;
    const params: any[] = [storeId];

    if (customerId) {
      sql += ` AND w.customer_id = $2`;
      params.push(parseInt(customerId));
    }

    sql += ` GROUP BY w.id ORDER BY w.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const wishlists = await query<any>(sql, params);

    // Get items for each wishlist
    const wishlistsWithItems = await Promise.all(
      wishlists.map(async (wishlist) => {
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
          [wishlist.id]
        );

        return {
          ...wishlist,
          items,
        };
      })
    );

    return NextResponse.json(quickshopList('wishlists', wishlistsWithItems));
  } catch (error: any) {
    console.error('Error fetching wishlists:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch wishlists' },
      { status: 500 }
    );
  }
}

// POST /api/wishlist - Create wishlist
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const storeId = user.store_id;
    const { customer_id, name = 'My Wishlist', is_public = false } = body;

    if (!customer_id) {
      return NextResponse.json({ error: 'customer_id is required' }, { status: 400 });
    }

    const wishlist = await queryOne(
      `INSERT INTO wishlists (store_id, customer_id, name, is_public, created_at, updated_at)
       VALUES ($1, $2, $3, $4, now(), now())
       RETURNING *`,
      [storeId, customer_id, name, is_public]
    );

    return NextResponse.json(quickshopItem('wishlist', wishlist));
  } catch (error: any) {
    console.error('Error creating wishlist:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create wishlist' },
      { status: 500 }
    );
  }
}

