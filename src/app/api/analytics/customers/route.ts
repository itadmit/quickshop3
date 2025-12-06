import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { quickshopList } from '@/lib/utils/apiFormatter';

// GET /api/analytics/customers - Get customer analytics
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];

    // Get new customers
    const newCustomers = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM customers
       WHERE store_id = $1 
         AND created_at >= $2 
         AND created_at <= $3`,
      [user.store_id, startDate, endDate]
    );

    // Get returning customers
    const returningCustomers = await queryOne<{ count: number }>(
      `SELECT COUNT(DISTINCT c.id) as count
       FROM customers c
       INNER JOIN orders o ON o.customer_id = c.id
       WHERE c.store_id = $1 
         AND o.created_at >= $2 
         AND o.created_at <= $3
         AND c.created_at < $2`,
      [user.store_id, startDate, endDate]
    );

    // Get customer lifetime value
    const customerLTV = await query<{
      customer_id: number;
      customer_email: string;
      customer_name: string;
      total_spent: string;
      order_count: number;
    }>(
      `SELECT 
        c.id as customer_id,
        c.email as customer_email,
        CONCAT(c.first_name, ' ', c.last_name) as customer_name,
        COALESCE(SUM(o.total_price::numeric), 0) as total_spent,
        COUNT(DISTINCT o.id) as order_count
       FROM customers c
       LEFT JOIN orders o ON o.customer_id = c.id AND o.financial_status = 'paid'
       WHERE c.store_id = $1
       GROUP BY c.id, c.email, c.first_name, c.last_name
       ORDER BY total_spent DESC
       LIMIT 20`,
      [user.store_id]
    );

    // Get customers by acquisition date
    const customersByDate = await query<{
      date: string;
      new_customers: number;
      returning_customers: number;
    }>(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_customers,
        0 as returning_customers
       FROM customers
       WHERE store_id = $1 
         AND created_at >= $2 
         AND created_at <= $3
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [user.store_id, startDate, endDate]
    );

    // Calculate average order value per customer
    const avgOrderValue = await queryOne<{ avg_value: string }>(
      `SELECT AVG(total_price::numeric) as avg_value
       FROM orders
       WHERE store_id = $1 
         AND created_at >= $2 
         AND created_at <= $3
         AND financial_status = 'paid'
         AND customer_id IS NOT NULL`,
      [user.store_id, startDate, endDate]
    );

    return NextResponse.json({
      new_customers: newCustomers?.count || 0,
      returning_customers: returningCustomers?.count || 0,
      average_order_value: avgOrderValue?.avg_value || '0',
      top_customers: customerLTV,
      customers_by_date: customersByDate,
      period: {
        start_date: startDate,
        end_date: endDate,
      },
    });
  } catch (error: any) {
    console.error('Error fetching customer analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customer analytics' },
      { status: 500 }
    );
  }
}

