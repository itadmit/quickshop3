import { NextRequest, NextResponse } from 'next/server';
import { getInfluencerFromRequest } from '@/lib/auth/influencerAuth';
import { query, queryOne } from '@/lib/db';

// GET /api/influencers/orders/[id] - Get order details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const influencer = await getInfluencerFromRequest(req);

    if (!influencer) {
      return NextResponse.json(
        { error: 'לא מאומת' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const orderId = parseInt(id);

    // Get order and verify it belongs to this influencer
    const order = await queryOne<{
      id: number;
      order_number: string;
      created_at: Date;
      total_amount: number;
      discount_amount: number;
      coupon_code: string;
      coupon_id: number;
      status: string;
      customer_name: string | null;
    }>(
      `SELECT 
        o.id,
        o.order_number,
        o.created_at,
        o.total_price as total_amount,
        COALESCE(o.total_discounts, 0) as discount_amount,
        dc.code as coupon_code,
        dc.id as coupon_id,
        COALESCE(o.fulfillment_status, o.financial_status, 'pending') as status,
        COALESCE(
          (o.shipping_address->>'first_name') || ' ' || (o.shipping_address->>'last_name'),
          (o.billing_address->>'first_name') || ' ' || (o.billing_address->>'last_name'),
          c.first_name || ' ' || c.last_name
        ) as customer_name
      FROM orders o
      INNER JOIN discount_codes dc ON o.discount_codes @> jsonb_build_array(dc.code)
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = $1 AND dc.influencer_id = $2 AND o.financial_status = 'paid'`,
      [orderId, influencer.id]
    );

    if (!order) {
      return NextResponse.json(
        { error: 'הזמנה לא נמצאה' },
        { status: 404 }
      );
    }

    // Get order items (without sensitive customer info)
    const items = await query<{
      product_title: string;
      quantity: number;
      price: number;
      total: number;
    }>(
      `SELECT 
        product_title,
        quantity,
        price,
        (price * quantity) as total
      FROM order_line_items
      WHERE order_id = $1
      ORDER BY id ASC`,
      [orderId]
    );

    return NextResponse.json({
      order: {
        id: order.id,
        order_number: order.order_number,
        created_at: order.created_at,
        total_amount: parseFloat(order.total_amount.toString()),
        discount_amount: parseFloat(order.discount_amount.toString()),
        coupon_code: order.coupon_code,
        coupon_id: order.coupon_id,
        status: order.status,
        customer_name: order.customer_name || 'לקוח',
        items: items.map(i => ({
          product_title: i.product_title,
          quantity: i.quantity,
          price: parseFloat(i.price.toString()),
          total: parseFloat(i.total.toString()),
        })),
      },
    });
  } catch (error: any) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

