import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

/**
 * GET /api/reports/gift-cards
 * דוח גיפט קארדים
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

    // גיפט קארדים שנוצרו
    const createdGiftCards = await query<{
      date: string;
      count: string;
      total_value: string;
    }>(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        SUM(initial_value) as total_value
      FROM gift_cards
      WHERE store_id = $1
        AND created_at >= $2
        AND created_at <= $3::date + interval '1 day'
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [user.store_id, start_date, end_date]);

    // גיפט קארדים ששומשו
    const usedGiftCards = await query<{
      date: string;
      count: string;
      total_amount: string;
    }>(`
      SELECT 
        DATE(gct.created_at) as date,
        COUNT(DISTINCT gct.gift_card_id) as count,
        SUM(gct.amount) as total_amount
      FROM gift_card_transactions gct
      JOIN gift_cards gc ON gc.id = gct.gift_card_id
      WHERE gc.store_id = $1
        AND gct.transaction_type = 'used'
        AND gct.created_at >= $2
        AND gct.created_at <= $3::date + interval '1 day'
      GROUP BY DATE(gct.created_at)
      ORDER BY date
    `, [user.store_id, start_date, end_date]);

    // סטטיסטיקות כלליות
    const totalsResult = await queryOne<{
      total_created: string;
      total_value_created: string;
      total_active: string;
      total_used: string;
      total_amount_used: string;
      total_expired: string;
    }>(`
      SELECT 
        (SELECT COUNT(*) FROM gift_cards WHERE store_id = $1 AND created_at >= $2 AND created_at <= $3::date + interval '1 day') as total_created,
        (SELECT COALESCE(SUM(initial_value), 0) FROM gift_cards WHERE store_id = $1 AND created_at >= $2 AND created_at <= $3::date + interval '1 day') as total_value_created,
        (SELECT COUNT(*) FROM gift_cards WHERE store_id = $1 AND is_active = true AND (expires_at IS NULL OR expires_at > now())) as total_active,
        (SELECT COUNT(DISTINCT gct.gift_card_id) FROM gift_card_transactions gct JOIN gift_cards gc ON gc.id = gct.gift_card_id WHERE gc.store_id = $1 AND gct.transaction_type = 'used' AND gct.created_at >= $2 AND gct.created_at <= $3::date + interval '1 day') as total_used,
        (SELECT COALESCE(SUM(gct.amount), 0) FROM gift_card_transactions gct JOIN gift_cards gc ON gc.id = gct.gift_card_id WHERE gc.store_id = $1 AND gct.transaction_type = 'used' AND gct.created_at >= $2 AND gct.created_at <= $3::date + interval '1 day') as total_amount_used,
        (SELECT COUNT(*) FROM gift_cards WHERE store_id = $1 AND expires_at IS NOT NULL AND expires_at < now()) as total_expired
    `, [user.store_id, start_date, end_date]);

    // פירוט גיפט קארדים לפי סטטוס
    const giftCardsByStatus = await query<{
      code: string;
      initial_value: string;
      current_value: string;
      status: string;
      created_at: Date;
      expires_at: Date | null;
      usage_count: string;
    }>(`
      SELECT 
        gc.code,
        gc.initial_value,
        gc.current_value,
        CASE 
          WHEN gc.is_active = false THEN 'לא פעיל'
          WHEN gc.expires_at IS NOT NULL AND gc.expires_at < now() THEN 'פג תוקף'
          WHEN gc.current_value = 0 THEN 'מוצה'
          ELSE 'פעיל'
        END as status,
        gc.created_at,
        gc.expires_at,
        (SELECT COUNT(*) FROM gift_card_transactions WHERE gift_card_id = gc.id AND transaction_type = 'used') as usage_count
      FROM gift_cards gc
      WHERE gc.store_id = $1
        AND gc.created_at >= $2
        AND gc.created_at <= $3::date + interval '1 day'
      ORDER BY gc.created_at DESC
      LIMIT 100
    `, [user.store_id, start_date, end_date]);

    return NextResponse.json({
      created: createdGiftCards.map((d) => ({
        date: d.date,
        count: parseInt(d.count),
        total_value: parseFloat(d.total_value) || 0,
      })),
      used: usedGiftCards.map((d) => ({
        date: d.date,
        count: parseInt(d.count),
        total_amount: parseFloat(d.total_amount) || 0,
      })),
      totals: {
        total_created: parseInt(totalsResult?.total_created || '0'),
        total_value_created: parseFloat(totalsResult?.total_value_created || '0'),
        total_active: parseInt(totalsResult?.total_active || '0'),
        total_used: parseInt(totalsResult?.total_used || '0'),
        total_amount_used: parseFloat(totalsResult?.total_amount_used || '0'),
        total_expired: parseInt(totalsResult?.total_expired || '0'),
      },
      gift_cards: giftCardsByStatus.map((gc) => ({
        code: gc.code,
        initial_value: parseFloat(gc.initial_value),
        current_value: parseFloat(gc.current_value),
        status: gc.status,
        created_at: gc.created_at,
        expires_at: gc.expires_at,
        usage_count: parseInt(gc.usage_count) || 0,
      })),
      period: { start_date, end_date },
    });
  } catch (error: any) {
    console.error('Error fetching gift cards report:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}


