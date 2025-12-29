import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

/**
 * GET /api/reports/store-credits
 * דוח קרדיטים בחנות
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

    // קרדיטים שנוצרו
    const earnedCredits = await query<{
      date: string;
      count: string;
      total_amount: string;
    }>(`
      SELECT 
        DATE(sct.created_at) as date,
        COUNT(DISTINCT sct.store_credit_id) as count,
        SUM(sct.amount) as total_amount
      FROM store_credit_transactions sct
      JOIN store_credits sc ON sc.id = sct.store_credit_id
      WHERE sc.store_id = $1
        AND sct.transaction_type = 'earned'
        AND sct.created_at >= $2
        AND sct.created_at <= $3::date + interval '1 day'
      GROUP BY DATE(sct.created_at)
      ORDER BY date
    `, [user.store_id, start_date, end_date]);

    // קרדיטים ששומשו
    const usedCredits = await query<{
      date: string;
      count: string;
      total_amount: string;
    }>(`
      SELECT 
        DATE(sct.created_at) as date,
        COUNT(DISTINCT sct.store_credit_id) as count,
        SUM(sct.amount) as total_amount
      FROM store_credit_transactions sct
      JOIN store_credits sc ON sc.id = sct.store_credit_id
      WHERE sc.store_id = $1
        AND sct.transaction_type = 'used'
        AND sct.created_at >= $2
        AND sct.created_at <= $3::date + interval '1 day'
      GROUP BY DATE(sct.created_at)
      ORDER BY date
    `, [user.store_id, start_date, end_date]);

    // סטטיסטיקות כלליות
    const totalsResult = await queryOne<{
      total_customers_with_credit: string;
      total_balance: string;
      total_earned: string;
      total_used: string;
      total_expired: string;
    }>(`
      SELECT 
        (SELECT COUNT(*) FROM store_credits WHERE store_id = $1 AND balance > 0) as total_customers_with_credit,
        (SELECT COALESCE(SUM(balance), 0) FROM store_credits WHERE store_id = $1) as total_balance,
        (SELECT COALESCE(SUM(sct.amount), 0) FROM store_credit_transactions sct JOIN store_credits sc ON sc.id = sct.store_credit_id WHERE sc.store_id = $1 AND sct.transaction_type = 'earned' AND sct.created_at >= $2 AND sct.created_at <= $3::date + interval '1 day') as total_earned,
        (SELECT COALESCE(SUM(sct.amount), 0) FROM store_credit_transactions sct JOIN store_credits sc ON sc.id = sct.store_credit_id WHERE sc.store_id = $1 AND sct.transaction_type = 'used' AND sct.created_at >= $2 AND sct.created_at <= $3::date + interval '1 day') as total_used,
        (SELECT COALESCE(SUM(sct.amount), 0) FROM store_credit_transactions sct JOIN store_credits sc ON sc.id = sct.store_credit_id WHERE sc.store_id = $1 AND sct.transaction_type = 'expired' AND sct.created_at >= $2 AND sct.created_at <= $3::date + interval '1 day') as total_expired
    `, [user.store_id, start_date, end_date]);

    // פירוט קרדיטים לפי לקוח
    const creditsByCustomer = await query<{
      customer_id: number;
      customer_name: string;
      customer_email: string;
      balance: string;
      total_earned: string;
      total_used: string;
      transaction_count: string;
    }>(`
      SELECT 
        sc.customer_id,
        c.first_name || ' ' || COALESCE(c.last_name, '') as customer_name,
        c.email as customer_email,
        sc.balance,
        (SELECT COALESCE(SUM(amount), 0) FROM store_credit_transactions WHERE store_credit_id = sc.id AND transaction_type = 'earned') as total_earned,
        (SELECT COALESCE(SUM(amount), 0) FROM store_credit_transactions WHERE store_credit_id = sc.id AND transaction_type = 'used') as total_used,
        (SELECT COUNT(*) FROM store_credit_transactions WHERE store_credit_id = sc.id) as transaction_count
      FROM store_credits sc
      LEFT JOIN customers c ON c.id = sc.customer_id
      WHERE sc.store_id = $1
        AND (sc.created_at >= $2 OR EXISTS (
          SELECT 1 FROM store_credit_transactions sct 
          WHERE sct.store_credit_id = sc.id 
          AND sct.created_at >= $2 
          AND sct.created_at <= $3::date + interval '1 day'
        ))
      ORDER BY sc.balance DESC
      LIMIT 100
    `, [user.store_id, start_date, end_date]);

    return NextResponse.json({
      earned: earnedCredits.map((d) => ({
        date: d.date,
        count: parseInt(d.count),
        total_amount: parseFloat(d.total_amount) || 0,
      })),
      used: usedCredits.map((d) => ({
        date: d.date,
        count: parseInt(d.count),
        total_amount: parseFloat(d.total_amount) || 0,
      })),
      totals: {
        total_customers_with_credit: parseInt(totalsResult?.total_customers_with_credit || '0'),
        total_balance: parseFloat(totalsResult?.total_balance || '0'),
        total_earned: parseFloat(totalsResult?.total_earned || '0'),
        total_used: parseFloat(totalsResult?.total_used || '0'),
        total_expired: parseFloat(totalsResult?.total_expired || '0'),
      },
      customers: creditsByCustomer.map((c) => ({
        customer_id: c.customer_id,
        customer_name: c.customer_name || 'לא ידוע',
        customer_email: c.customer_email,
        balance: parseFloat(c.balance) || 0,
        total_earned: parseFloat(c.total_earned) || 0,
        total_used: parseFloat(c.total_used) || 0,
        transaction_count: parseInt(c.transaction_count) || 0,
      })),
      period: { start_date, end_date },
    });
  } catch (error: any) {
    console.error('Error fetching store credits report:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}


