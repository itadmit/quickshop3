import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

/**
 * GET /api/reports/revenue
 * דוח הכנסות פיננסי
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

    // סטטיסטיקות תקופה נוכחית
    const currentStats = await queryOne<{
      gross_revenue: string;
      total_tax: string;
      total_shipping: string;
      total_discounts: string;
      orders_count: string;
    }>(`
      SELECT 
        SUM(total_price) as gross_revenue,
        SUM(COALESCE(total_tax, 0)) as total_tax,
        SUM(COALESCE(total_shipping_price, 0)) as total_shipping,
        SUM(COALESCE(total_discounts, 0)) as total_discounts,
        COUNT(*) as orders_count
      FROM orders
      WHERE store_id = $1
        AND created_at >= $2
        AND created_at <= $3::date + interval '1 day'
        AND financial_status IN ('paid', 'partially_paid', 'authorized')
    `, [user.store_id, start_date, end_date]);

    // החזרים
    const refundsResult = await queryOne<{ total_refunds: string }>(`
      SELECT COALESCE(SUM(amount), 0) as total_refunds
      FROM order_refunds
      WHERE store_id = $1
        AND created_at >= $2
        AND created_at <= $3::date + interval '1 day'
    `, [user.store_id, start_date, end_date]);

    // תקופה קודמת לחישוב צמיחה
    const periodDays = Math.ceil((new Date(end_date).getTime() - new Date(start_date).getTime()) / (1000 * 60 * 60 * 24));
    const prevStartDate = new Date(new Date(start_date).getTime() - periodDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const prevStats = await queryOne<{ gross_revenue: string }>(`
      SELECT SUM(total_price) as gross_revenue
      FROM orders
      WHERE store_id = $1
        AND created_at >= $2
        AND created_at < $3
        AND financial_status IN ('paid', 'partially_paid', 'authorized')
    `, [user.store_id, prevStartDate, start_date]);

    // הכנסות יומיות
    const dailyRevenue = await query<{
      date: string;
      gross_revenue: string;
      orders: string;
      discounts: string;
    }>(`
      SELECT 
        DATE(created_at) as date,
        SUM(total_price) as gross_revenue,
        COUNT(*) as orders,
        SUM(COALESCE(total_discounts, 0)) as discounts
      FROM orders
      WHERE store_id = $1
        AND created_at >= $2
        AND created_at <= $3::date + interval '1 day'
        AND financial_status IN ('paid', 'partially_paid', 'authorized')
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [user.store_id, start_date, end_date]);

    // הכנסות לפי אמצעי תשלום
    const byPayment = await query<{
      payment_method: string;
      revenue: string;
      orders: string;
    }>(`
      SELECT 
        COALESCE(gateway, 'Unknown') as payment_method,
        SUM(total_price) as revenue,
        COUNT(*) as orders
      FROM orders
      WHERE store_id = $1
        AND created_at >= $2
        AND created_at <= $3::date + interval '1 day'
        AND financial_status IN ('paid', 'partially_paid', 'authorized')
      GROUP BY COALESCE(gateway, 'Unknown')
      ORDER BY revenue DESC
    `, [user.store_id, start_date, end_date]);

    const grossRevenue = parseFloat(currentStats?.gross_revenue || '0');
    const totalTax = parseFloat(currentStats?.total_tax || '0');
    const totalShipping = parseFloat(currentStats?.total_shipping || '0');
    const totalDiscounts = parseFloat(currentStats?.total_discounts || '0');
    const totalRefunds = parseFloat(refundsResult?.total_refunds || '0');
    const ordersCount = parseInt(currentStats?.orders_count || '0');
    const prevGrossRevenue = parseFloat(prevStats?.gross_revenue || '0');

    const netRevenue = grossRevenue - totalDiscounts - totalRefunds;
    const revenueGrowth = prevGrossRevenue > 0 ? ((grossRevenue - prevGrossRevenue) / prevGrossRevenue) * 100 : 0;

    const totalPaymentRevenue = byPayment.reduce((acc, p) => acc + parseFloat(p.revenue), 0);

    return NextResponse.json({
      stats: {
        gross_revenue: grossRevenue,
        net_revenue: netRevenue,
        total_tax: totalTax,
        total_shipping: totalShipping,
        total_discounts: totalDiscounts,
        total_refunds: totalRefunds,
        orders_count: ordersCount,
        avg_order_value: ordersCount > 0 ? grossRevenue / ordersCount : 0,
        revenue_growth: revenueGrowth,
      },
      daily: dailyRevenue.map((d) => {
        const gross = parseFloat(d.gross_revenue);
        const discounts = parseFloat(d.discounts);
        return {
          date: d.date,
          gross_revenue: gross,
          net_revenue: gross - discounts,
          orders: parseInt(d.orders),
        };
      }),
      by_payment: byPayment.map((p) => ({
        payment_method: p.payment_method,
        revenue: parseFloat(p.revenue),
        orders: parseInt(p.orders),
        percentage: totalPaymentRevenue > 0 ? (parseFloat(p.revenue) / totalPaymentRevenue) * 100 : 0,
      })),
      period: { start_date, end_date },
    });
  } catch (error: any) {
    console.error('Error fetching revenue report:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}

