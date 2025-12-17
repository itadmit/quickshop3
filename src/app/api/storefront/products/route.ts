import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getStoreIdBySlug } from '@/lib/utils/store';
import { getProductByHandle } from '@/lib/storefront/queries';

// GET /api/storefront/products - List products or get single product by handle
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const storeId = searchParams.get('storeId');
    const storeSlug = searchParams.get('storeSlug');
    const handle = searchParams.get('handle'); // Single product by handle
    const limit = parseInt(searchParams.get('limit') || '8');
    const offset = parseInt(searchParams.get('offset') || '0');
    const collectionHandle = searchParams.get('collection');
    const sort = searchParams.get('sort') || 'newest';
    const featured = searchParams.get('featured') === 'true';

    // Resolve store ID from slug if provided
    let resolvedStoreId = storeId ? parseInt(storeId) : null;
    if (!resolvedStoreId && storeSlug) {
      resolvedStoreId = await getStoreIdBySlug(storeSlug);
    }

    if (!resolvedStoreId) {
      return NextResponse.json({ error: 'storeId or storeSlug is required' }, { status: 400 });
    }

    // If handle is provided, return single product
    if (handle) {
      try {
        const product = await getProductByHandle(handle, resolvedStoreId);
        if (product) {
          return NextResponse.json({ product });
        } else {
          return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }
      } catch (error) {
        console.error('Error fetching product by handle:', error);
        return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
      }
    }

    // Build query for product list
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
    const params: any[] = [resolvedStoreId];
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
