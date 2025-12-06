import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/analytics/conversion - Get conversion rates
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];

    // Get visits (from analytics_visits table)
    const visits = await queryOne<{ total_visits: number; unique_visitors: number }>(
      `SELECT 
        COUNT(*) as total_visits,
        COUNT(DISTINCT visitor_id) as unique_visitors
       FROM analytics_visits
       WHERE store_id = $1 
         AND created_at >= $2 
         AND created_at <= $3`,
      [user.store_id, startDate, endDate]
    );

    // Get orders
    const orders = await queryOne<{ total_orders: number; paid_orders: number }>(
      `SELECT 
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE financial_status = 'paid') as paid_orders
       FROM orders
       WHERE store_id = $1 
         AND created_at >= $2 
         AND created_at <= $3`,
      [user.store_id, startDate, endDate]
    );

    // Get cart abandonment
    const abandonedCarts = await queryOne<{ abandoned_count: number }>(
      `SELECT COUNT(*) as abandoned_count
       FROM abandoned_carts
       WHERE store_id = $1 
         AND created_at >= $2 
         AND created_at <= $3`,
      [user.store_id, startDate, endDate]
    );

    const totalVisits = visits?.total_visits || 0;
    const uniqueVisitors = visits?.unique_visitors || 0;
    const totalOrders = orders?.total_orders || 0;
    const paidOrders = orders?.paid_orders || 0;
    const abandoned = abandonedCarts?.abandoned_count || 0;

    // Calculate conversion rates
    const overallConversionRate = totalVisits > 0 ? (paidOrders / totalVisits) * 100 : 0;
    const visitorConversionRate = uniqueVisitors > 0 ? (paidOrders / uniqueVisitors) * 100 : 0;
    const cartAbandonmentRate = (totalOrders + abandoned) > 0 ? (abandoned / (totalOrders + abandoned)) * 100 : 0;

    // Get conversion by date
    const conversionByDate = await query<{
      date: string;
      visits: number;
      orders: number;
      conversion_rate: number;
    }>(
      `SELECT 
        DATE(v.created_at) as date,
        COUNT(DISTINCT v.id) as visits,
        COUNT(DISTINCT o.id) as orders,
        CASE 
          WHEN COUNT(DISTINCT v.id) > 0 
          THEN (COUNT(DISTINCT o.id)::numeric / COUNT(DISTINCT v.id)::numeric * 100)
          ELSE 0
        END as conversion_rate
       FROM analytics_visits v
       LEFT JOIN orders o ON o.store_id = v.store_id 
         AND DATE(o.created_at) = DATE(v.created_at)
         AND o.financial_status = 'paid'
       WHERE v.store_id = $1 
         AND v.created_at >= $2 
         AND v.created_at <= $3
       GROUP BY DATE(v.created_at)
       ORDER BY date ASC`,
      [user.store_id, startDate, endDate]
    );

    return NextResponse.json({
      overall_conversion_rate: overallConversionRate.toFixed(2),
      visitor_conversion_rate: visitorConversionRate.toFixed(2),
      cart_abandonment_rate: cartAbandonmentRate.toFixed(2),
      metrics: {
        total_visits: totalVisits,
        unique_visitors: uniqueVisitors,
        total_orders: totalOrders,
        paid_orders: paidOrders,
        abandoned_carts: abandoned,
      },
      conversion_by_date: conversionByDate,
      period: {
        start_date: startDate,
        end_date: endDate,
      },
    });
  } catch (error: any) {
    console.error('Error fetching conversion rates:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch conversion rates' },
      { status: 500 }
    );
  }
}

