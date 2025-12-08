import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
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

    // Build WHERE clause
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
      JOIN orders o ON r.order_id = o.id
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
        c.last_name ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Get total count for pagination
    let countSql = `
      SELECT COUNT(*) as total 
      FROM returns r
      JOIN orders o ON r.order_id = o.id
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
        c.last_name ILIKE $${countParamIndex}
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
        orderNumber: r.order_number,
        orderName: r.order_name,
        orderTotal: parseFloat(r.order_total),
        orderFinancialStatus: r.order_financial_status,
        customerId: r.customer_id,
        customerName: r.customer_name,
        customerEmail: r.customer_email,
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

