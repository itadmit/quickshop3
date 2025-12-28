import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/returns - List all returns for a store
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const storeId = user.store_id;
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;
    const search = searchParams.get('search'); // Search by order number, customer name/email

    // Build WHERE clause - ✅ שימוש ב-LEFT JOIN כדי לאפשר החזרות ללא הזמנה
    let sql = `
      SELECT 
        r.*,
        o.order_number,
        o.order_name,
        o.total_price as order_total,
        o.financial_status as order_financial_status,
        c.first_name || ' ' || COALESCE(c.last_name, '') as customer_name,
        c.email as customer_email
      FROM returns r
      LEFT JOIN orders o ON r.order_id = o.id
      LEFT JOIN customers c ON r.customer_id = c.id
      WHERE r.store_id = $1
    `;
    const params: any[] = [storeId];
    let paramIndex = 2;

    if (status) {
      sql += ` AND r.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      sql += ` AND (
        o.order_number::text ILIKE $${paramIndex} OR 
        o.order_name ILIKE $${paramIndex} OR 
        c.email ILIKE $${paramIndex} OR
        c.first_name ILIKE $${paramIndex} OR
        c.last_name ILIKE $${paramIndex} OR
        r.reason ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Get total count for pagination - ✅ שימוש ב-LEFT JOIN כדי לאפשר החזרות ללא הזמנה
    let countSql = `
      SELECT COUNT(*) as total 
      FROM returns r
      LEFT JOIN orders o ON r.order_id = o.id
      LEFT JOIN customers c ON r.customer_id = c.id
      WHERE r.store_id = $1
    `;
    const countParams: any[] = [storeId];
    let countParamIndex = 2;

    if (status) {
      countSql += ` AND r.status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }

    if (search) {
      countSql += ` AND (
        o.order_number::text ILIKE $${countParamIndex} OR 
        o.order_name ILIKE $${countParamIndex} OR 
        c.email ILIKE $${countParamIndex} OR
        c.first_name ILIKE $${countParamIndex} OR
        c.last_name ILIKE $${countParamIndex} OR
        r.reason ILIKE $${countParamIndex}
      )`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    const [returns, totalResult] = await Promise.all([
      query<any>(
        `${sql} ORDER BY r.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset]
      ),
      queryOne<{ total: number }>(countSql, countParams),
    ]);

    const total = totalResult?.total || 0;

    return NextResponse.json({
      returns: returns.map((r) => ({
        id: r.id,
        orderId: r.order_id,
        orderNumber: r.order_number || null,
        orderName: r.order_name || null,
        orderTotal: r.order_total ? parseFloat(r.order_total) : null,
        orderFinancialStatus: r.order_financial_status || null,
        customerId: r.customer_id,
        customerName: r.customer_name || null,
        customerEmail: r.customer_email || null,
        status: r.status,
        reason: r.reason,
        items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items,
        refundAmount: r.refund_amount ? parseFloat(r.refund_amount) : null,
        refundMethod: r.refund_method,
        notes: r.notes,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching returns:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch returns' },
      { status: 500 }
    );
  }
}

// POST /api/returns - Create a new return manually
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;
    const body = await request.json();
    const { orderId, customerId, reason, items, refundAmount, refundMethod, notes, status, isManual } = body;

    // Validate required fields
    if (!reason) {
      return NextResponse.json({ error: 'סיבה נדרשת' }, { status: 400 });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'יש לבחור לפחות פריט אחד' }, { status: 400 });
    }

    let finalOrderId: number | null = null;
    let finalCustomerId: number | null = null;

    // ✅ אם יש orderId, וודא שההזמנה קיימת ושייכת לחנות
    if (orderId) {
      const order = await queryOne<any>(
        `SELECT id, customer_id FROM orders WHERE id = $1 AND store_id = $2`,
        [orderId, storeId]
      );

      if (!order) {
        return NextResponse.json({ error: 'הזמנה לא נמצאה' }, { status: 404 });
      }

      finalOrderId = order.id;
      // Use the customer from the order if not provided
      finalCustomerId = customerId || order.customer_id;
    } else {
      // ✅ החזרה ידנית ללא הזמנה - צריך customerId
      if (!customerId) {
        return NextResponse.json({ error: 'יש לבחור לקוח להחזרה ידנית' }, { status: 400 });
      }
      
      // Verify customer belongs to this store
      const customer = await queryOne<any>(
        `SELECT id FROM customers WHERE id = $1 AND store_id = $2`,
        [customerId, storeId]
      );

      if (!customer) {
        return NextResponse.json({ error: 'לקוח לא נמצא' }, { status: 404 });
      }

      finalCustomerId = customerId;
    }

    // Insert the return - ✅ order_id יכול להיות null להחזרה ידנית
    const result = await queryOne<any>(
      `INSERT INTO returns (
        store_id, order_id, customer_id, status, reason, items, refund_amount, refund_method, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        storeId,
        finalOrderId, // ✅ יכול להיות null
        finalCustomerId,
        status || 'PENDING',
        reason,
        JSON.stringify(items),
        refundAmount || null,
        refundMethod || null,
        notes || null
      ]
    );

    return NextResponse.json({
      success: true,
      return: {
        id: result.id,
        orderId: result.order_id,
        customerId: result.customer_id,
        status: result.status,
        reason: result.reason,
        items: typeof result.items === 'string' ? JSON.parse(result.items) : result.items,
        refundAmount: result.refund_amount ? parseFloat(result.refund_amount) : null,
        refundMethod: result.refund_method,
        notes: result.notes,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
      }
    });
  } catch (error: any) {
    console.error('Error creating return:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create return' },
      { status: 500 }
    );
  }
}

