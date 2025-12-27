import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

/**
 * GET /api/products/by-ids?ids=1,2,3
 * Returns products by their IDs (only from user's store)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    const storeId = user.store_id;
    
    if (!idsParam) {
      return NextResponse.json({ products: [] });
    }

    const ids = idsParam.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
    
    if (ids.length === 0) {
      return NextResponse.json({ products: [] });
    }

    // Get products by IDs - CRITICAL: Only from user's store
    const result = await query(
      `SELECT p.id, p.title, p.handle, p.vendor, p.product_type,
              pv.price,
              s.slug as store_slug,
              (SELECT pi.src FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) as image
       FROM products p
       LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.position = 1
       LEFT JOIN stores s ON s.id = p.store_id
       WHERE p.id = ANY($1::int[])
         AND p.store_id = $2
         AND p.status = 'active'`,
      [ids, storeId]
    );

    // Sort by original order of IDs
    const sortedProducts = ids
      .map(id => result.find(p => p.id === id))
      .filter(Boolean);

    return NextResponse.json({ products: sortedProducts });
  } catch (error) {
    console.error('Error loading products by IDs:', error);
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 });
  }
}

