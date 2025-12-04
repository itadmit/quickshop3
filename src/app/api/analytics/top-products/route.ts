import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/analytics/top-products - Get top products
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];

    // Get top products by revenue
    const topProducts = await query<{
      product_id: number;
      product_title: string;
      total_quantity: number;
      total_revenue: string;
      order_count: number;
    }>(
      `SELECT 
        oli.product_id,
        p.title as product_title,
        SUM(oli.quantity) as total_quantity,
        SUM(oli.price::numeric * oli.quantity) as total_revenue,
        COUNT(DISTINCT o.id) as order_count
      FROM order_line_items oli
      INNER JOIN orders o ON o.id = oli.order_id
      LEFT JOIN products p ON p.id = oli.product_id
      WHERE o.store_id = $1 
        AND o.created_at >= $2 
        AND o.created_at <= $3
        AND o.financial_status = 'paid'
        AND oli.product_id IS NOT NULL
      GROUP BY oli.product_id, p.title
      ORDER BY total_revenue DESC
      LIMIT $4`,
      [user.store_id, startDate, endDate, limit]
    );

    return NextResponse.json({
      products: topProducts,
      period: {
        start_date: startDate,
        end_date: endDate,
      },
    });
  } catch (error: any) {
    console.error('Error fetching top products:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch top products' },
      { status: 500 }
    );
  }
}

