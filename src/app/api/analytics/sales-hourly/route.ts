import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

/**
 * GET /api/analytics/sales-hourly
 * מחזיר נתוני מכירות לפי שעות (עבור הגרף בדשבורד בזמן אמת)
 * מחזיר מערך של 24 שעות (או עד השעה הנוכחית)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // שאילתה שמקבצת מכירות לפי שעה ביום הנוכחי
    // משתמשים ב-generate_series כדי להבטיח שיש לנו את כל השעות גם אם אין מכירות
    const salesByHour = await query<{ hour: string; sales: number }>(
      `
      WITH hours AS (
        SELECT generate_series(
          date_trunc('day', NOW()), 
          date_trunc('hour', NOW()), 
          '1 hour'::interval
        ) as hour
      )
      SELECT 
        to_char(h.hour, 'HH24:00') as hour,
        COALESCE(SUM(o.total_price), 0) as sales
      FROM hours h
      LEFT JOIN orders o ON 
        date_trunc('hour', o.created_at) = h.hour 
        AND o.store_id = $1 
        AND o.financial_status = 'paid'
      GROUP BY h.hour
      ORDER BY h.hour ASC
      `,
      [user.store_id]
    );

    // המרה לפורמט פשוט לגרף
    const chartData = salesByHour.map(row => ({
      hour: row.hour,
      value: Number(row.sales)
    }));

    return NextResponse.json({ sales: chartData });
  } catch (error: any) {
    console.error('Error fetching hourly sales:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch hourly sales' },
      { status: 500 }
    );
  }
}

