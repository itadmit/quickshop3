import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

/**
 * GET /api/reports/influencers
 * דוח משפיענים
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

    // משפיענים עם סטטיסטיקות
    const influencersData = await query<{
      influencer_id: number;
      influencer_name: string;
      influencer_email: string;
      coupons_count: string;
      orders_count: string;
      revenue: string;
      discount_amount: string;
    }>(`
      SELECT 
        i.id as influencer_id,
        i.name as influencer_name,
        i.email as influencer_email,
        COUNT(DISTINCT dc.id) as coupons_count,
        COUNT(DISTINCT o.id) as orders_count,
        COALESCE(SUM(o.total_price), 0) as revenue,
        COALESCE(SUM(o.total_discounts), 0) as discount_amount
      FROM influencers i
      LEFT JOIN discount_codes dc ON dc.influencer_id = i.id AND dc.store_id = $1
      LEFT JOIN orders o ON (
        o.store_id = $1
        AND o.created_at >= $2
        AND o.created_at <= $3::date + interval '1 day'
        AND o.financial_status IN ('paid', 'partially_paid', 'authorized')
        AND o.discount_codes IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM jsonb_array_elements(o.discount_codes) as dc_elem
          JOIN discount_codes dc2 ON dc2.code = COALESCE(dc_elem->>'code', dc_elem#>>'{}')
          WHERE dc2.influencer_id = i.id
        )
      )
      WHERE i.store_id = $1
      GROUP BY i.id, i.name, i.email
      ORDER BY revenue DESC
    `, [user.store_id, start_date, end_date]);

    // מכירות יומיות לפי משפיען
    const dailySalesByInfluencer = await query<{
      date: string;
      influencer_id: number;
      influencer_name: string;
      orders_count: string;
      revenue: string;
    }>(`
      SELECT 
        DATE(o.created_at) as date,
        i.id as influencer_id,
        i.name as influencer_name,
        COUNT(DISTINCT o.id) as orders_count,
        SUM(o.total_price) as revenue
      FROM orders o
      CROSS JOIN LATERAL jsonb_array_elements(
        CASE 
          WHEN o.discount_codes IS NULL THEN '[]'::jsonb
          WHEN jsonb_typeof(o.discount_codes) = 'array' THEN o.discount_codes
          ELSE '[]'::jsonb
        END
      ) as dc_elem
      JOIN discount_codes dc ON (
        dc.store_id = $1
        AND dc.code = COALESCE(dc_elem->>'code', dc_elem#>>'{}')
        AND dc.influencer_id IS NOT NULL
      )
      JOIN influencers i ON i.id = dc.influencer_id
      WHERE o.store_id = $1
        AND o.created_at >= $2
        AND o.created_at <= $3::date + interval '1 day'
        AND o.financial_status IN ('paid', 'partially_paid', 'authorized')
      GROUP BY DATE(o.created_at), i.id, i.name
      ORDER BY date, revenue DESC
    `, [user.store_id, start_date, end_date]);

    // סטטיסטיקות כלליות
    const totalsResult = await queryOne<{
      total_influencers: string;
      total_orders: string;
      total_revenue: string;
      total_discounts: string;
    }>(`
      SELECT 
        (SELECT COUNT(*) FROM influencers WHERE store_id = $1 AND is_active = true) as total_influencers,
        (SELECT COUNT(DISTINCT o.id) 
         FROM orders o
         CROSS JOIN LATERAL jsonb_array_elements(
           CASE 
             WHEN o.discount_codes IS NULL THEN '[]'::jsonb
             WHEN jsonb_typeof(o.discount_codes) = 'array' THEN o.discount_codes
             ELSE '[]'::jsonb
           END
         ) as dc_elem
         JOIN discount_codes dc ON (
           dc.store_id = $1
           AND dc.code = COALESCE(dc_elem->>'code', dc_elem#>>'{}')
           AND dc.influencer_id IS NOT NULL
         )
         WHERE o.store_id = $1
           AND o.created_at >= $2
           AND o.created_at <= $3::date + interval '1 day'
           AND o.financial_status IN ('paid', 'partially_paid', 'authorized')
        ) as total_orders,
        (SELECT COALESCE(SUM(o.total_price), 0)
         FROM orders o
         CROSS JOIN LATERAL jsonb_array_elements(
           CASE 
             WHEN o.discount_codes IS NULL THEN '[]'::jsonb
             WHEN jsonb_typeof(o.discount_codes) = 'array' THEN o.discount_codes
             ELSE '[]'::jsonb
           END
         ) as dc_elem
         JOIN discount_codes dc ON (
           dc.store_id = $1
           AND dc.code = COALESCE(dc_elem->>'code', dc_elem#>>'{}')
           AND dc.influencer_id IS NOT NULL
         )
         WHERE o.store_id = $1
           AND o.created_at >= $2
           AND o.created_at <= $3::date + interval '1 day'
           AND o.financial_status IN ('paid', 'partially_paid', 'authorized')
        ) as total_revenue,
        (SELECT COALESCE(SUM(o.total_discounts), 0)
         FROM orders o
         CROSS JOIN LATERAL jsonb_array_elements(
           CASE 
             WHEN o.discount_codes IS NULL THEN '[]'::jsonb
             WHEN jsonb_typeof(o.discount_codes) = 'array' THEN o.discount_codes
             ELSE '[]'::jsonb
           END
         ) as dc_elem
         JOIN discount_codes dc ON (
           dc.store_id = $1
           AND dc.code = COALESCE(dc_elem->>'code', dc_elem#>>'{}')
           AND dc.influencer_id IS NOT NULL
         )
         WHERE o.store_id = $1
           AND o.created_at >= $2
           AND o.created_at <= $3::date + interval '1 day'
           AND o.financial_status IN ('paid', 'partially_paid', 'authorized')
        ) as total_discounts
    `, [user.store_id, start_date, end_date]);

    return NextResponse.json({
      influencers: influencersData.map((i) => ({
        influencer_id: i.influencer_id,
        influencer_name: i.influencer_name,
        influencer_email: i.influencer_email,
        coupons_count: parseInt(i.coupons_count) || 0,
        orders_count: parseInt(i.orders_count) || 0,
        revenue: parseFloat(i.revenue) || 0,
        discount_amount: parseFloat(i.discount_amount) || 0,
      })),
      daily: dailySalesByInfluencer.map((d) => ({
        date: d.date,
        influencer_id: d.influencer_id,
        influencer_name: d.influencer_name,
        orders_count: parseInt(d.orders_count),
        revenue: parseFloat(d.revenue) || 0,
      })),
      totals: {
        total_influencers: parseInt(totalsResult?.total_influencers || '0'),
        total_orders: parseInt(totalsResult?.total_orders || '0'),
        total_revenue: parseFloat(totalsResult?.total_revenue || '0'),
        total_discounts: parseFloat(totalsResult?.total_discounts || '0'),
      },
      period: { start_date, end_date },
    });
  } catch (error: any) {
    console.error('Error fetching influencers report:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}

