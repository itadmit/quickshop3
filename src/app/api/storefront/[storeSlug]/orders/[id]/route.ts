import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { verifyStorefrontCustomer } from '@/lib/storefront-auth';

// GET - קבלת פרטי הזמנה ספציפית של לקוח בפרונט
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storeSlug: string; id: string }> }
) {
  try {
    const { storeSlug, id } = await params;
    const auth = await verifyStorefrontCustomer(req, storeSlug);
    if (!auth.success || !auth.customerId || !auth.store) {
      return auth.error!;
    }

    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    // Get order
    const order = await queryOne<{
      id: number;
      order_number: number;
      order_name: string;
      financial_status: string;
      fulfillment_status: string | null;
      total_price: number;
      subtotal_price: number | null;
      total_tax: number | null;
      total_discounts: number | null;
      total_shipping_price: number | null;
      created_at: Date;
      billing_address: any;
      shipping_address: any;
    }>(
      `SELECT id, order_number, order_name, financial_status, fulfillment_status,
              total_price, subtotal_price, total_tax, total_discounts, total_shipping_price,
              created_at, billing_address, shipping_address
       FROM orders
       WHERE id = $1 AND store_id = $2 AND customer_id = $3`,
      [orderId, auth.store.id, auth.customerId]
    );

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get line items
    const items = await query<{
      id: number;
      title: string;
      variant_title: string | null;
      quantity: number;
      price: number;
      total_discount: number | null;
    }>(
      `SELECT id, title, variant_title, quantity, price, total_discount
       FROM order_line_items
       WHERE order_id = $1
       ORDER BY id`,
      [orderId]
    );

    // Get fulfillments
    const fulfillments = await query<{
      id: number;
      status: string;
      tracking_number: string | null;
      tracking_company: string | null;
      tracking_url: string | null;
      created_at: Date;
    }>(
      `SELECT id, status, tracking_number, tracking_company, tracking_url, created_at
       FROM order_fulfillments
       WHERE order_id = $1
       ORDER BY created_at DESC`,
      [orderId]
    );

    return NextResponse.json({
      id: order.id,
      orderNumber: order.order_number,
      orderName: order.order_name,
      status: order.financial_status,
      fulfillmentStatus: order.fulfillment_status,
      total: parseFloat(order.total_price.toString()),
      subtotal: order.subtotal_price ? parseFloat(order.subtotal_price.toString()) : null,
      tax: order.total_tax ? parseFloat(order.total_tax.toString()) : null,
      discounts: order.total_discounts ? parseFloat(order.total_discounts.toString()) : null,
      shipping: order.total_shipping_price ? parseFloat(order.total_shipping_price.toString()) : null,
      createdAt: order.created_at,
      billingAddress: order.billing_address,
      shippingAddress: order.shipping_address,
      items: items.map((item) => ({
        id: item.id,
        name: item.title,
        variant: item.variant_title,
        quantity: item.quantity,
        price: parseFloat(item.price.toString()),
        discount: item.total_discount ? parseFloat(item.total_discount.toString()) : null,
      })),
      fulfillments: fulfillments.map((f) => ({
        id: f.id,
        status: f.status,
        trackingNumber: f.tracking_number,
        trackingCompany: f.tracking_company,
        trackingUrl: f.tracking_url,
        createdAt: f.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching storefront order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

