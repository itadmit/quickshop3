import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { getStoreIdBySlug } from '@/lib/utils/store';

/**
 * GET /api/products/by-ids?ids=1,2,3&storeId=X or &storeSlug=X
 * Returns products by their IDs
 * Supports both authenticated (dashboard) and unauthenticated (storefront) access
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
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
    
    if (!idsParam) {
      return NextResponse.json({ products: [] });
    }

    const ids = idsParam.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
    
    if (ids.length === 0) {
      return NextResponse.json({ products: [] });
    }

    // Get products by IDs - CRITICAL: Only from user's store
    // If user is authenticated (customizer), include draft products too
    const statusFilter = user ? '' : 'AND p.status = \'active\'';
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
         ${statusFilter}`,
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

