import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/customers/export - Export customers as CSV
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const storeId = user.store_id;
    const format = searchParams.get('format') || 'csv'; // csv or json
    
    // Apply same filters as GET /api/customers
    const search = searchParams.get('search');
    const state = searchParams.get('state');
    const acceptsMarketing = searchParams.get('accepts_marketing');
    const tag = searchParams.get('tag');
    const minOrders = searchParams.get('min_orders');
    const maxOrders = searchParams.get('max_orders');
    const minTotalSpent = searchParams.get('min_total_spent');
    const maxTotalSpent = searchParams.get('max_total_spent');
    const createdAfter = searchParams.get('created_after');
    const createdBefore = searchParams.get('created_before');

    let sql = `
      SELECT c.*,
             COUNT(DISTINCT o.id) as orders_count,
             COALESCE(SUM(o.total_price::numeric), 0) as total_spent
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id
      WHERE c.store_id = $1
    `;
    const params: any[] = [storeId];
    let paramIndex = 2;

    if (search) {
      sql += ` AND (
        c.email ILIKE $${paramIndex} OR 
        c.first_name ILIKE $${paramIndex} OR 
        c.last_name ILIKE $${paramIndex} OR
        c.phone ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (state) {
      sql += ` AND c.state = $${paramIndex}`;
      params.push(state);
      paramIndex++;
    }

    if (acceptsMarketing !== null && acceptsMarketing !== undefined) {
      sql += ` AND c.accepts_marketing = $${paramIndex}`;
      params.push(acceptsMarketing === 'true');
      paramIndex++;
    }

    if (tag) {
      sql += ` AND EXISTS (
        SELECT 1 FROM customer_tag_map 
        WHERE customer_id = c.id 
        AND tag_name = $${paramIndex}
      )`;
      params.push(tag);
      paramIndex++;
    }

    if (createdAfter) {
      sql += ` AND c.created_at >= $${paramIndex}`;
      params.push(createdAfter);
      paramIndex++;
    }
    if (createdBefore) {
      sql += ` AND c.created_at <= $${paramIndex}`;
      params.push(createdBefore);
      paramIndex++;
    }

    sql += ` GROUP BY c.id`;

    if (minOrders || maxOrders) {
      sql += ` HAVING COUNT(DISTINCT o.id)`;
      if (minOrders) {
        sql += ` >= $${paramIndex}`;
        params.push(parseInt(minOrders));
        paramIndex++;
      }
      if (maxOrders) {
        if (minOrders) {
          sql += ` AND COUNT(DISTINCT o.id)`;
        }
        sql += ` <= $${paramIndex}`;
        params.push(parseInt(maxOrders));
        paramIndex++;
      }
    }

    if (minTotalSpent || maxTotalSpent) {
      if (!minOrders && !maxOrders) {
        sql += ` HAVING`;
      } else {
        sql += ` AND`;
      }
      sql += ` COALESCE(SUM(o.total_price::numeric), 0)`;
      if (minTotalSpent) {
        sql += ` >= $${paramIndex}`;
        params.push(parseFloat(minTotalSpent));
        paramIndex++;
      }
      if (maxTotalSpent) {
        if (minTotalSpent) {
          sql += ` AND COALESCE(SUM(o.total_price::numeric), 0)`;
        }
        sql += ` <= $${paramIndex}`;
        params.push(parseFloat(maxTotalSpent));
        paramIndex++;
      }
    }

    sql += ` ORDER BY c.created_at DESC`;

    const customers = await query<{
      id: number;
      email: string | null;
      first_name: string | null;
      last_name: string | null;
      phone: string | null;
      accepts_marketing: boolean;
      state: string;
      tags: string | null;
      orders_count: number;
      total_spent: string;
      created_at: Date;
    }>(sql, params);

    if (format === 'json') {
      return NextResponse.json({ customers }, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="customers-${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    }

    // CSV format
    const csvHeaders = [
      'ID',
      'Email',
      'First Name',
      'Last Name',
      'Phone',
      'Accepts Marketing',
      'State',
      'Tags',
      'Orders Count',
      'Total Spent',
      'Created At',
    ];

    const csvRows = customers.map(customer => [
      customer.id.toString(),
      customer.email || '',
      customer.first_name || '',
      customer.last_name || '',
      customer.phone || '',
      customer.accepts_marketing ? 'Yes' : 'No',
      customer.state,
      customer.tags || '',
      customer.orders_count.toString(),
      customer.total_spent,
      new Date(customer.created_at).toISOString(),
    ]);

    // Escape CSV values
    const escapeCsv = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvContent = [
      csvHeaders.map(escapeCsv).join(','),
      ...csvRows.map(row => row.map(escapeCsv).join(',')),
    ].join('\n');

    // Add BOM for Hebrew support in Excel
    const csvWithBom = '\uFEFF' + csvContent;

    return new NextResponse(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="customers-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting customers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export customers' },
      { status: 500 }
    );
  }
}

