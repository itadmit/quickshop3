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

    // Get browser data
    const browserData = await query<{
      browser: string;
      sessions: string;
      completed_purchase: string;
    }>(`
      SELECT 
        COALESCE(browser, 'Unknown') as browser,
        COUNT(*) as sessions,
        SUM(CASE WHEN completed_purchase THEN 1 ELSE 0 END) as completed_purchase
      FROM visitor_sessions
      WHERE store_id = $1
        AND session_started_at >= $2
        AND session_started_at <= $3::date + interval '1 day'
      GROUP BY browser
      ORDER BY sessions DESC
    `, [user.store_id, start_date, end_date]);

    // Get OS data
    const osData = await query<{
      os: string;
      sessions: string;
      completed_purchase: string;
    }>(`
      SELECT 
        COALESCE(os, 'Unknown') as os,
        COUNT(*) as sessions,
        SUM(CASE WHEN completed_purchase THEN 1 ELSE 0 END) as completed_purchase
      FROM visitor_sessions
      WHERE store_id = $1
        AND session_started_at >= $2
        AND session_started_at <= $3::date + interval '1 day'
      GROUP BY os
      ORDER BY sessions DESC
    `, [user.store_id, start_date, end_date]);

    const totalSessions = browserData.reduce((acc, b) => acc + parseInt(b.sessions), 0);

    const browsers = browserData.map(b => {
      const sessions = parseInt(b.sessions) || 0;
      const orders = parseInt(b.completed_purchase) || 0;
      return {
        name: b.browser,
        sessions,
        percentage: totalSessions > 0 ? (sessions / totalSessions) * 100 : 0,
        orders,
        conversion_rate: sessions > 0 ? (orders / sessions) * 100 : 0,
      };
    });

    const operating_systems = osData.map(o => {
      const sessions = parseInt(o.sessions) || 0;
      const orders = parseInt(o.completed_purchase) || 0;
      return {
        name: o.os,
        sessions,
        percentage: totalSessions > 0 ? (sessions / totalSessions) * 100 : 0,
        orders,
        conversion_rate: sessions > 0 ? (orders / sessions) * 100 : 0,
      };
    });

    return NextResponse.json({
      browsers,
      operating_systems,
      totals: { total_sessions: totalSessions },
      period: { start_date, end_date },
    });
  } catch (error: any) {
    console.error('Error fetching browsers report:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}

