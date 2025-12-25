import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

/**
 * GET /api/reports/discounts-performance
 * דוח ביצועי הנחות וקופונים
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

    // קופונים בשימוש
    const discountsData = await query<{
      discount_code: string;
      discount_type: string;
      usage_count: string;
      orders_count: string;
      total_discount_amount: string;
      revenue_generated: string;
      avg_order_value: string;
    }>(`
      SELECT 
        dc.code as discount_code,
        dc.discount_type,
        COALESCE(dc.times_used, 0) as usage_count,
        COUNT(DISTINCT o.id) as orders_count,
        SUM(o.total_discounts) as total_discount_amount,
        SUM(o.total_price) as revenue_generated,
        AVG(o.total_price) as avg_order_value
      FROM orders o
      CROSS JOIN LATERAL jsonb_array_elements(
        CASE 
          WHEN o.discount_codes IS NULL THEN '[]'::jsonb
          WHEN jsonb_typeof(o.discount_codes) = 'array' THEN o.discount_codes
          ELSE '[]'::jsonb
        END
      ) as dc_elem
      JOIN discount_codes dc ON dc.code = COALESCE(
        dc_elem->>'code',
        CASE 
          WHEN jsonb_typeof(dc_elem) = 'string' THEN dc_elem::text
          WHEN jsonb_typeof(dc_elem) = 'number' THEN dc_elem::text
          ELSE NULL
        END
      )
      WHERE o.store_id = $1
        AND o.created_at >= $2
        AND o.created_at <= $3::date + interval '1 day'
        AND o.financial_status IN ('paid', 'partially_paid', 'authorized')
        AND o.discount_codes IS NOT NULL
        AND jsonb_typeof(o.discount_codes) = 'array'
        AND jsonb_array_length(o.discount_codes) > 0
        AND dc.store_id = $1
      GROUP BY dc.id, dc.code, dc.discount_type
      ORDER BY total_discount_amount DESC
      LIMIT 50
    `, [user.store_id, start_date, end_date]);

    // סטטיסטיקות כלליות
    const totalsResult = await queryOne<{
      total_orders: string;
      orders_with_discount: string;
      total_discount_amount: string;
      total_revenue_with_discount: string;
    }>(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN total_discounts > 0 THEN 1 ELSE 0 END) as orders_with_discount,
        SUM(total_discounts) as total_discount_amount,
        SUM(CASE WHEN total_discounts > 0 THEN total_price ELSE 0 END) as total_revenue_with_discount
      FROM orders
      WHERE store_id = $1
        AND created_at >= $2
        AND created_at <= $3::date + interval '1 day'
        AND financial_status IN ('paid', 'partially_paid', 'authorized')
    `, [user.store_id, start_date, end_date]);

    // הנחות יומיות
    const dailyData = await query<{
      date: string;
      discount_amount: string;
      orders_with_discount: string;
    }>(`
      SELECT 
        DATE(created_at) as date,
        SUM(total_discounts) as discount_amount,
        SUM(CASE WHEN total_discounts > 0 THEN 1 ELSE 0 END) as orders_with_discount
      FROM orders
      WHERE store_id = $1
        AND created_at >= $2
        AND created_at <= $3::date + interval '1 day'
        AND financial_status IN ('paid', 'partially_paid', 'authorized')
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [user.store_id, start_date, end_date]);

    const totalOrders = parseInt(totalsResult?.total_orders || '0');
    const ordersWithDiscount = parseInt(totalsResult?.orders_with_discount || '0');
    const totalDiscountAmount = parseFloat(totalsResult?.total_discount_amount || '0');

    const discounts = discountsData.map((d) => ({
      discount_id: 0,
      discount_code: d.discount_code,
      discount_type: d.discount_type,
      usage_count: parseInt(d.usage_count),
      orders_count: parseInt(d.orders_count),
      total_discount_amount: parseFloat(d.total_discount_amount) || 0,
      revenue_generated: parseFloat(d.revenue_generated) || 0,
      avg_order_value: parseFloat(d.avg_order_value) || 0,
      conversion_rate: 0,
    }));

    return NextResponse.json({
      discounts,
      daily: dailyData.map((d) => ({
        date: d.date,
        discount_amount: parseFloat(d.discount_amount) || 0,
        orders_with_discount: parseInt(d.orders_with_discount),
      })),
      totals: {
        total_discounts_used: discounts.length,
        total_discount_amount: totalDiscountAmount,
        total_orders_with_discount: ordersWithDiscount,
        total_revenue_with_discount: parseFloat(totalsResult?.total_revenue_with_discount || '0'),
        avg_discount_per_order: ordersWithDiscount > 0 ? totalDiscountAmount / ordersWithDiscount : 0,
        discount_rate: totalOrders > 0 ? (ordersWithDiscount / totalOrders) * 100 : 0,
      },
      period: { start_date, end_date },
    });
  } catch (error: any) {
    console.error('Error fetching discounts performance:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}

