import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

/**
 * GET /api/reports/devices
 * דוח מכשירים - מובייל, דסקטופ, טאבלט
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const start_date = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end_date = searchParams.get('end_date') || new Date().toISOString().split('T')[0];

    // נתוני מכשירים מ-visitor_sessions
    const deviceData = await query<{
      device_type: string;
      visits: string;
      purchases: string;
      avg_duration: string;
    }>(`
      SELECT 
        COALESCE(NULLIF(device_type, ''), 'unknown') as device_type,
        COUNT(*) as visits,
        SUM(CASE WHEN completed_purchase THEN 1 ELSE 0 END) as purchases,
        AVG(duration_seconds) as avg_duration
      FROM visitor_sessions
      WHERE store_id = $1
        AND session_started_at >= $2
        AND session_started_at <= $3::date + interval '1 day'
      GROUP BY COALESCE(NULLIF(device_type, ''), 'unknown')
      ORDER BY visits DESC
    `, [user.store_id, start_date, end_date]);

    // הכנסות לפי מכשיר (מההזמנות)
    const revenueData = await query<{
      device_type: string;
      orders: string;
      revenue: string;
    }>(`
      SELECT 
        COALESCE(
          (client_details->>'device_type')::text,
          CASE 
            WHEN (client_details->>'user_agent')::text ILIKE '%mobile%' THEN 'mobile'
            WHEN (client_details->>'user_agent')::text ILIKE '%tablet%' THEN 'tablet'
            ELSE 'desktop'
          END
        ) as device_type,
        COUNT(*) as orders,
        SUM(total_price) as revenue
      FROM orders
      WHERE store_id = $1
        AND created_at >= $2
        AND created_at <= $3::date + interval '1 day'
        AND financial_status IN ('paid', 'partially_paid', 'authorized')
      GROUP BY 1
      ORDER BY revenue DESC
    `, [user.store_id, start_date, end_date]);

    // דפדפנים
    const browserData = await query<{
      browser: string;
      visits: string;
    }>(`
      SELECT 
        COALESCE(NULLIF(browser, ''), 'Unknown') as browser,
        COUNT(*) as visits
      FROM visitor_sessions
      WHERE store_id = $1
        AND session_started_at >= $2
        AND session_started_at <= $3::date + interval '1 day'
      GROUP BY COALESCE(NULLIF(browser, ''), 'Unknown')
      ORDER BY visits DESC
      LIMIT 10
    `, [user.store_id, start_date, end_date]);

    // מערכות הפעלה
    const osData = await query<{
      os: string;
      visits: string;
    }>(`
      SELECT 
        COALESCE(NULLIF(os, ''), 'Unknown') as os,
        COUNT(*) as visits
      FROM visitor_sessions
      WHERE store_id = $1
        AND session_started_at >= $2
        AND session_started_at <= $3::date + interval '1 day'
      GROUP BY COALESCE(NULLIF(os, ''), 'Unknown')
      ORDER BY visits DESC
      LIMIT 10
    `, [user.store_id, start_date, end_date]);

    // שילוב הנתונים
    const revenueByDevice: Record<string, { orders: number; revenue: number }> = {};
    revenueData.forEach((r) => {
      revenueByDevice[r.device_type.toLowerCase()] = {
        orders: parseInt(r.orders),
        revenue: parseFloat(r.revenue) || 0,
      };
    });

    const totalVisits = deviceData.reduce((acc, d) => acc + parseInt(d.visits), 0);
    const totalBrowserVisits = browserData.reduce((acc, b) => acc + parseInt(b.visits), 0);
    const totalOsVisits = osData.reduce((acc, o) => acc + parseInt(o.visits), 0);

    const devices = deviceData.map((d) => {
      const deviceType = d.device_type.toLowerCase();
      const revenue = revenueByDevice[deviceType]?.revenue || 0;
      const orders = revenueByDevice[deviceType]?.orders || parseInt(d.purchases);
      const visits = parseInt(d.visits);
      
      return {
        device_type: deviceType,
        visits,
        orders,
        revenue,
        conversion_rate: visits > 0 ? (orders / visits) * 100 : 0,
        avg_session_duration: parseFloat(d.avg_duration) || 0,
      };
    });

    const browsers = browserData.map((b) => ({
      browser: b.browser,
      visits: parseInt(b.visits),
      percentage: totalBrowserVisits > 0 ? (parseInt(b.visits) / totalBrowserVisits) * 100 : 0,
    }));

    const operating_systems = osData.map((o) => ({
      os: o.os,
      visits: parseInt(o.visits),
      percentage: totalOsVisits > 0 ? (parseInt(o.visits) / totalOsVisits) * 100 : 0,
    }));

    return NextResponse.json({
      devices,
      browsers,
      operating_systems,
      totals: {
        total_visits: totalVisits,
        total_orders: devices.reduce((acc, d) => acc + d.orders, 0),
        total_revenue: devices.reduce((acc, d) => acc + d.revenue, 0),
      },
      period: { start_date, end_date },
    });
  } catch (error: any) {
    console.error('Error fetching devices report:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}

