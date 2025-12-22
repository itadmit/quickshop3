import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

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

// GET /api/storefront/wishlist/details - Get product details for guest wishlist
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeIdParam = searchParams.get('storeId');
    const productIdsParam = searchParams.get('productIds');
    
    if (!storeIdParam || !productIdsParam) {
      return NextResponse.json({ items: [] });
    }
    
    const storeId = parseInt(storeIdParam);
    const productIds = productIdsParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
    
    if (productIds.length === 0) {
      return NextResponse.json({ items: [] });
    }

    // Get product details
    const placeholders = productIds.map((_, i) => `$${i + 2}`).join(',');
    const items = await query<WishlistItem>(
      `SELECT 
        p.id as product_id,
        p.id,
        NULL as variant_id,
        p.name as product_title,
        p.handle as product_handle,
        p.price,
        p.compare_price,
        (SELECT src FROM product_images WHERE product_id = p.id ORDER BY position LIMIT 1) as image,
        NOW() as created_at
      FROM products p
      WHERE p.store_id = $1 
        AND p.id IN (${placeholders})
        AND p.status = 'active'
      ORDER BY p.name`,
      [storeId, ...productIds]
    );

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('Error fetching wishlist details:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch wishlist details' },
      { status: 500 }
    );
  }
}

