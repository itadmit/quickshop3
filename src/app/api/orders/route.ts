import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Order, OrderWithDetails, OrderLineItem, OrderFulfillment, OrderRefund, CreateOrderRequest } from '@/types/order';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/orders - List all orders with filters and cursor pagination
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const storeId = user.store_id;
    const financialStatus = searchParams.get('financial_status');
    const fulfillmentStatus = searchParams.get('fulfillment_status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;
    const cursor = searchParams.get('cursor'); // ID of last order seen (for backward compatibility)
    const search = searchParams.get('search'); // Search by order number, email, name

    // Build WHERE clause
    let sql = `
      SELECT * FROM orders 
      WHERE store_id = $1
    `;
    const params: any[] = [storeId];
    let paramIndex = 2;

    if (financialStatus) {
      sql += ` AND financial_status = $${paramIndex}`;
      params.push(financialStatus);
      paramIndex++;
    }

    if (fulfillmentStatus) {
      sql += ` AND fulfillment_status = $${paramIndex}`;
      params.push(fulfillmentStatus);
      paramIndex++;
    }

    if (search) {
      sql += ` AND (
        order_name ILIKE $${paramIndex} OR 
        email ILIKE $${paramIndex} OR 
        name ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Support both cursor and page-based pagination
    if (cursor) {
      sql += ` AND id < $${paramIndex}`;
      params.push(cursor);
      paramIndex++;
    }

    // Get total count for pagination
    let countSql = `SELECT COUNT(*) as total FROM orders WHERE store_id = $1`;
    const countParams: any[] = [storeId];
    let countParamIndex = 2;

    if (financialStatus) {
      countSql += ` AND financial_status = $${countParamIndex}`;
      countParams.push(financialStatus);
      countParamIndex++;
    }

    if (fulfillmentStatus) {
      countSql += ` AND fulfillment_status = $${countParamIndex}`;
      countParams.push(fulfillmentStatus);
      countParamIndex++;
    }

    if (search) {
      countSql += ` AND (
        order_name ILIKE $${countParamIndex} OR 
        email ILIKE $${countParamIndex} OR 
        name ILIKE $${countParamIndex}
      )`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    const totalResult = await queryOne<{ total: string }>(countSql, countParams);
    const total = parseInt(totalResult?.total || '0');
    const totalPages = Math.ceil(total / limit);

    // Apply pagination
    if (cursor) {
      sql += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
      params.push(limit);
    } else {
      sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);
    }

    const orders = await query<Order>(sql, params);

    // Get line items, fulfillments, and refunds for each order
    const ordersWithDetails: OrderWithDetails[] = await Promise.all(
      orders.map(async (order) => {
        const [lineItems, fulfillments, refunds] = await Promise.all([
          query<OrderLineItem>(
            'SELECT * FROM order_line_items WHERE order_id = $1 ORDER BY id',
            [order.id]
          ),
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

        return {
          ...order,
          line_items: lineItems,
          fulfillments,
          refunds,
          customer: customer || undefined,
        };
      })
    );

    // Return pagination info
    if (cursor) {
      // Cursor-based pagination (backward compatibility)
      const hasNextPage = orders.length === limit;
      const nextCursor = hasNextPage && orders.length > 0 ? orders[orders.length - 1].id.toString() : null;

      return NextResponse.json({
        orders: ordersWithDetails,
        page_info: {
          has_next_page: hasNextPage,
          cursor: nextCursor,
        },
      });
    } else {
      // Page-based pagination
      return NextResponse.json({
        orders: ordersWithDetails,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    }
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateOrderRequest = await request.json();
    const storeId = user.store_id;

    // Calculate totals
    const subtotalPrice = body.line_items.reduce((sum, item) => {
      return sum + parseFloat(item.price) * item.quantity;
    }, 0);
    const totalPrice = subtotalPrice; // TODO: Add tax, shipping, discounts

    // Get next order number - מתחיל מ-1000
    const lastOrder = await queryOne<{ order_number: number }>(
      'SELECT order_number FROM orders WHERE store_id = $1 ORDER BY order_number DESC LIMIT 1',
      [storeId]
    );
    // אם אין הזמנות קודמות או שהמספר הגבוה ביותר נמוך מ-1000, מתחיל מ-1000
    const orderNumber = lastOrder?.order_number && lastOrder.order_number >= 1000
      ? lastOrder.order_number + 1 
      : 1000;
    const orderName = `#${orderNumber.toString().padStart(4, '0')}`;

    // Parse discount codes and update usage count
    let discountCodesArray: string[] = [];
    if (body.discount_codes) {
      if (typeof body.discount_codes === 'string') {
        try {
          discountCodesArray = JSON.parse(body.discount_codes);
        } catch {
          discountCodesArray = [body.discount_codes];
        }
      } else if (Array.isArray(body.discount_codes)) {
        discountCodesArray = body.discount_codes;
      } else {
        discountCodesArray = [];
      }

      // Update usage count for each discount code
      for (const code of discountCodesArray) {
        await query(
          `UPDATE discount_codes 
           SET usage_count = usage_count + 1, updated_at = now()
           WHERE store_id = $1 AND code = $2`,
          [storeId, code]
        );
      }
    }

    // Create order
    const orderResult = await queryOne<Order>(
      `INSERT INTO orders (
        store_id, customer_id, email, phone, name,
        order_number, order_name, financial_status, fulfillment_status,
        total_price, subtotal_price, currency,
        billing_address, shipping_address, discount_codes, note, tags,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, now(), now()
      ) RETURNING *`,
      [
        storeId,
        body.customer_id || null,
        body.email,
        body.phone || null,
        body.name || null,
        orderNumber,
        orderName,
        'pending',
        null,
        totalPrice.toString(),
        subtotalPrice.toString(),
        'ILS',
        body.billing_address ? JSON.stringify(body.billing_address) : null,
        body.shipping_address ? JSON.stringify(body.shipping_address) : null,
        discountCodesArray.length > 0 ? JSON.stringify(discountCodesArray) : null,
        body.note || null,
        body.tags || null,
      ]
    );

    if (!orderResult) {
      throw new Error('Failed to create order');
    }

    // Create line items
    const lineItems: OrderLineItem[] = [];
    for (const item of body.line_items) {
      const lineItemResult = await queryOne<OrderLineItem>(
        `INSERT INTO order_line_items (
          order_id, product_id, variant_id, title, variant_title,
          quantity, price, sku, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
        RETURNING *`,
        [
          orderResult.id,
          item.product_id || null,
          item.variant_id || null,
          item.title,
          null,
          item.quantity,
          item.price,
          item.sku || null,
        ]
      );
      if (lineItemResult) {
        lineItems.push(lineItemResult);
      }
    }

    const orderWithDetails: OrderWithDetails = {
      ...orderResult,
      line_items: lineItems,
      fulfillments: [],
      refunds: [],
    };

    // Update customer statistics (total_spent and orders_count)
    if (body.customer_id) {
      await query(
        `UPDATE customers 
         SET total_spent = COALESCE(total_spent, 0) + $1,
             orders_count = COALESCE(orders_count, 0) + 1,
             updated_at = now()
         WHERE id = $2 AND store_id = $3`,
        [totalPrice, body.customer_id, storeId]
      );
    }

    // Emit order.created event
    await eventBus.emitEvent('order.created', {
      order: {
        id: orderResult.id,
        customer_id: body.customer_id || null,
        order_number: orderNumber,
        order_name: orderName,
        total_price: totalPrice.toString(),
        email: body.email,
        discount_codes: discountCodesArray,
        line_items: lineItems.map(item => ({
          id: item.id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          title: item.title,
          quantity: item.quantity,
          price: item.price,
        })),
      },
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    // Emit discount.used events for each discount code
    for (const code of discountCodesArray) {
      const discount = await queryOne<{ id: number }>(
        'SELECT id FROM discount_codes WHERE store_id = $1 AND code = $2',
        [storeId, code]
      );
      if (discount) {
        await eventBus.emitEvent('discount.used', {
          discount_id: discount.id,
          order_id: orderResult.id,
          code: code,
        }, {
          store_id: storeId,
          source: 'api',
          user_id: user.id,
        });
      }
    }

    return NextResponse.json({ order: orderWithDetails }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}

