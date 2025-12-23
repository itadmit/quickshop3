import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { verifyStorefrontCustomerOptional } from '@/lib/storefront-auth';

interface WishlistItem {
  id: number;
  product_id: number;
  variant_id: number | null;
  product_title: string;
  product_handle: string;
  price: number;
  compare_price: number | null;
  image: string | null;
  created_at: string;
}

// GET /api/storefront/wishlist - Get customer's wishlist
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeIdParam = searchParams.get('storeId');
    
    if (!storeIdParam) {
      return NextResponse.json({ items: [], isLoggedIn: false });
    }
    
    const storeId = parseInt(storeIdParam);
    
    // Get store slug from request or use storeId
    const storeSlug = request.headers.get('x-store-slug') || storeIdParam;
    
    // Verify customer (optional - returns empty if not logged in)
    const authResult = await verifyStorefrontCustomerOptional(request, storeSlug);
    if (!authResult.success || !authResult.customer) {
      // Guest user - return empty with isLoggedIn: false
      return NextResponse.json({ items: [], isLoggedIn: false });
    }
    
    const customer = authResult.customer;

    // Get or create wishlist
    let wishlist = await queryOne<{ id: number }>(
      'SELECT id FROM wishlists WHERE store_id = $1 AND customer_id = $2',
      [storeId, customer.id]
    );

    if (!wishlist) {
      return NextResponse.json({ items: [], isLoggedIn: true });
    }

    // Get wishlist items with product details
    const items = await query<WishlistItem>(
      `SELECT 
        wi.id,
        wi.product_id,
        wi.variant_id,
        p.name as product_title,
        p.handle as product_handle,
        COALESCE(pv.price, p.price) as price,
        COALESCE(pv.compare_at_price, p.compare_price) as compare_price,
        (SELECT src FROM product_images WHERE product_id = p.id ORDER BY position LIMIT 1) as image,
        wi.created_at
      FROM wishlist_items wi
      JOIN products p ON p.id = wi.product_id
      LEFT JOIN product_variants pv ON pv.id = wi.variant_id
      WHERE wi.wishlist_id = $1
      ORDER BY wi.created_at DESC`,
      [wishlist.id]
    );

    return NextResponse.json({ items, isLoggedIn: true });
  } catch (error: any) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch wishlist' },
      { status: 500 }
    );
  }
}

// POST /api/storefront/wishlist - Add product to wishlist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, storeId, variantId } = body;

    if (!productId || !storeId) {
      return NextResponse.json(
        { error: 'productId and storeId are required' },
        { status: 400 }
      );
    }

    // Get store slug from request or use storeId
    const storeSlug = request.headers.get('x-store-slug') || storeId.toString();

    // Verify customer
    const authResult = await verifyStorefrontCustomerOptional(request, storeSlug);
    if (!authResult.success || !authResult.customer) {
      return NextResponse.json(
        { error: 'יש להתחבר כדי להוסיף לרשימת המשאלות' },
        { status: 401 }
      );
    }
    
    const customer = authResult.customer;

    // Get or create wishlist
    let wishlist = await queryOne<{ id: number }>(
      'SELECT id FROM wishlists WHERE store_id = $1 AND customer_id = $2',
      [storeId, customer.id]
    );

    if (!wishlist) {
      wishlist = await queryOne<{ id: number }>(
        `INSERT INTO wishlists (store_id, customer_id, name)
         VALUES ($1, $2, 'רשימת המשאלות שלי')
         RETURNING id`,
        [storeId, customer.id]
      );
    }

    if (!wishlist) {
      throw new Error('Failed to create wishlist');
    }

    // Check if item already exists
    const existing = await queryOne(
      `SELECT id FROM wishlist_items 
       WHERE wishlist_id = $1 AND product_id = $2`,
      [wishlist.id, productId]
    );

    if (existing) {
      return NextResponse.json({ success: true, message: 'המוצר כבר ברשימת המשאלות' });
    }

    // Add item
    await query(
      `INSERT INTO wishlist_items (wishlist_id, product_id, variant_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (wishlist_id, product_id, variant_id) DO NOTHING`,
      [wishlist.id, productId, variantId || null]
    );

    // Return the added item with details
    const item = await queryOne<WishlistItem>(
      `SELECT 
        wi.id,
        wi.product_id,
        wi.variant_id,
        p.name as product_title,
        p.handle as product_handle,
        COALESCE(pv.price, p.price) as price,
        COALESCE(pv.compare_at_price, p.compare_price) as compare_price,
        (SELECT src FROM product_images WHERE product_id = p.id ORDER BY position LIMIT 1) as image,
        wi.created_at
      FROM wishlist_items wi
      JOIN products p ON p.id = wi.product_id
      LEFT JOIN product_variants pv ON pv.id = wi.variant_id
      WHERE wi.wishlist_id = $1 AND wi.product_id = $2
      ORDER BY wi.created_at DESC
      LIMIT 1`,
      [wishlist.id, productId]
    );

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding to wishlist:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add to wishlist' },
      { status: 500 }
    );
  }
}

