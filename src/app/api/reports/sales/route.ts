import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

/**
 * GET /api/reports/sales
 * דוח מכירות כללי
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
    const group_by = searchParams.get('group_by') || 'day';

    // מכירות לפי תקופה
    let groupClause = 'DATE(created_at)';
    if (group_by === 'week') {
      groupClause = 'DATE_TRUNC(\'week\', created_at)';
    } else if (group_by === 'month') {
      groupClause = 'DATE_TRUNC(\'month\', created_at)';
    }

    const salesData = await query<{
      date: string;
      revenue: string;
      orders: string;
    }>(`
      SELECT 
        ${groupClause} as date,
        SUM(total_price) as revenue,
        COUNT(*) as orders
      FROM orders
      WHERE store_id = $1
        AND created_at >= $2
        AND created_at <= $3::date + interval '1 day'
        AND financial_status IN ('paid', 'partially_paid', 'authorized')
      GROUP BY ${groupClause}
      ORDER BY date
    `, [user.store_id, start_date, end_date]);

    // סטטיסטיקות תקופה נוכחית
    const currentStats = await queryOne<{
      total_revenue: string;
      total_orders: string;
    }>(`
      SELECT 
        COALESCE(SUM(total_price), 0) as total_revenue,
        COUNT(*) as total_orders
      FROM orders
      WHERE store_id = $1
        AND created_at >= $2
        AND created_at <= $3::date + interval '1 day'
        AND financial_status IN ('paid', 'partially_paid', 'authorized')
    `, [user.store_id, start_date, end_date]);

    // תקופה קודמת לחישוב צמיחה
    const periodDays = Math.ceil((new Date(end_date).getTime() - new Date(start_date).getTime()) / (1000 * 60 * 60 * 24));
    const prevStartDate = new Date(new Date(start_date).getTime() - periodDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const prevStats = await queryOne<{
      total_revenue: string;
      total_orders: string;
    }>(`
      SELECT 
        COALESCE(SUM(total_price), 0) as total_revenue,
        COUNT(*) as total_orders
      FROM orders
      WHERE store_id = $1
        AND created_at >= $2
        AND created_at < $3
        AND financial_status IN ('paid', 'partially_paid', 'authorized')
    `, [user.store_id, prevStartDate, start_date]);

    const totalRevenue = parseFloat(currentStats?.total_revenue || '0');
    const totalOrders = parseInt(currentStats?.total_orders || '0');
    const prevRevenue = parseFloat(prevStats?.total_revenue || '0');
    const prevOrders = parseInt(prevStats?.total_orders || '0');

    const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const ordersGrowth = prevOrders > 0 ? ((totalOrders - prevOrders) / prevOrders) * 100 : 0;

    const sales = salesData.map((d) => {
      const revenue = parseFloat(d.revenue);
      const orders = parseInt(d.orders);
      return {
        date: d.date,
        revenue,
        orders,
        avg_order_value: orders > 0 ? revenue / orders : 0,
      };
    });

    return NextResponse.json({
      sales,
      stats: {
        total_revenue: totalRevenue,
        total_orders: totalOrders,
        avg_order_value: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        revenue_growth: revenueGrowth,
        orders_growth: ordersGrowth,
      },
      period: { start_date, end_date, group_by },
    });
  } catch (error: any) {
    console.error('Error fetching sales report:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}

