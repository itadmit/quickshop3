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

    // Get inventory history from system_logs or create a simple history from events
    // For now, we'll query system_logs for inventory-related events
    let queryStr = `
      SELECT 
        id,
        level,
        source,
        message,
        context,
        created_at
      FROM system_logs
      WHERE store_id = $1 
        AND (source = 'inventory' OR message LIKE '%inventory%')
    `;
    const queryParams: any[] = [user.store_id];

    if (variantId) {
      queryStr += ` AND (context->>'variant_id')::int = $${queryParams.length + 1}`;
      queryParams.push(parseInt(variantId));
    }

    queryStr += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1}`;
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

