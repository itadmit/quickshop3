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

    // סטטיסטיקות כלליות - דרך transactions עם kind = 'refund'
    const statsResult = await queryOne<{
      total_refunds: string;
      total_refund_amount: string;
      total_orders: string;
    }>(`
      SELECT 
        (SELECT COUNT(*) FROM transactions WHERE store_id = $1 AND kind = 'refund' AND status = 'success' AND created_at >= $2 AND created_at <= $3::date + interval '1 day') as total_refunds,
        (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE store_id = $1 AND kind = 'refund' AND status = 'success' AND created_at >= $2 AND created_at <= $3::date + interval '1 day') as total_refund_amount,
        (SELECT COUNT(*) FROM orders WHERE store_id = $1 AND created_at >= $2 AND created_at <= $3::date + interval '1 day' AND financial_status IN ('paid', 'partially_paid', 'refunded', 'partially_refunded')) as total_orders
    `, [user.store_id, start_date, end_date]);

    // נתוני החזרים מפורטים דרך order_refunds ו-orders
    const refundsData = await query<{
      refund_id: number;
      order_id: number;
      order_name: string;
      note: string;
      refund_amount: string;
      created_at: string;
    }>(`
      SELECT 
        r.id as refund_id,
        r.order_id,
        o.order_name,
        COALESCE(r.note, 'לא צוין') as note,
        COALESCE(
          (SELECT SUM((item->>'subtotal')::numeric) 
           FROM jsonb_array_elements(r.refund_line_items) as item), 
          0
        ) as refund_amount,
        r.created_at
      FROM order_refunds r
      JOIN orders o ON o.id = r.order_id
      WHERE o.store_id = $1
        AND r.created_at >= $2
        AND r.created_at <= $3::date + interval '1 day'
      ORDER BY r.created_at DESC
    `, [user.store_id, start_date, end_date]);

    // החזרים יומיים
    const dailyRefunds = await query<{
      date: string;
      refunds: string;
      amount: string;
    }>(`
      SELECT 
        DATE(t.created_at) as date,
        COUNT(*) as refunds,
        SUM(t.amount) as amount
      FROM transactions t
      WHERE t.store_id = $1
        AND t.kind = 'refund'
        AND t.status = 'success'
        AND t.created_at >= $2
        AND t.created_at <= $3::date + interval '1 day'
      GROUP BY DATE(t.created_at)
      ORDER BY date
    `, [user.store_id, start_date, end_date]);

    // החזרים לפי סיבה (מהערות)
    const byReason = await query<{
      reason: string;
      count: string;
      amount: string;
    }>(`
      SELECT 
        COALESCE(NULLIF(r.note, ''), 'לא צוין') as reason,
        COUNT(*) as count,
        SUM(COALESCE(
          (SELECT SUM((item->>'subtotal')::numeric) 
           FROM jsonb_array_elements(r.refund_line_items) as item), 
          0
        )) as amount
      FROM order_refunds r
      JOIN orders o ON o.id = r.order_id
      WHERE o.store_id = $1
        AND r.created_at >= $2
        AND r.created_at <= $3::date + interval '1 day'
      GROUP BY COALESCE(NULLIF(r.note, ''), 'לא צוין')
      ORDER BY amount DESC
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
      refunds: refundsData.map((r) => ({
        refund_id: r.refund_id,
        order_id: r.order_id,
        order_name: r.order_name,
        reason: r.note,
        amount: parseFloat(r.refund_amount) || 0,
        created_at: r.created_at,
      })),
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

