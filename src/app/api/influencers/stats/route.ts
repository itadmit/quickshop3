import { NextRequest, NextResponse } from 'next/server';
import { getInfluencerFromRequest } from '@/lib/auth/influencerAuth';
import { query, queryOne } from '@/lib/db';
import { InfluencerStats, InfluencerCouponStats, InfluencerChartData } from '@/types/influencer';

// GET /api/influencers/stats - Get influencer statistics
export async function GET(req: NextRequest) {
  try {
    const influencer = await getInfluencerFromRequest(req);

    if (!influencer) {
      return NextResponse.json(
        { error: 'לא מאומת' },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const period = searchParams.get('period') || 'all';

    // Calculate date range based on period
    let dateFilter = '';
    const dateParams: any[] = [];

    if (period === 'today') {
      dateFilter = `AND o.created_at >= CURRENT_DATE`;
    } else if (period === 'week') {
      dateFilter = `AND o.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
    } else if (period === 'month') {
      dateFilter = `AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'`;
    } else if (period === 'year') {
      dateFilter = `AND o.created_at >= CURRENT_DATE - INTERVAL '365 days'`;
    } else if (startDate && endDate) {
      dateFilter = `AND o.created_at >= $1 AND o.created_at <= $2`;
      dateParams.push(startDate, endDate);
    }

    // Build parameters for stats query
    const statsParams: any[] = [];
    let statsParamIndex = 1;
    
    // Add date parameters first if they exist
    if (dateParams.length > 0) {
      statsParams.push(...dateParams);
      statsParamIndex += dateParams.length;
    }
    
    // Add influencer_id parameter
    statsParams.push(influencer.id);
    const influencerParamIndex = statsParamIndex;

    // Get overall stats
    const statsResult = await queryOne<{
      total_sales: string;
      total_orders: string;
      average_order_value: string;
      last_order_date: Date | null;
      first_order_date: Date | null;
      active_coupons: string;
    }>(
      `SELECT 
        COALESCE(SUM(o.total_price), 0) as total_sales,
        COUNT(DISTINCT o.id) as total_orders,
        CASE 
          WHEN COUNT(DISTINCT o.id) > 0 THEN COALESCE(SUM(o.total_price), 0) / COUNT(DISTINCT o.id)
          ELSE 0
        END as average_order_value,
        MAX(o.created_at) as last_order_date,
        MIN(o.created_at) as first_order_date,
        COUNT(DISTINCT CASE WHEN dc.is_active = true THEN dc.id END) as active_coupons
      FROM discount_codes dc
      LEFT JOIN orders o ON o.discount_codes @> jsonb_build_array(dc.code)
        AND o.financial_status = 'paid'
        ${dateFilter}
      WHERE dc.influencer_id = $${influencerParamIndex}`,
      statsParams
    );

    // Get coupon stats - rebuild dateFilter with proper parameter indices
    let couponDateFilter = '';
    const couponDateParams: any[] = [];
    
    if (period === 'today') {
      couponDateFilter = `AND o.created_at >= CURRENT_DATE`;
    } else if (period === 'week') {
      couponDateFilter = `AND o.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
    } else if (period === 'month') {
      couponDateFilter = `AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'`;
    } else if (period === 'year') {
      couponDateFilter = `AND o.created_at >= CURRENT_DATE - INTERVAL '365 days'`;
    } else if (startDate && endDate) {
      couponDateFilter = `AND o.created_at >= $1 AND o.created_at <= $2`;
      couponDateParams.push(startDate, endDate);
    }
    
    // Build coupon stats parameters
    const couponStatsParams: any[] = [];
    let couponParamIndex = 1;
    
    // Add date parameters first if they exist
    if (couponDateParams.length > 0) {
      couponStatsParams.push(...couponDateParams);
      couponParamIndex += couponDateParams.length;
    }
    
    // Add influencer_id parameter
    couponStatsParams.push(influencer.id);
    const couponInfluencerParamIndex = couponParamIndex;
    
    const couponStatsQuery = `SELECT 
        dc.id,
        dc.code,
        dc.discount_type,
        dc.value,
        dc.usage_count,
        dc.usage_limit,
        dc.is_active,
        dc.starts_at,
        dc.ends_at,
        COALESCE(SUM(CASE 
          WHEN o.financial_status = 'paid'
          THEN o.total_price ELSE 0 END), 0) as total_sales,
        COUNT(DISTINCT CASE 
          WHEN o.financial_status = 'paid'
          THEN o.id END) as orders_count
      FROM discount_codes dc
      LEFT JOIN orders o ON o.discount_codes @> jsonb_build_array(dc.code)
        AND o.financial_status = 'paid'
        ${couponDateFilter}
      WHERE dc.influencer_id = $${couponInfluencerParamIndex}
      GROUP BY dc.id, dc.code, dc.discount_type, dc.value, dc.usage_count, dc.usage_limit, dc.is_active, dc.starts_at, dc.ends_at
      ORDER BY dc.created_at DESC`;
    
    const couponStats = await query<InfluencerCouponStats & { total_sales: string; orders_count: string }>(
      couponStatsQuery,
      couponStatsParams
    );

    // Get chart data (last 30 days by default)
    const chartDataResult = await query<{
      date: string;
      sales: string;
      orders: string;
    }>(
      `SELECT 
        DATE(o.created_at) as date,
        COALESCE(SUM(o.total_price), 0) as sales,
        COUNT(DISTINCT o.id) as orders
      FROM discount_codes dc
      LEFT JOIN orders o ON o.discount_codes @> jsonb_build_array(dc.code)
        AND o.financial_status = 'paid'
      WHERE dc.influencer_id = $1
        AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(o.created_at)
      ORDER BY date ASC`,
      [influencer.id]
    );

    const chartData: InfluencerChartData = {
      labels: chartDataResult.map(r => r.date),
      sales: chartDataResult.map(r => parseFloat(r.sales || '0')),
      orders: chartDataResult.map(r => parseInt(r.orders || '0')),
    };

    const stats: InfluencerStats = {
      total_sales: parseFloat(statsResult.total_sales || '0'),
      total_orders: parseInt(statsResult.total_orders || '0'),
      average_order_value: parseFloat(statsResult.average_order_value || '0'),
      active_coupons: parseInt(statsResult.active_coupons || '0'),
      last_order_date: statsResult.last_order_date,
      first_order_date: statsResult.first_order_date,
    };

    return NextResponse.json({
      stats,
      coupons: couponStats.map(c => ({
        id: c.id,
        code: c.code,
        discount_type: c.discount_type,
        value: c.value ? parseFloat(c.value.toString()) : null,
        usage_count: c.usage_count,
        usage_limit: c.usage_limit,
        total_sales: parseFloat(c.total_sales || '0'),
        orders_count: parseInt(c.orders_count || '0'),
        is_active: c.is_active,
        starts_at: c.starts_at,
        ends_at: c.ends_at,
      })),
      chart_data: chartData,
    });
  } catch (error: any) {
    console.error('Error fetching influencer stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

