import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/storefront/products - List products for storefront (public, no auth required)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const storeId = searchParams.get('storeId');
    const limit = parseInt(searchParams.get('limit') || '8');
    const offset = parseInt(searchParams.get('offset') || '0');
    const collectionHandle = searchParams.get('collection');
    const sort = searchParams.get('sort') || 'newest';
    const featured = searchParams.get('featured') === 'true';

    if (!storeId) {
      return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
    }

    // Build query
    let sql = `
      SELECT 
        p.id,
        p.title,
        p.handle,
        p.vendor,
        (SELECT src FROM product_images WHERE product_id = p.id ORDER BY position LIMIT 1) as image,
        (SELECT price FROM product_variants WHERE product_id = p.id ORDER BY position LIMIT 1) as price,
        (SELECT compare_at_price FROM product_variants WHERE product_id = p.id ORDER BY position LIMIT 1) as compare_at_price
      FROM products p
      WHERE p.store_id = $1 AND p.status = 'active'
    `;
    const params: any[] = [storeId];
    let paramIndex = 2;

    // Filter by collection
    if (collectionHandle) {
      sql += ` AND EXISTS (
        SELECT 1 FROM product_collection_map pcm 
        JOIN product_collections pc ON pcm.collection_id = pc.id
        WHERE pcm.product_id = p.id AND pc.handle = $${paramIndex}
      )`;
      params.push(collectionHandle);
      paramIndex++;
    }

    // Filter featured products
    if (featured) {
      sql += ` AND p.is_featured = true`;
    }

    // Sort order
    switch (sort) {
      case 'newest':
        sql += ` ORDER BY p.created_at DESC`;
        break;
      case 'oldest':
        sql += ` ORDER BY p.created_at ASC`;
        break;
      case 'price-low':
        sql += ` ORDER BY (SELECT price FROM product_variants WHERE product_id = p.id ORDER BY position LIMIT 1) ASC NULLS LAST`;
        break;
      case 'price-high':
        sql += ` ORDER BY (SELECT price FROM product_variants WHERE product_id = p.id ORDER BY position LIMIT 1) DESC NULLS LAST`;
        break;
      case 'name-asc':
        sql += ` ORDER BY p.title ASC`;
        break;
      case 'name-desc':
        sql += ` ORDER BY p.title DESC`;
        break;
      default:
        sql += ` ORDER BY p.created_at DESC`;
    }

    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const products = await query(sql, params);

    // Format products
    const formattedProducts = products.map((p: any) => ({
      id: p.id,
      title: p.title,
      handle: p.handle,
      vendor: p.vendor,
      image: p.image,
      price: p.price ? Number(p.price) : 0,
      compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
    }));

    return NextResponse.json({ 
      products: formattedProducts,
      count: formattedProducts.length 
    });
  } catch (error) {
    console.error('Error fetching storefront products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}


