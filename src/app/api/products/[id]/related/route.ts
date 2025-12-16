import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/products/[id]/related
 * Returns related products based on:
 * 1. Same collection
 * 2. Same vendor
 * 3. Similar product type
 * Falls back to random products from the same store if not enough matches
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id, 10);
    
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '4', 10);

    // First, get the current product's details
    const productResult = await query(
      `SELECT p.id, p.store_id, p.vendor, p.product_type,
              (SELECT array_agg(pcm.collection_id) FROM product_collection_map pcm WHERE pcm.product_id = p.id) as collection_ids
       FROM products p
       WHERE p.id = $1`,
      [productId]
    );

    if (productResult.length === 0) {
      return NextResponse.json({ products: [] });
    }

    const currentProduct = productResult[0];
    const storeId = currentProduct.store_id;
    const collectionIds = currentProduct.collection_ids || [];
    const vendor = currentProduct.vendor;
    const productType = currentProduct.product_type;

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

