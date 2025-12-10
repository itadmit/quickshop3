import { NextRequest, NextResponse } from 'next/server';
import { getInfluencerFromRequest } from '@/lib/auth/influencerAuth';
import { query, queryOne } from '@/lib/db';
import { InfluencerOrder } from '@/types/influencer';

// GET /api/influencers/orders - Get influencer orders
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const couponId = searchParams.get('coupon_id');

    // Build WHERE clause
    let whereClause = 'WHERE dc.influencer_id = $1';
    const params: any[] = [influencer.id];
    let paramIndex = 2;

    if (startDate) {
      whereClause += ` AND o.created_at >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ` AND o.created_at <= $${paramIndex++}`;
      params.push(endDate);
    }
    if (couponId) {
      whereClause += ` AND dc.id = $${paramIndex++}`;
      params.push(parseInt(couponId));
    }

    // Get total count
    const countSql = `
      SELECT COUNT(DISTINCT o.id) as total
      FROM discount_codes dc
      INNER JOIN orders o ON o.discount_codes @> jsonb_build_array(dc.code)
      ${whereClause}
    `;
    const totalResult = await queryOne<{ total: string }>(countSql, params);
    const total = parseInt(totalResult.total);

    // Get orders (include all orders, even cancelled/voided, so influencer can see them)
    // But filter out cancelled/voided from stats queries
    const orders = await query<InfluencerOrder & { coupon_code: string; item_count: string }>(
      `SELECT 
        o.id,
        o.order_number,
        o.created_at,
        o.total_price as total_amount,
        COALESCE(o.total_discounts, 0) as discount_amount,
        dc.code as coupon_code,
        dc.id as coupon_id,
        COALESCE(o.fulfillment_status, o.financial_status, 'pending') as status,
        (SELECT COUNT(*) FROM order_line_items WHERE order_id = o.id) as item_count
      FROM discount_codes dc
      INNER JOIN orders o ON o.discount_codes @> jsonb_build_array(dc.code)
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      orders: orders.map(o => ({
        id: o.id,
        order_number: o.order_number,
        created_at: o.created_at,
        total_amount: parseFloat(o.total_amount.toString()),
        discount_amount: parseFloat(o.discount_amount.toString()),
        coupon_code: o.coupon_code,
        coupon_id: o.coupon_id,
        status: o.status,
        item_count: parseInt(o.item_count || '0'),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching influencer orders:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

