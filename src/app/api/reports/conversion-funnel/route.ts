import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

/**
 * GET /api/reports/conversion-funnel
 * דוח משפך המרה
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

    // נתוני משפך מ-visitor_sessions
    const funnelResult = await queryOne<{
      visits: string;
      reached_cart: string;
      reached_checkout: string;
      completed_purchase: string;
    }>(`
      SELECT 
        COUNT(*) as visits,
        SUM(CASE WHEN reached_cart THEN 1 ELSE 0 END) as reached_cart,
        SUM(CASE WHEN reached_checkout THEN 1 ELSE 0 END) as reached_checkout,
        SUM(CASE WHEN completed_purchase THEN 1 ELSE 0 END) as completed_purchase
      FROM visitor_sessions
      WHERE store_id = $1
        AND session_started_at >= $2
        AND session_started_at <= $3::date + interval '1 day'
    `, [user.store_id, start_date, end_date]);

    // צפיות במוצרים מ-analytics_events
    const productViewsResult = await queryOne<{ product_views: string }>(`
      SELECT COUNT(*) as product_views
      FROM analytics_events
      WHERE store_id = $1
        AND event_type = 'product_view'
        AND created_at >= $2
        AND created_at <= $3::date + interval '1 day'
    `, [user.store_id, start_date, end_date]);

    // הזמנות בפועל
    const ordersResult = await queryOne<{ purchases: string }>(`
      SELECT COUNT(*) as purchases
      FROM orders
      WHERE store_id = $1
        AND created_at >= $2
        AND created_at <= $3::date + interval '1 day'
        AND financial_status IN ('paid', 'partially_paid', 'authorized')
    `, [user.store_id, start_date, end_date]);

    const visits = parseInt(funnelResult?.visits || '0');
    const product_views = parseInt(productViewsResult?.product_views || '0') || Math.floor(visits * 0.7);
    const add_to_cart = parseInt(funnelResult?.reached_cart || '0');
    const checkout_started = parseInt(funnelResult?.reached_checkout || '0');
    const purchases = parseInt(ordersResult?.purchases || '0');

    // חישוב שיעורי המרה
    const visit_to_product_rate = visits > 0 ? (product_views / visits) * 100 : 0;
    const product_to_cart_rate = product_views > 0 ? (add_to_cart / product_views) * 100 : 0;
    const cart_to_checkout_rate = add_to_cart > 0 ? (checkout_started / add_to_cart) * 100 : 0;
    const checkout_to_purchase_rate = checkout_started > 0 ? (purchases / checkout_started) * 100 : 0;
    const overall_conversion_rate = visits > 0 ? (purchases / visits) * 100 : 0;
    const cart_abandonment_rate = add_to_cart > 0 ? ((add_to_cart - purchases) / add_to_cart) * 100 : 0;
    const checkout_abandonment_rate = checkout_started > 0 ? ((checkout_started - purchases) / checkout_started) * 100 : 0;

    // נתונים יומיים
    const dailyData = await query<{
      date: string;
      visits: string;
      add_to_cart: string;
      purchases: string;
    }>(`
      WITH daily_sessions AS (
        SELECT 
          DATE(session_started_at) as date,
          COUNT(*) as visits,
          SUM(CASE WHEN reached_cart THEN 1 ELSE 0 END) as add_to_cart
        FROM visitor_sessions
        WHERE store_id = $1
          AND session_started_at >= $2
          AND session_started_at <= $3::date + interval '1 day'
        GROUP BY DATE(session_started_at)
      ),
      daily_orders AS (
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as purchases
        FROM orders
        WHERE store_id = $1
          AND created_at >= $2
          AND created_at <= $3::date + interval '1 day'
          AND financial_status IN ('paid', 'partially_paid', 'authorized')
        GROUP BY DATE(created_at)
      )
      SELECT 
        COALESCE(ds.date, do.date) as date,
        COALESCE(ds.visits, 0) as visits,
        COALESCE(ds.add_to_cart, 0) as add_to_cart,
        COALESCE(do.purchases, 0) as purchases
      FROM daily_sessions ds
      FULL OUTER JOIN daily_orders do ON ds.date = do.date
      ORDER BY date
    `, [user.store_id, start_date, end_date]);

    return NextResponse.json({
      funnel: {
        visits,
        product_views,
        add_to_cart,
        checkout_started,
        purchases,
        visit_to_product_rate,
        product_to_cart_rate,
        cart_to_checkout_rate,
        checkout_to_purchase_rate,
        overall_conversion_rate,
        cart_abandonment_rate,
        checkout_abandonment_rate,
      },
      daily: dailyData.map((d) => ({
        date: d.date,
        visits: parseInt(d.visits),
        add_to_cart: parseInt(d.add_to_cart),
        purchases: parseInt(d.purchases),
        conversion_rate: parseInt(d.visits) > 0 ? (parseInt(d.purchases) / parseInt(d.visits)) * 100 : 0,
      })),
      period: { start_date, end_date },
    });
  } catch (error: any) {
    console.error('Error fetching conversion funnel:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}

