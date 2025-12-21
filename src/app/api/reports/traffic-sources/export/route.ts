import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

/**
 * GET /api/reports/traffic-sources/export
 * ייצוא דוח מקורות תנועה ל-CSV
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

    // שליפת הנתונים
    const data = await query<{
      source_name: string;
      visits: string;
      orders: string;
      revenue: string;
    }>(`
      WITH session_sources AS (
        SELECT 
          COALESCE(NULLIF(utm_source, ''), 
            CASE 
              WHEN referrer IS NULL OR referrer = '' THEN 'direct'
              WHEN referrer ILIKE '%google%' THEN 'google'
              WHEN referrer ILIKE '%facebook%' THEN 'facebook'
              WHEN referrer ILIKE '%instagram%' THEN 'instagram'
              ELSE 'referral'
            END
          ) as source_name,
          COUNT(*) as visits
        FROM visitor_sessions
        WHERE store_id = $1 AND session_started_at >= $2 AND session_started_at <= $3::date + interval '1 day'
        GROUP BY 1
      ),
      order_sources AS (
        SELECT 
          COALESCE(NULLIF(source_name, ''), 
            CASE 
              WHEN referring_site IS NULL OR referring_site = '' THEN 'direct'
              WHEN referring_site ILIKE '%google%' THEN 'google'
              WHEN referring_site ILIKE '%facebook%' THEN 'facebook'
              WHEN referring_site ILIKE '%instagram%' THEN 'instagram'
              ELSE 'referral'
            END
          ) as source_name,
          COUNT(*) as orders,
          SUM(total_price) as revenue
        FROM orders
        WHERE store_id = $1 AND created_at >= $2 AND created_at <= $3::date + interval '1 day'
          AND financial_status IN ('paid', 'partially_paid')
        GROUP BY 1
      )
      SELECT 
        COALESCE(s.source_name, o.source_name) as source_name,
        COALESCE(s.visits, 0) as visits,
        COALESCE(o.orders, 0) as orders,
        COALESCE(o.revenue, 0) as revenue
      FROM session_sources s
      FULL OUTER JOIN order_sources o ON s.source_name = o.source_name
      ORDER BY revenue DESC NULLS LAST
    `, [user.store_id, start_date, end_date]);

    // יצירת CSV
    const headers = ['מקור', 'ביקורים', 'הזמנות', 'הכנסות', 'שיעור המרה', 'ערך הזמנה ממוצע'];
    const rows = data.map((row) => {
      const visits = parseInt(row.visits);
      const orders = parseInt(row.orders);
      const revenue = parseFloat(row.revenue) || 0;
      const conversionRate = visits > 0 ? ((orders / visits) * 100).toFixed(2) : '0';
      const aov = orders > 0 ? (revenue / orders).toFixed(2) : '0';
      
      return [
        row.source_name,
        visits.toString(),
        orders.toString(),
        revenue.toFixed(2),
        conversionRate + '%',
        aov,
      ];
    });

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="traffic-sources-${start_date}-${end_date}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting traffic sources:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export' },
      { status: 500 }
    );
  }
}

