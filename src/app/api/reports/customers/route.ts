import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

/**
 * GET /api/reports/customers
 * דוח לקוחות - חדשים וחוזרים
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const start_date = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end_date = searchParams.get('end_date') || new Date().toISOString().split('T')[0];

    // סטטיסטיקות בסיסיות
    const statsResult = await queryOne<{
      total_customers: string;
      new_customers: string;
      returning_customers: string;
      one_time_buyers: string;
      repeat_buyers: string;
      total_revenue: string;
      new_customer_revenue: string;
      returning_customer_revenue: string;
      avg_order_value: string;
    }>(`
      WITH customer_orders AS (
        SELECT 
          COALESCE(customer_id, 0) as customer_id,
          email,
          COUNT(*) as order_count,
          SUM(total_price) as total_spent,
          MIN(created_at) as first_order,
          MAX(created_at) as last_order
        FROM orders
        WHERE store_id = $1
          AND financial_status IN ('paid', 'partially_paid', 'authorized')
        GROUP BY COALESCE(customer_id, 0), email
      ),
      period_orders AS (
        SELECT 
          COALESCE(o.customer_id, 0) as customer_id,
          o.email,
          o.total_price,
          CASE WHEN co.first_order >= $2 THEN 'new' ELSE 'returning' END as customer_type
        FROM orders o
        LEFT JOIN customer_orders co ON (
          (o.customer_id IS NOT NULL AND co.customer_id = o.customer_id) OR
          (o.customer_id IS NULL AND co.email = o.email)
        )
        WHERE o.store_id = $1
          AND o.created_at >= $2
          AND o.created_at <= $3::date + interval '1 day'
          AND o.financial_status IN ('paid', 'partially_paid', 'authorized')
      )
      SELECT
        COUNT(DISTINCT email) as total_customers,
        COUNT(DISTINCT CASE WHEN customer_type = 'new' THEN email END) as new_customers,
        COUNT(DISTINCT CASE WHEN customer_type = 'returning' THEN email END) as returning_customers,
        (SELECT COUNT(*) FROM customer_orders WHERE order_count = 1) as one_time_buyers,
        (SELECT COUNT(*) FROM customer_orders WHERE order_count > 1) as repeat_buyers,
        SUM(total_price) as total_revenue,
        SUM(CASE WHEN customer_type = 'new' THEN total_price ELSE 0 END) as new_customer_revenue,
        SUM(CASE WHEN customer_type = 'returning' THEN total_price ELSE 0 END) as returning_customer_revenue,
        AVG(total_price) as avg_order_value
      FROM period_orders
    `, [user.store_id, start_date, end_date]);

    // ערך חיי לקוח ממוצע
    const clvResult = await queryOne<{ avg_ltv: string; avg_orders: string }>(`
      SELECT 
        AVG(total_spent) as avg_ltv,
        AVG(order_count) as avg_orders
      FROM (
        SELECT 
          COALESCE(customer_id, 0) as customer_id,
          email,
          SUM(total_price) as total_spent,
          COUNT(*) as order_count
        FROM orders
        WHERE store_id = $1
          AND financial_status IN ('paid', 'partially_paid', 'authorized')
        GROUP BY COALESCE(customer_id, 0), email
      ) customer_totals
    `, [user.store_id]);

    // לקוחות מובילים
    const topCustomers = await query<{
      customer_id: number;
      customer_name: string;
      customer_email: string;
      orders_count: string;
      total_spent: string;
      avg_order_value: string;
      first_order_date: string;
      last_order_date: string;
    }>(`
      SELECT 
        COALESCE(o.customer_id, 0) as customer_id,
        COALESCE(c.first_name || ' ' || c.last_name, o.name, 'אורח') as customer_name,
        o.email as customer_email,
        COUNT(*) as orders_count,
        SUM(o.total_price) as total_spent,
        AVG(o.total_price) as avg_order_value,
        MIN(o.created_at) as first_order_date,
        MAX(o.created_at) as last_order_date
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id
      WHERE o.store_id = $1
        AND o.created_at >= $2
        AND o.created_at <= $3::date + interval '1 day'
        AND o.financial_status IN ('paid', 'partially_paid', 'authorized')
      GROUP BY COALESCE(o.customer_id, 0), c.first_name, c.last_name, o.name, o.email
      ORDER BY total_spent DESC
      LIMIT 20
    `, [user.store_id, start_date, end_date]);

    // לקוחות לפי יום
    const dailyCustomers = await query<{
      date: string;
      new_customers: string;
      returning_customers: string;
    }>(`
      WITH customer_first_order AS (
        SELECT email, MIN(created_at) as first_order
        FROM orders
        WHERE store_id = $1 AND financial_status IN ('paid', 'partially_paid', 'authorized')
        GROUP BY email
      )
      SELECT 
        DATE(o.created_at) as date,
        COUNT(DISTINCT CASE WHEN DATE(cfo.first_order) = DATE(o.created_at) THEN o.email END) as new_customers,
        COUNT(DISTINCT CASE WHEN DATE(cfo.first_order) < DATE(o.created_at) THEN o.email END) as returning_customers
      FROM orders o
      LEFT JOIN customer_first_order cfo ON cfo.email = o.email
      WHERE o.store_id = $1
        AND o.created_at >= $2
        AND o.created_at <= $3::date + interval '1 day'
        AND o.financial_status IN ('paid', 'partially_paid', 'authorized')
      GROUP BY DATE(o.created_at)
      ORDER BY date
    `, [user.store_id, start_date, end_date]);

    const stats = {
      total_customers: parseInt(statsResult?.total_customers || '0'),
      new_customers: parseInt(statsResult?.new_customers || '0'),
      returning_customers: parseInt(statsResult?.returning_customers || '0'),
      one_time_buyers: parseInt(statsResult?.one_time_buyers || '0'),
      repeat_buyers: parseInt(statsResult?.repeat_buyers || '0'),
      total_revenue: parseFloat(statsResult?.total_revenue || '0'),
      new_customer_revenue: parseFloat(statsResult?.new_customer_revenue || '0'),
      returning_customer_revenue: parseFloat(statsResult?.returning_customer_revenue || '0'),
      avg_order_value: parseFloat(statsResult?.avg_order_value || '0'),
      avg_orders_per_customer: parseFloat(clvResult?.avg_orders || '0'),
      avg_customer_lifetime_value: parseFloat(clvResult?.avg_ltv || '0'),
    };

    return NextResponse.json({
      stats,
      top_customers: topCustomers.map((c) => ({
        customer_id: c.customer_id,
        customer_name: c.customer_name,
        customer_email: c.customer_email,
        orders_count: parseInt(c.orders_count),
        total_spent: parseFloat(c.total_spent),
        avg_order_value: parseFloat(c.avg_order_value),
        first_order_date: c.first_order_date,
        last_order_date: c.last_order_date,
      })),
      daily_customers: dailyCustomers.map((d) => ({
        date: d.date,
        new_customers: parseInt(d.new_customers),
        returning_customers: parseInt(d.returning_customers),
      })),
      period: { start_date, end_date },
    });
  } catch (error: any) {
    console.error('Error fetching customers report:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}

