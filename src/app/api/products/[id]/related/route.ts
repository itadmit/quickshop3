import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { getStoreIdBySlug } from '@/lib/utils/store';

/**
 * GET /api/products/[id]/related?storeId=X or &storeSlug=X
 * Returns related products based on:
 * 1. Same collection
 * 2. Same vendor
 * 3. Similar product type
 * Falls back to random products from the same store if not enough matches
 * Supports both authenticated (dashboard) and unauthenticated (storefront) access
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id, 10);
    
    const { searchParams } = new URL(request.url);
    const storeIdParam = searchParams.get('storeId');
    const storeSlugParam = searchParams.get('storeSlug');
    
    // Try to get user (for dashboard access)
    const user = await getUserFromRequest(request).catch(() => null);
    let storeId: number | null = null;
    
    // Determine storeId: from user (authenticated), from storeId param, or from storeSlug param
    if (user) {
      storeId = user.store_id;
    } else if (storeIdParam) {
      storeId = parseInt(storeIdParam);
    } else if (storeSlugParam) {
      storeId = await getStoreIdBySlug(storeSlugParam);
    }
    
    // For storefront access, storeId or storeSlug is required
    if (!storeId) {
      return NextResponse.json({ error: 'storeId or storeSlug is required' }, { status: 400 });
    }
    
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const limit = parseInt(searchParams.get('limit') || '4', 10);

    // First, get the current product's details - CRITICAL: Verify it belongs to user's store
    const product = await queryOne<{
      id: number;
      store_id: number;
      vendor: string;
      product_type: string;
    }>(
      `SELECT p.id, p.store_id, p.vendor, p.product_type
       FROM products p
       WHERE p.id = $1 AND p.store_id = $2`,
      [productId, storeId]
    );

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get collection IDs for this product
    const collectionResult = await query<{ collection_id: number }>(
      'SELECT collection_id FROM product_collection_map WHERE product_id = $1',
      [productId]
    );
    const collectionIds = collectionResult.map(r => r.collection_id);

    const vendor = product.vendor;
    const productType = product.product_type;

    // Helper to get unique products (no duplicates by id)
    const seenIds = new Set<number>([productId]); // Start with current product excluded
    const relatedProducts: any[] = [];

    const addUniqueProducts = (products: any[]) => {
      for (const p of products) {
        if (!seenIds.has(p.id) && relatedProducts.length < limit) {
          seenIds.add(p.id);
          relatedProducts.push(p);
        }
      }
    };

    // Try to get products from same collections first
    if (collectionIds.length > 0 && relatedProducts.length < limit) {
      const sameCollectionProducts = await query(
        `SELECT p.id, p.title, p.handle, p.vendor, p.product_type,
                pv.price,
                s.slug as store_slug,
                (SELECT pi.src FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) as image
         FROM products p
         LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.position = 1
         LEFT JOIN stores s ON s.id = p.store_id
         WHERE p.store_id = $1 
           AND p.id != $2
           AND p.status = 'active'
           AND p.id IN (SELECT product_id FROM product_collection_map WHERE collection_id = ANY($3::int[]))
         ORDER BY RANDOM()
         LIMIT $4`,
        [storeId, productId, collectionIds, limit * 2] // Get more to have options after dedup
      );
      addUniqueProducts(sameCollectionProducts);
    }

    // If not enough, add products from same vendor
    if (relatedProducts.length < limit && vendor) {
      const sameVendorProducts = await query(
        `SELECT p.id, p.title, p.handle, p.vendor, p.product_type,
                pv.price,
                s.slug as store_slug,
                (SELECT pi.src FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) as image
         FROM products p
         LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.position = 1
         LEFT JOIN stores s ON s.id = p.store_id
         WHERE p.store_id = $1 
           AND p.id != $2
           AND p.status = 'active'
           AND p.vendor = $3
         ORDER BY RANDOM()
         LIMIT $4`,
        [storeId, productId, vendor, limit * 2]
      );
      addUniqueProducts(sameVendorProducts);
    }

    // If still not enough, add products from same product type
    if (relatedProducts.length < limit && productType) {
      const sameTypeProducts = await query(
        `SELECT p.id, p.title, p.handle, p.vendor, p.product_type,
                pv.price,
                s.slug as store_slug,
                (SELECT pi.src FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) as image
         FROM products p
         LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.position = 1
         LEFT JOIN stores s ON s.id = p.store_id
         WHERE p.store_id = $1 
           AND p.id != $2
           AND p.status = 'active'
           AND p.product_type = $3
         ORDER BY RANDOM()
         LIMIT $4`,
        [storeId, productId, productType, limit * 2]
      );
      addUniqueProducts(sameTypeProducts);
    }

    // If still not enough, fill with random products from same store
    if (relatedProducts.length < limit) {
      const randomProducts = await query(
        `SELECT p.id, p.title, p.handle, p.vendor, p.product_type,
                pv.price,
                s.slug as store_slug,
                (SELECT pi.src FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) as image
         FROM products p
         LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.position = 1
         LEFT JOIN stores s ON s.id = p.store_id
         WHERE p.store_id = $1 
           AND p.id != $2
           AND p.status = 'active'
         ORDER BY RANDOM()
         LIMIT $3`,
        [storeId, productId, limit * 2]
      );
      addUniqueProducts(randomProducts);
    }

    return NextResponse.json({ products: relatedProducts });
  } catch (error) {
    console.error('Error loading related products:', error);
    return NextResponse.json({ error: 'Failed to load related products' }, { status: 500 });
  }
}

