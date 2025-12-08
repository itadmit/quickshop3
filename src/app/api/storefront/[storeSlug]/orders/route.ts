import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { verifyStorefrontCustomer } from '@/lib/storefront-auth';

// GET - קבלת הזמנות של לקוח בפרונט
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const auth = await verifyStorefrontCustomer(req, storeSlug);
    if (!auth.success || !auth.customerId || !auth.store) {
      return auth.error!;
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get total count
    const totalResult = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM orders WHERE store_id = $1 AND customer_id = $2',
      [auth.store.id, auth.customerId]
    );
    const total = totalResult?.count || 0;

    // Get orders
    const orders = await query<{
      id: number;
      order_number: number;
      order_name: string;
      financial_status: string;
      fulfillment_status: string | null;
      total_price: number;
      created_at: Date;
      tracking_number: string | null;
    }>(
      `SELECT o.id, o.order_number, o.order_name, o.financial_status, o.fulfillment_status, 
              o.total_price, o.created_at, of.tracking_number
       FROM orders o
       LEFT JOIN order_fulfillments of ON o.id = of.order_id AND of.status = 'success'
       WHERE o.store_id = $1 AND o.customer_id = $2
       ORDER BY o.created_at DESC
       LIMIT $3 OFFSET $4`,
      [auth.store.id, auth.customerId, limit, offset]
    );

    // Get line items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await query<{
          id: number;
          title: string;
          quantity: number;
          price: number;
        }>(
          'SELECT id, title, quantity, price FROM order_line_items WHERE order_id = $1',
          [order.id]
        );

        return {
          id: order.id,
          orderNumber: order.order_number,
          orderName: order.order_name,
          status: order.financial_status,
          fulfillmentStatus: order.fulfillment_status,
          total: parseFloat(order.total_price.toString()),
          createdAt: order.created_at,
          trackingNumber: order.tracking_number,
          items: items.map((item) => ({
            id: item.id,
            name: item.title,
            quantity: item.quantity,
            price: parseFloat(item.price.toString()),
          })),
        };
      })
    );

    return NextResponse.json({
      orders: ordersWithItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching storefront orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

