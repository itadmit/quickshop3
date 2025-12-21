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

    // Get referrer data from visitor_sessions
    const referrerData = await query<{
      referrer: string;
      sessions: string;
      unique_visitors: string;
      reached_cart: string;
      completed_purchase: string;
    }>(`
      SELECT 
        COALESCE(referrer, 'direct') as referrer,
        COUNT(*) as sessions,
        COUNT(DISTINCT visitor_id) as unique_visitors,
        SUM(CASE WHEN reached_cart THEN 1 ELSE 0 END) as reached_cart,
        SUM(CASE WHEN completed_purchase THEN 1 ELSE 0 END) as completed_purchase
      FROM visitor_sessions
      WHERE store_id = $1
        AND session_started_at >= $2
        AND session_started_at <= $3::date + interval '1 day'
      GROUP BY referrer
      ORDER BY sessions DESC
      LIMIT 100
    `, [user.store_id, start_date, end_date]);

    // Get order data by referring site
    const orderData = await query<{
      referring_site: string;
      orders: string;
      revenue: string;
    }>(`
      SELECT 
        COALESCE(referring_site, 'direct') as referring_site,
        COUNT(*) as orders,
        SUM(total_price) as revenue
      FROM orders
      WHERE store_id = $1
        AND created_at >= $2
        AND created_at <= $3::date + interval '1 day'
        AND financial_status IN ('paid', 'partially_paid', 'authorized')
      GROUP BY referring_site
      ORDER BY revenue DESC
    `, [user.store_id, start_date, end_date]);

    // Build orders map
    const ordersByReferrer: Record<string, { orders: number; revenue: number }> = {};
    orderData.forEach(row => {
      const domain = extractDomain(row.referring_site);
      if (!ordersByReferrer[domain]) {
        ordersByReferrer[domain] = { orders: 0, revenue: 0 };
      }
      ordersByReferrer[domain].orders += parseInt(row.orders);
      ordersByReferrer[domain].revenue += parseFloat(row.revenue) || 0;
    });

    // Aggregate by domain
    const domainAggregates: Record<string, {
      referrer: string;
      referrer_domain: string;
      sessions: number;
      unique_visitors: number;
      orders: number;
      revenue: number;
    }> = {};

    referrerData.forEach(row => {
      const domain = extractDomain(row.referrer);
      if (!domainAggregates[domain]) {
        domainAggregates[domain] = {
          referrer: row.referrer,
          referrer_domain: domain,
          sessions: 0,
          unique_visitors: 0,
          orders: ordersByReferrer[domain]?.orders || 0,
          revenue: ordersByReferrer[domain]?.revenue || 0,
        };
      }
      domainAggregates[domain].sessions += parseInt(row.sessions);
      domainAggregates[domain].unique_visitors += parseInt(row.unique_visitors);
    });

    const referrers = Object.values(domainAggregates)
      .map(r => ({
        ...r,
        conversion_rate: r.sessions > 0 ? (r.orders / r.sessions) * 100 : 0,
        bounce_rate: 0, // Would need page view tracking for accurate bounce rate
      }))
      .sort((a, b) => b.sessions - a.sessions);

    const totals = {
      total_sessions: referrers.reduce((acc, r) => acc + r.sessions, 0),
      total_orders: referrers.reduce((acc, r) => acc + r.orders, 0),
      total_revenue: referrers.reduce((acc, r) => acc + r.revenue, 0),
    };

    return NextResponse.json({
      referrers,
      totals,
      period: { start_date, end_date },
    });
  } catch (error: any) {
    console.error('Error fetching referrers report:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}

function extractDomain(url: string): string {
  if (!url || url === 'direct' || url === '') return 'direct';
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

