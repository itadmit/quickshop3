import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const start_date = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end_date = searchParams.get('end_date') || new Date().toISOString().split('T')[0];

    // Get landing page data from visitor_sessions
    const landingPageData = await query<{
      landing_page: string;
      sessions: string;
      unique_visitors: string;
      reached_cart: string;
      completed_purchase: string;
    }>(`
      SELECT 
        COALESCE(landing_page, '/') as landing_page,
        COUNT(*) as sessions,
        COUNT(DISTINCT visitor_id) as unique_visitors,
        SUM(CASE WHEN reached_cart THEN 1 ELSE 0 END) as reached_cart,
        SUM(CASE WHEN completed_purchase THEN 1 ELSE 0 END) as completed_purchase
      FROM visitor_sessions
      WHERE store_id = $1
        AND session_started_at >= $2
        AND session_started_at <= $3::date + interval '1 day'
      GROUP BY landing_page
      ORDER BY sessions DESC
      LIMIT 100
    `, [user.store_id, start_date, end_date]);

    // Get order data by landing page
    const orderData = await query<{
      landing_page: string;
      orders: string;
      revenue: string;
    }>(`
      SELECT 
        COALESCE(landing_site, '/') as landing_page,
        COUNT(*) as orders,
        SUM(total_price) as revenue
      FROM orders
      WHERE store_id = $1
        AND created_at >= $2
        AND created_at <= $3::date + interval '1 day'
        AND financial_status IN ('paid', 'partially_paid', 'authorized')
      GROUP BY landing_site
      ORDER BY revenue DESC
    `, [user.store_id, start_date, end_date]);

    // Build orders map
    const ordersByPage: Record<string, { orders: number; revenue: number }> = {};
    orderData.forEach(row => {
      ordersByPage[row.landing_page] = {
        orders: parseInt(row.orders),
        revenue: parseFloat(row.revenue) || 0,
      };
    });

    const landing_pages = landingPageData.map(row => {
      const sessions = parseInt(row.sessions);
      const orders = ordersByPage[row.landing_page]?.orders || parseInt(row.completed_purchase) || 0;
      const revenue = ordersByPage[row.landing_page]?.revenue || 0;
      return {
        landing_page: row.landing_page,
        page_title: '',
        sessions,
        unique_visitors: parseInt(row.unique_visitors),
        orders,
        revenue,
        conversion_rate: sessions > 0 ? (orders / sessions) * 100 : 0,
        avg_session_duration: 0,
      };
    });

    const totals = {
      total_sessions: landing_pages.reduce((acc, p) => acc + p.sessions, 0),
      total_orders: landing_pages.reduce((acc, p) => acc + p.orders, 0),
      total_revenue: landing_pages.reduce((acc, p) => acc + p.revenue, 0),
    };

    return NextResponse.json({
      landing_pages,
      totals,
      period: { start_date, end_date },
    });
  } catch (error: any) {
    console.error('Error fetching landing pages report:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}

