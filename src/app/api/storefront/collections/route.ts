import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getStoreIdBySlug } from '@/lib/utils/store';
import { getCollectionByHandle } from '@/lib/storefront/queries';

// GET /api/storefront/collections - List collections or get single collection by handle
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const storeId = searchParams.get('storeId');
    const storeSlug = searchParams.get('storeSlug');
    const handle = searchParams.get('handle'); // Single collection by handle
    const limit = parseInt(searchParams.get('limit') || '6');

    // Resolve store ID from slug if provided
    let resolvedStoreId = storeId ? parseInt(storeId) : null;
    if (!resolvedStoreId && storeSlug) {
      resolvedStoreId = await getStoreIdBySlug(storeSlug);
    }

    if (!resolvedStoreId) {
      return NextResponse.json({ error: 'storeId or storeSlug is required' }, { status: 400 });
    }

    // If handle is provided, return single collection with products
    if (handle) {
      try {
        const collectionData = await getCollectionByHandle(handle, resolvedStoreId, { limit: 20, offset: 0 });
        if (collectionData.collection) {
          return NextResponse.json({ 
            collection: collectionData.collection,
            products: collectionData.products || []
          });
        } else {
          return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
        }
      } catch (error) {
        console.error('Error fetching collection by handle:', error);
        return NextResponse.json({ error: 'Failed to fetch collection' }, { status: 500 });
      }
    }

    // List all collections - כולל תת-קטגוריות (עם parent_id)
    // ✅ תיקון ספירת מוצרים - סופר רק מוצרים פעילים
    const sql = `
      SELECT 
        pc.id,
        pc.title,
        pc.handle,
        pc.image_url,
        pc.parent_id,
        (SELECT COUNT(*) 
         FROM product_collection_map pcm 
         INNER JOIN products p ON p.id = pcm.product_id 
         WHERE pcm.collection_id = pc.id 
           AND p.store_id = $1 
           AND p.status = 'active'
        ) as products_count
      FROM product_collections pc
      WHERE pc.store_id = $1 
        AND pc.published_at IS NOT NULL
      ORDER BY COALESCE(pc.parent_id, pc.id), pc.sort_order ASC, pc.title ASC
      LIMIT $2
    `;

    const collections = await query(sql, [resolvedStoreId, limit]);

    // Format collections
    const formattedCollections = collections.map((c: any) => ({
      id: c.id,
      title: c.title,
      handle: c.handle,
      image_url: c.image_url,
      parent_id: c.parent_id,
      products_count: parseInt(c.products_count) || 0,
    }));

    return NextResponse.json({ 
      collections: formattedCollections,
      count: formattedCollections.length 
    });
  } catch (error) {
    console.error('Error fetching storefront collections:', error);
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
  }
}
