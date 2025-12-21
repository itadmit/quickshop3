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

    // Get daily tax data
    const taxData = await query<{
      date: string;
      orders: string;
      subtotal: string;
      tax_amount: string;
      total: string;
    }>(`
      SELECT 
        DATE(created_at)::text as date,
        COUNT(*) as orders,
        SUM(subtotal_price) as subtotal,
        SUM(total_tax) as tax_amount,
        SUM(total_price) as total
      FROM orders
      WHERE store_id = $1
        AND created_at >= $2
        AND created_at <= $3::date + interval '1 day'
        AND financial_status IN ('paid', 'partially_paid', 'authorized')
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [user.store_id, start_date, end_date]);

    const daily_data = taxData.map(d => ({
      date: d.date,
      orders: parseInt(d.orders) || 0,
      subtotal: parseFloat(d.subtotal) || 0,
      tax_amount: parseFloat(d.tax_amount) || 0,
      total: parseFloat(d.total) || 0,
    }));

    // Calculate stats
    const totalTax = daily_data.reduce((acc, d) => acc + d.tax_amount, 0);
    const totalSubtotal = daily_data.reduce((acc, d) => acc + d.subtotal, 0);
    const totalOrders = daily_data.reduce((acc, d) => acc + d.orders, 0);

    const stats = {
      total_tax: totalTax,
      total_orders: totalOrders,
      avg_tax_per_order: totalOrders > 0 ? totalTax / totalOrders : 0,
      effective_tax_rate: totalSubtotal > 0 ? (totalTax / totalSubtotal) * 100 : 0,
    };

    return NextResponse.json({ daily_data, tax_by_rate: [], stats, period: { start_date, end_date } });
  } catch (error: any) {
    console.error('Error fetching taxes report:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}

