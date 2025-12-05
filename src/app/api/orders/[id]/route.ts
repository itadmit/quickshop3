import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Order, OrderWithDetails, OrderLineItem, OrderFulfillment, OrderRefund, UpdateOrderStatusRequest } from '@/types/order';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/orders/:id - Get order details
// Supports both authenticated (dashboard) and unauthenticated (storefront) access
// Query params:
//   - byHandle=true: search by order_handle instead of id
//   - storeSlug: required for storefront access (unauthenticated)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const byHandle = searchParams.get('byHandle') === 'true';
    const storeSlug = searchParams.get('storeSlug');

    // Try to get user (for dashboard access)
    const user = await getUserFromRequest(request).catch(() => null);
    const isAuthenticated = !!user;

    // For storefront access (unauthenticated), storeSlug is required
    if (!isAuthenticated && !storeSlug) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get store_id
    let storeId: number | null = null;
    if (isAuthenticated) {
      storeId = user.store_id;
    } else if (storeSlug) {
      const { getStoreIdBySlug } = await import('@/lib/utils/store');
      storeId = await getStoreIdBySlug(storeSlug);
      if (!storeId) {
        return NextResponse.json(
          { error: 'Store not found' },
          { status: 404 }
        );
      }
    }

    let order: Order | null = null;

    // Search by handle (for storefront) or by ID (for dashboard)
    if (byHandle) {
      console.log('[API] Searching for order by handle:', id, 'storeId:', storeId);
      
      let sql = `SELECT * FROM orders WHERE order_handle = $1`;
      const queryParams: any[] = [id];
      
      if (storeId) {
        sql += ' AND store_id = $2';
        queryParams.push(storeId);
      }
      
      order = await queryOne<Order>(sql, queryParams);
      
      if (!order) {
        console.log('[API] Order not found by handle:', id, 'storeId:', storeId);
      }
    } else {
      const orderId = parseInt(id, 10);
      if (isNaN(orderId)) {
        return NextResponse.json(
          { error: 'Invalid order ID' },
          { status: 400 }
        );
      }

      let sql = `SELECT * FROM orders WHERE id = $1`;
      const queryParams: any[] = [orderId];
      
      if (storeId) {
        sql += ' AND store_id = $2';
        queryParams.push(storeId);
      }

      order = await queryOne<Order>(sql, queryParams);
    }

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get line items with product images
    const lineItems = await query<OrderLineItem & { product_image?: string }>(
      `SELECT 
        oli.*,
        (SELECT src FROM product_images WHERE product_id = oli.product_id ORDER BY position LIMIT 1) as product_image
       FROM order_line_items oli
       WHERE oli.order_id = $1 
       ORDER BY oli.id`,
      [order.id]
    );

    // For authenticated users (dashboard), return full OrderWithDetails
    if (isAuthenticated) {
      const [fulfillments, refunds] = await Promise.all([
        query<OrderFulfillment>(
          'SELECT * FROM order_fulfillments WHERE order_id = $1 ORDER BY created_at DESC',
          [order.id]
        ),
        query<OrderRefund>(
          'SELECT * FROM order_refunds WHERE order_id = $1 ORDER BY created_at DESC',
          [order.id]
        ),
      ]);

      // Get customer info if exists
      let customer = null;
      if (order.customer_id) {
        customer = await queryOne<{ id: number; first_name: string; last_name: string; email: string }>(
          'SELECT id, first_name, last_name, email FROM customers WHERE id = $1',
          [order.customer_id]
        );
      }

      // Process line items with images for dashboard
      const processedLineItems = lineItems.map(item => {
        const parsedProperties = item.properties 
          ? (typeof item.properties === 'string' ? JSON.parse(item.properties) : item.properties)
          : null;
        
        // Extract image from properties (_image) or from product_images
        let imageUrl = null;
        if (parsedProperties && Array.isArray(parsedProperties)) {
          const imageProperty = parsedProperties.find((p: any) => p.name === '_image');
          if (imageProperty) {
            imageUrl = imageProperty.value;
          }
        }
        
        // Filter out _image from properties display
        const displayProperties = parsedProperties && Array.isArray(parsedProperties)
          ? parsedProperties.filter((p: any) => p.name !== '_image')
          : parsedProperties;
        
        return {
          ...item,
          image: imageUrl || (item as any).product_image || null,
          properties: displayProperties,
        };
      });

      const orderWithDetails: OrderWithDetails = {
        ...order,
        line_items: processedLineItems,
        fulfillments,
        refunds,
        customer: customer || undefined,
      };

      return NextResponse.json({ order: orderWithDetails });
    }

    // For storefront (unauthenticated), return simplified order with line items
    // Parse properties JSON if exists and add image
    const items = lineItems.map(item => {
      const parsedProperties = item.properties 
        ? (typeof item.properties === 'string' ? JSON.parse(item.properties) : item.properties)
        : null;
      
      // Extract image from properties (_image) or from product_images
      let imageUrl = null;
      if (parsedProperties && Array.isArray(parsedProperties)) {
        const imageProperty = parsedProperties.find((p: any) => p.name === '_image');
        if (imageProperty) {
          imageUrl = imageProperty.value;
        }
      }
      
      // Filter out _image from properties display
      const displayProperties = parsedProperties && Array.isArray(parsedProperties)
        ? parsedProperties.filter((p: any) => p.name !== '_image')
        : parsedProperties;
      
      return {
        ...item,
        image: imageUrl || (item as any).product_image || null,
        properties: displayProperties,
      };
    });

    // Parse addresses and note_attributes
    const billingAddress = order.billing_address 
      ? (typeof order.billing_address === 'string' ? JSON.parse(order.billing_address) : order.billing_address)
      : null;
    const shippingAddress = order.shipping_address 
      ? (typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address)
      : null;
    const noteAttributes = order.note_attributes 
      ? (typeof order.note_attributes === 'string' ? JSON.parse(order.note_attributes) : order.note_attributes)
      : null;
    
    return NextResponse.json({
      id: order.id,
      order_name: order.order_name,
      order_number: order.order_number?.toString(),
      email: order.email,
      phone: order.phone,
      name: order.name,
      total_price: order.total_price?.toString(),
      subtotal_price: order.subtotal_price?.toString(),
      total_shipping_price: order.total_shipping_price?.toString(),
      total_discounts: order.total_discounts?.toString(),
      financial_status: order.financial_status,
      fulfillment_status: order.fulfillment_status,
      billing_address: billingAddress,
      shipping_address: shippingAddress,
      delivery_method: noteAttributes?.delivery_method || 'shipping',
      payment_method: noteAttributes?.payment_method || order.gateway || 'credit_card',
      line_items: items,
    });
  } catch (error: any) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PUT /api/orders/:id - Update order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const body = await request.json();

    // Get existing order
    const existingOrder = await queryOne<Order>(
      'SELECT * FROM orders WHERE id = $1 AND store_id = $2',
      [orderId, user.store_id]
    );

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (body.note !== undefined) {
      updates.push(`note = $${paramIndex}`);
      values.push(body.note);
      paramIndex++;
    }

    if (body.tags !== undefined) {
      updates.push(`tags = $${paramIndex}`);
      values.push(body.tags);
      paramIndex++;
    }

    if (body.billing_address !== undefined) {
      updates.push(`billing_address = $${paramIndex}`);
      values.push(JSON.stringify(body.billing_address));
      paramIndex++;
    }

    if (body.shipping_address !== undefined) {
      updates.push(`shipping_address = $${paramIndex}`);
      values.push(JSON.stringify(body.shipping_address));
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push(`updated_at = now()`);
    values.push(orderId, user.store_id);

    const sql = `
      UPDATE orders 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1}
      RETURNING *
    `;

    const updatedOrder = await queryOne<Order>(sql, values);

    if (!updatedOrder) {
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    // Emit order.updated event
    await eventBus.emitEvent('order.updated', {
      order: {
        id: updatedOrder.id,
        order_number: updatedOrder.order_number,
        order_name: updatedOrder.order_name,
      },
      changes: body,
    }, {
      store_id: user.store_id,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ order: updatedOrder });
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update order' },
      { status: 500 }
    );
  }
}

