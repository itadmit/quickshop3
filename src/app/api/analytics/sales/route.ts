import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/analytics/sales - Get sales analytics
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];

    // Get sales data
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

    // Calculate totals
    const totals = await queryOne<{
      total_orders: number;
      total_revenue: string;
      average_order_value: string;
    }>(
      `SELECT 
        COUNT(*) as total_orders,
        SUM(total_price::numeric) as total_revenue,
        AVG(total_price::numeric) as average_order_value
      FROM orders
      WHERE store_id = $1 
        AND created_at >= $2 
        AND created_at <= $3
        AND financial_status = 'paid'`,
      [user.store_id, startDate, endDate]
    );

    return NextResponse.json({
      sales: salesData,
      totals: totals || {
        total_orders: 0,
        total_revenue: '0',
        average_order_value: '0',
      },
      period: {
        start_date: startDate,
        end_date: endDate,
      },
    });
  } catch (error: any) {
    console.error('Error fetching sales analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sales analytics' },
      { status: 500 }
    );
  }
}

