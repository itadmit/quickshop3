import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

/**
 * GET /api/reports/traffic-sources
 * דוח מקורות תנועה - מאיפה הגיעו הלקוחות
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

    // קבלת נתוני תנועה מ-visitor_sessions
    const sessionData = await query<{
      utm_source: string;
      utm_medium: string;
      referrer: string;
      visits: string;
      unique_visitors: string;
      reached_cart: string;
      completed_purchase: string;
    }>(`
      SELECT 
        COALESCE(NULLIF(utm_source, ''), 
          CASE 
            WHEN referrer IS NULL OR referrer = '' THEN 'direct'
            WHEN referrer ILIKE '%google%' THEN 'google'
            WHEN referrer ILIKE '%facebook%' OR referrer ILIKE '%fb.%' THEN 'facebook'
            WHEN referrer ILIKE '%instagram%' THEN 'instagram'
            WHEN referrer ILIKE '%tiktok%' THEN 'tiktok'
            WHEN referrer ILIKE '%youtube%' THEN 'youtube'
            WHEN referrer ILIKE '%twitter%' OR referrer ILIKE '%x.com%' THEN 'twitter'
            WHEN referrer ILIKE '%linkedin%' THEN 'linkedin'
            WHEN referrer ILIKE '%whatsapp%' THEN 'whatsapp'
            ELSE 'referral'
          END
        ) as utm_source,
        COALESCE(NULLIF(utm_medium, ''), 'organic') as utm_medium,
        referrer,
        COUNT(*) as visits,
        COUNT(DISTINCT visitor_id) as unique_visitors,
        SUM(CASE WHEN reached_cart THEN 1 ELSE 0 END) as reached_cart,
        SUM(CASE WHEN completed_purchase THEN 1 ELSE 0 END) as completed_purchase
      FROM visitor_sessions
      WHERE store_id = $1
        AND session_started_at >= $2
        AND session_started_at <= $3::date + interval '1 day'
      GROUP BY 
        COALESCE(NULLIF(utm_source, ''), 
          CASE 
            WHEN referrer IS NULL OR referrer = '' THEN 'direct'
            WHEN referrer ILIKE '%google%' THEN 'google'
            WHEN referrer ILIKE '%facebook%' OR referrer ILIKE '%fb.%' THEN 'facebook'
            WHEN referrer ILIKE '%instagram%' THEN 'instagram'
            WHEN referrer ILIKE '%tiktok%' THEN 'tiktok'
            WHEN referrer ILIKE '%youtube%' THEN 'youtube'
            WHEN referrer ILIKE '%twitter%' OR referrer ILIKE '%x.com%' THEN 'twitter'
            WHEN referrer ILIKE '%linkedin%' THEN 'linkedin'
            WHEN referrer ILIKE '%whatsapp%' THEN 'whatsapp'
            ELSE 'referral'
          END
        ),
        COALESCE(NULLIF(utm_medium, ''), 'organic'),
        referrer
      ORDER BY visits DESC
    `, [user.store_id, start_date, end_date]);

    // קבלת נתוני הזמנות לפי מקור
    const orderData = await query<{
      source_name: string;
      orders: string;
      revenue: string;
    }>(`
      SELECT 
        COALESCE(NULLIF(source_name, ''), 
          CASE 
            WHEN referring_site IS NULL OR referring_site = '' THEN 'direct'
            WHEN referring_site ILIKE '%google%' THEN 'google'
            WHEN referring_site ILIKE '%facebook%' OR referring_site ILIKE '%fb.%' THEN 'facebook'
            WHEN referring_site ILIKE '%instagram%' THEN 'instagram'
            WHEN referring_site ILIKE '%tiktok%' THEN 'tiktok'
            WHEN referring_site ILIKE '%youtube%' THEN 'youtube'
            WHEN referring_site ILIKE '%twitter%' OR referring_site ILIKE '%x.com%' THEN 'twitter'
            WHEN referring_site ILIKE '%linkedin%' THEN 'linkedin'
            WHEN referring_site ILIKE '%whatsapp%' THEN 'whatsapp'
            ELSE 'referral'
          END
        ) as source_name,
        COUNT(*) as orders,
        SUM(total_price) as revenue
      FROM orders
      WHERE store_id = $1
        AND created_at >= $2
        AND created_at <= $3::date + interval '1 day'
        AND financial_status IN ('paid', 'partially_paid', 'authorized')
      GROUP BY 
        COALESCE(NULLIF(source_name, ''), 
          CASE 
            WHEN referring_site IS NULL OR referring_site = '' THEN 'direct'
            WHEN referring_site ILIKE '%google%' THEN 'google'
            WHEN referring_site ILIKE '%facebook%' OR referring_site ILIKE '%fb.%' THEN 'facebook'
            WHEN referring_site ILIKE '%instagram%' THEN 'instagram'
            WHEN referring_site ILIKE '%tiktok%' THEN 'tiktok'
            WHEN referring_site ILIKE '%youtube%' THEN 'youtube'
            WHEN referring_site ILIKE '%twitter%' OR referring_site ILIKE '%x.com%' THEN 'twitter'
            WHEN referring_site ILIKE '%linkedin%' THEN 'linkedin'
            WHEN referring_site ILIKE '%whatsapp%' THEN 'whatsapp'
            ELSE 'referral'
          END
        )
      ORDER BY revenue DESC
    `, [user.store_id, start_date, end_date]);

    // שילוב הנתונים
    const ordersBySource: Record<string, { orders: number; revenue: number }> = {};
    orderData.forEach((row) => {
      ordersBySource[row.source_name.toLowerCase()] = {
        orders: parseInt(row.orders),
        revenue: parseFloat(row.revenue) || 0,
      };
    });

    // איחוד לפי מקור
    const sourceAggregates: Record<string, {
      source_name: string;
      source_type: string;
      visits: number;
      unique_visitors: number;
      reached_cart: number;
      completed_purchase: number;
      orders: number;
      revenue: number;
    }> = {};

    sessionData.forEach((row) => {
      const sourceName = row.utm_source.toLowerCase();
      if (!sourceAggregates[sourceName]) {
        sourceAggregates[sourceName] = {
          source_name: sourceName,
          source_type: row.utm_medium || 'organic',
          visits: 0,
          unique_visitors: 0,
          reached_cart: 0,
          completed_purchase: 0,
          orders: ordersBySource[sourceName]?.orders || 0,
          revenue: ordersBySource[sourceName]?.revenue || 0,
        };
      }
      sourceAggregates[sourceName].visits += parseInt(row.visits);
      sourceAggregates[sourceName].unique_visitors += parseInt(row.unique_visitors);
      sourceAggregates[sourceName].reached_cart += parseInt(row.reached_cart);
      sourceAggregates[sourceName].completed_purchase += parseInt(row.completed_purchase);
    });

    // הוספת מקורות שיש להם הזמנות אבל אין ביקורים
    Object.keys(ordersBySource).forEach((sourceName) => {
      if (!sourceAggregates[sourceName]) {
        sourceAggregates[sourceName] = {
          source_name: sourceName,
          source_type: 'unknown',
          visits: 0,
          unique_visitors: 0,
          reached_cart: 0,
          completed_purchase: 0,
          orders: ordersBySource[sourceName].orders,
          revenue: ordersBySource[sourceName].revenue,
        };
      }
    });

    // המרה למערך
    const sources = Object.values(sourceAggregates)
      .map((source) => ({
        source_name: source.source_name,
        source_type: source.source_type,
        visits: source.visits,
        unique_visitors: source.unique_visitors,
        orders: source.orders || source.completed_purchase,
        revenue: source.revenue,
        conversion_rate: source.visits > 0 
          ? ((source.orders || source.completed_purchase) / source.visits) * 100 
          : 0,
        avg_order_value: (source.orders || source.completed_purchase) > 0 
          ? source.revenue / (source.orders || source.completed_purchase) 
          : 0,
        cart_rate: source.visits > 0 
          ? (source.reached_cart / source.visits) * 100 
          : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // סיכומים
    const totals = {
      total_visits: sources.reduce((acc, s) => acc + s.visits, 0),
      total_orders: sources.reduce((acc, s) => acc + s.orders, 0),
      total_revenue: sources.reduce((acc, s) => acc + s.revenue, 0),
      overall_conversion_rate: 0,
    };

    if (totals.total_visits > 0) {
      totals.overall_conversion_rate = (totals.total_orders / totals.total_visits) * 100;
    }

    return NextResponse.json({
      sources,
      totals,
      period: {
        start_date,
        end_date,
      },
    });
  } catch (error: any) {
    console.error('Error fetching traffic sources report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch traffic sources report' },
      { status: 500 }
    );
  }
}

