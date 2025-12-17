import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/storefront/collections - List collections for storefront (public, no auth required)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const storeId = searchParams.get('storeId');
    const limit = parseInt(searchParams.get('limit') || '6');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
    }

    const sql = `
      SELECT 
        pc.id,
        pc.title,
        pc.handle,
        pc.image_url,
        (SELECT COUNT(*) FROM product_collection_map pcm WHERE pcm.collection_id = pc.id) as products_count
      FROM product_collections pc
      WHERE pc.store_id = $1 AND pc.published_at IS NOT NULL
      ORDER BY pc.sort_order ASC, pc.title ASC
      LIMIT $2
    `;

    const collections = await query(sql, [storeId, limit]);

    // Format collections
    const formattedCollections = collections.map((c: any) => ({
      id: c.id,
      title: c.title,
      handle: c.handle,
      image_url: c.image_url,
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


