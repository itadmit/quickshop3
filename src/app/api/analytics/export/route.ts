import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

// POST /api/analytics/export - Export analytics report
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { report_type, format = 'csv', start_date, end_date } = body;

    if (!report_type) {
      return NextResponse.json({ error: 'report_type is required' }, { status: 400 });
    }

    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = end_date || new Date().toISOString().split('T')[0];

    let csvContent = '';
    let filename = '';

    switch (report_type) {
      case 'sales': {
        filename = `sales-report-${startDate}-${endDate}.csv`;
        const salesData = await query<{
          date: string;
          orders: number;
          revenue: string;
          average_order_value: string;
        }>(
          `SELECT 
            DATE(created_at) as date,
            COUNT(*) as orders,
            SUM(total_price::numeric) as revenue,
            AVG(total_price::numeric) as average_order_value
           FROM orders
           WHERE store_id = $1 
             AND created_at >= $2 
             AND created_at <= $3
             AND financial_status = 'paid'
           GROUP BY DATE(created_at)
           ORDER BY date ASC`,
          [user.store_id, startDate, endDate]
        );

        csvContent = [
          'תאריך,הזמנות,הכנסות,ערך ממוצע',
          ...salesData.map(row => 
            `${row.date},${row.orders},${row.revenue},${row.average_order_value}`
          ),
        ].join('\n');
        break;
      }

      case 'products': {
        filename = `products-report-${startDate}-${endDate}.csv`;
        const productsData = await query<{
          product_title: string;
          total_quantity: number;
          total_revenue: string;
          order_count: number;
        }>(
          `SELECT 
            p.title as product_title,
            SUM(oli.quantity) as total_quantity,
            SUM(oli.price::numeric * oli.quantity) as total_revenue,
            COUNT(DISTINCT o.id) as order_count
           FROM products p
           INNER JOIN order_line_items oli ON oli.product_id = p.id
           INNER JOIN orders o ON o.id = oli.order_id
           WHERE p.store_id = $1 
             AND o.created_at >= $2 
             AND o.created_at <= $3
             AND o.financial_status = 'paid'
           GROUP BY p.id, p.title
           ORDER BY total_revenue DESC`,
          [user.store_id, startDate, endDate]
        );

        csvContent = [
          'מוצר,כמות,הכנסות,הזמנות',
          ...productsData.map(row => 
            `"${row.product_title}",${row.total_quantity},${row.total_revenue},${row.order_count}`
          ),
        ].join('\n');
        break;
      }

      case 'customers': {
        filename = `customers-report-${startDate}-${endDate}.csv`;
        const customersData = await query<{
          email: string;
          name: string;
          order_count: number;
          total_spent: string;
        }>(
          `SELECT 
            c.email,
            CONCAT(c.first_name, ' ', c.last_name) as name,
            COUNT(DISTINCT o.id) as order_count,
            COALESCE(SUM(o.total_price::numeric), 0) as total_spent
           FROM customers c
           LEFT JOIN orders o ON o.customer_id = c.id 
             AND o.created_at >= $2 
             AND o.created_at <= $3
             AND o.financial_status = 'paid'
           WHERE c.store_id = $1
           GROUP BY c.id, c.email, c.first_name, c.last_name
           ORDER BY total_spent DESC`,
          [user.store_id, startDate, endDate]
        );

        csvContent = [
          'אימייל,שם,הזמנות,סה"כ הוצאות',
          ...customersData.map(row => 
            `"${row.email}","${row.name}",${row.order_count},${row.total_spent}`
          ),
        ].join('\n');
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid report_type' }, { status: 400 });
    }

    // Add BOM for Hebrew support in Excel
    const csvWithBom = '\uFEFF' + csvContent;

    return new NextResponse(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export analytics' },
      { status: 500 }
    );
  }
}

