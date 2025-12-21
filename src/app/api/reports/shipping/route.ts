import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const start_date = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end_date = searchParams.get('end_date') || new Date().toISOString().split('T')[0];

    // Get shipping methods data
    const methodData = await query<{
      shipping_method: string;
      orders: string;
      revenue: string;
    }>(`
      SELECT 
        COALESCE(
          shipping_lines->0->>'title',
          CASE WHEN total_shipping_price = 0 THEN 'משלוח חינם' ELSE 'משלוח רגיל' END
        ) as shipping_method,
        COUNT(*) as orders,
        SUM(total_shipping_price) as revenue
      FROM orders
      WHERE store_id = $1
        AND created_at >= $2
        AND created_at <= $3::date + interval '1 day'
        AND financial_status IN ('paid', 'partially_paid', 'authorized')
      GROUP BY shipping_method
      ORDER BY orders DESC
    `, [user.store_id, start_date, end_date]);

    const totalOrders = methodData.reduce((acc, m) => acc + parseInt(m.orders), 0);
    const methods = methodData.map(m => {
      const orders = parseInt(m.orders) || 0;
      const revenue = parseFloat(m.revenue) || 0;
      return {
        method_name: m.shipping_method || 'משלוח רגיל',
        orders,
        revenue,
        avg_cost: orders > 0 ? revenue / orders : 0,
        percentage: totalOrders > 0 ? (orders / totalOrders) * 100 : 0,
      };
    });

    // Get daily shipping data
    const dailyData = await query<{
      date: string;
      orders: string;
      shipping_revenue: string;
    }>(`
      SELECT 
        DATE(created_at)::text as date,
        COUNT(*) as orders,
        SUM(total_shipping_price) as shipping_revenue
      FROM orders
      WHERE store_id = $1
        AND created_at >= $2
        AND created_at <= $3::date + interval '1 day'
        AND financial_status IN ('paid', 'partially_paid', 'authorized')
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [user.store_id, start_date, end_date]);

    const daily_data = dailyData.map(d => ({
      date: d.date,
      orders: parseInt(d.orders) || 0,
      shipping_revenue: parseFloat(d.shipping_revenue) || 0,
    }));

    // Stats
    const totalShipping = methods.reduce((acc, m) => acc + m.revenue, 0);
    const freeShippingOrders = methods.find(m => m.method_name === 'משלוח חינם')?.orders || 0;

    const stats = {
      total_shipping: totalShipping,
      total_orders: totalOrders,
      avg_shipping: totalOrders > 0 ? totalShipping / totalOrders : 0,
      free_shipping_orders: freeShippingOrders,
    };

    return NextResponse.json({ methods, daily_data, stats, period: { start_date, end_date } });
  } catch (error: any) {
    console.error('Error fetching shipping report:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}

