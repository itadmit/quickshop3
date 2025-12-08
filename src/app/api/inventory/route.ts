import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { quickshopList } from '@/lib/utils/apiFormatter';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/inventory - List inventory levels
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const storeId = user.store_id;
    const variantId = searchParams.get('variant_id');
    const productId = searchParams.get('product_id');
    const locationId = searchParams.get('location_id');
    const lowStock = searchParams.get('low_stock'); // 'true' to filter low stock
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let sql = `
      SELECT 
        pv.id as id,
        pv.id as variant_id,
        pv.product_id,
        pv.sku,
        pv.title as variant_title,
        pv.option1,
        pv.option2,
        pv.option3,
        p.title as product_title,
        COALESCE(pv.inventory_quantity, 0) as available,
        0 as committed,
        0 as incoming,
        pv.updated_at
      FROM product_variants pv
      INNER JOIN products p ON p.id = pv.product_id
      WHERE p.store_id = $1
    `;
    const params: any[] = [storeId];
    let paramIndex = 2;

    if (variantId) {
      sql += ` AND pv.id = $${paramIndex}`;
      params.push(parseInt(variantId));
      paramIndex++;
    }

    if (productId) {
      sql += ` AND pv.product_id = $${paramIndex}`;
      params.push(parseInt(productId));
      paramIndex++;
    }

    // locationId לא רלוונטי יותר כי המלאי על ה-variant עצמו
    // if (locationId) {
    //   sql += ` AND vi.location_id = $${paramIndex}`;
    //   params.push(parseInt(locationId));
    //   paramIndex++;
    // }

    if (lowStock === 'true') {
      sql += ` AND COALESCE(pv.inventory_quantity, 0) < 10`; // Low stock threshold
    }

    sql += ` ORDER BY pv.updated_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const inventory = await query(sql, params);

    return NextResponse.json(quickshopList('inventory', inventory));
  } catch (error: any) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

