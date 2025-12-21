import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

/**
 * GET /api/reports/refunds
 * דוח החזרות וביטולים
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

    // סטטיסטיקות כלליות
    const statsResult = await queryOne<{
      total_refunds: string;
      total_refund_amount: string;
      total_orders: string;
    }>(`
      SELECT 
        (SELECT COUNT(*) FROM order_refunds WHERE store_id = $1 AND created_at >= $2 AND created_at <= $3::date + interval '1 day') as total_refunds,
        (SELECT COALESCE(SUM(amount), 0) FROM order_refunds WHERE store_id = $1 AND created_at >= $2 AND created_at <= $3::date + interval '1 day') as total_refund_amount,
        (SELECT COUNT(*) FROM orders WHERE store_id = $1 AND created_at >= $2 AND created_at <= $3::date + interval '1 day' AND financial_status IN ('paid', 'partially_paid', 'refunded', 'partially_refunded')) as total_orders
    `, [user.store_id, start_date, end_date]);

    // החזרים לפי סיבה
    const byReason = await query<{
      reason: string;
      count: string;
      amount: string;
    }>(`
      SELECT 
        COALESCE(reason, 'לא צוין') as reason,
        COUNT(*) as count,
        SUM(amount) as amount
      FROM order_refunds
      WHERE store_id = $1
        AND created_at >= $2
        AND created_at <= $3::date + interval '1 day'
      GROUP BY COALESCE(reason, 'לא צוין')
      ORDER BY amount DESC
    `, [user.store_id, start_date, end_date]);

    // החזרים יומיים
    const dailyRefunds = await query<{
      date: string;
      refunds: string;
      amount: string;
    }>(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as refunds,
        SUM(amount) as amount
      FROM order_refunds
      WHERE store_id = $1
        AND created_at >= $2
        AND created_at <= $3::date + interval '1 day'
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [user.store_id, start_date, end_date]);

    const totalRefunds = parseInt(statsResult?.total_refunds || '0');
    const totalRefundAmount = parseFloat(statsResult?.total_refund_amount || '0');
    const totalOrders = parseInt(statsResult?.total_orders || '0');

    const reasonsData = byReason.map((r) => ({
      reason: r.reason,
      count: parseInt(r.count),
      amount: parseFloat(r.amount) || 0,
      percentage: totalRefundAmount > 0 ? ((parseFloat(r.amount) || 0) / totalRefundAmount) * 100 : 0,
    }));

    return NextResponse.json({
      stats: {
        total_refunds: totalRefunds,
        total_refund_amount: totalRefundAmount,
        total_orders: totalOrders,
        refund_rate: totalOrders > 0 ? (totalRefunds / totalOrders) * 100 : 0,
        avg_refund_amount: totalRefunds > 0 ? totalRefundAmount / totalRefunds : 0,
      },
      by_reason: reasonsData,
      daily: dailyRefunds.map((d) => ({
        date: d.date,
        refunds: parseInt(d.refunds),
        amount: parseFloat(d.amount) || 0,
      })),
      period: { start_date, end_date },
    });
  } catch (error: any) {
    console.error('Error fetching refunds report:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}

