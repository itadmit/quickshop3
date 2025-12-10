import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { quickshopList } from '@/lib/utils/apiFormatter';

// GET /api/inventory/history - Get inventory adjustment history
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const variantId = searchParams.get('variant_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get inventory history from system_logs with product and variant details
    let queryStr = `
      SELECT 
        sl.id,
        sl.level,
        sl.source,
        sl.message,
        sl.context,
        sl.created_at,
        pv.id as variant_id,
        pv.sku,
        pv.title as variant_title,
        pv.option1,
        pv.option2,
        pv.option3,
        p.id as product_id,
        p.title as product_title
      FROM system_logs sl
      LEFT JOIN product_variants pv ON (sl.context->>'variant_id')::int = pv.id
      LEFT JOIN products p ON pv.product_id = p.id
      WHERE sl.store_id = $1 
        AND (sl.source = 'inventory' OR sl.message LIKE '%inventory%')
    `;
    const queryParams: any[] = [user.store_id];

    if (variantId) {
      queryStr += ` AND (sl.context->>'variant_id')::int = $${queryParams.length + 1}`;
      queryParams.push(parseInt(variantId));
    }

    queryStr += ` ORDER BY sl.created_at DESC LIMIT $${queryParams.length + 1}`;
    queryParams.push(limit);

    const history = await query(queryStr, queryParams);

    return NextResponse.json(quickshopList('history', history));
  } catch (error: any) {
    console.error('Error fetching inventory history:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch inventory history' },
      { status: 500 }
    );
  }
}

