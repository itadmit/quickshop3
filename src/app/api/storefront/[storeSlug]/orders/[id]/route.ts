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
      note_attributes: any;
      discount_codes: any;
    }>(
      `SELECT id, order_number, order_name, financial_status, fulfillment_status,
              total_price, subtotal_price, total_tax, total_discounts, total_shipping_price,
              created_at, billing_address, shipping_address, note_attributes, discount_codes
       FROM orders
       WHERE id = $1 AND store_id = $2 AND customer_id = $3`,
      [orderId, auth.store.id, auth.customerId]
    );

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get line items with properties and image
    const items = await query<{
      id: number;
      title: string;
      variant_title: string | null;
      quantity: number;
      price: number;
      total_discount: number | null;
      properties: any;
      product_id: number | null;
    }>(
      `SELECT 
        id, title, variant_title, quantity, price, total_discount, properties, product_id,
        (SELECT src FROM product_images WHERE product_id = order_line_items.product_id ORDER BY position LIMIT 1) as product_image
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

    // Parse discount codes
    let discountCodes: string[] = [];
    if (order.discount_codes) {
      try {
        if (Array.isArray(order.discount_codes)) {
          discountCodes = order.discount_codes;
        } else if (typeof order.discount_codes === 'string') {
          discountCodes = JSON.parse(order.discount_codes);
        }
      } catch (e) {
        console.warn('Error parsing discount_codes:', e);
      }
    }

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
      noteAttributes: order.note_attributes || {}, // ✅ מוסיף note_attributes
      discountCodes: discountCodes, // ✅ מוסיף discount_codes
      items: items.map((item) => {
        // Parse properties and extract image
        let imageUrl = null;
        let parsedProperties = null;
        
        if (item.properties) {
          try {
            parsedProperties = typeof item.properties === 'string' 
              ? JSON.parse(item.properties) 
              : item.properties;
            
            // Extract image from properties (_image)
            if (Array.isArray(parsedProperties)) {
              const imageProperty = parsedProperties.find((p: any) => p.name === '_image');
              if (imageProperty) {
                imageUrl = imageProperty.value;
              }
            }
          } catch (e) {
            console.warn('Error parsing properties:', e);
          }
        }
        
        // Fallback to product_image if no image in properties
        if (!imageUrl && (item as any).product_image) {
          imageUrl = (item as any).product_image;
        }
        
        return {
          id: item.id,
          name: item.title,
          variant: item.variant_title,
          quantity: item.quantity,
          price: parseFloat(item.price.toString()),
          discount: item.total_discount ? parseFloat(item.total_discount.toString()) : null,
          image: imageUrl,
          properties: parsedProperties,
        };
      }),
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

