import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/analytics/products - Get product performance analytics
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get product performance metrics
    const productPerformance = await query<{
      product_id: number;
      product_title: string;
      total_quantity: number;
      total_revenue: string;
      order_count: number;
      average_price: string;
      views: number;
    }>(
      `SELECT 
        p.id as product_id,
        p.title as product_title,
        COALESCE(SUM(oli.quantity), 0) as total_quantity,
        COALESCE(SUM(oli.price::numeric * oli.quantity), 0) as total_revenue,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(AVG(oli.price::numeric), 0) as average_price,
        COUNT(DISTINCT av.id) as views
       FROM products p
       LEFT JOIN order_line_items oli ON oli.product_id = p.id
       LEFT JOIN orders o ON o.id = oli.order_id 
         AND o.created_at >= $2 
         AND o.created_at <= $3
         AND o.financial_status = 'paid'
       LEFT JOIN analytics_visits av ON av.product_id = p.id
         AND av.created_at >= $2 
         AND av.created_at <= $3
       WHERE p.store_id = $1
       GROUP BY p.id, p.title
       HAVING COUNT(DISTINCT o.id) > 0 OR COUNT(DISTINCT av.id) > 0
       ORDER BY total_revenue DESC
       LIMIT $4`,
      [user.store_id, startDate, endDate, limit]
    );

    // Calculate conversion rate per product
    const productsWithConversion = productPerformance.map((product) => {
      const conversionRate = product.views > 0 
        ? ((product.order_count / product.views) * 100).toFixed(2)
        : '0';
      return {
        ...product,
        conversion_rate: conversionRate,
      };
    });

    return NextResponse.json({
      products: productsWithConversion,
      period: {
        start_date: startDate,
        end_date: endDate,
      },
    });
  } catch (error: any) {
    console.error('Error fetching product performance:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product performance' },
      { status: 500 }
    );
  }
}

