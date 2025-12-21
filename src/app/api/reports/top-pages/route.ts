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

    // Get page views from visitor_sessions (landing_page as proxy for page views)
    const pageData = await query<{
      page_path: string;
      page_views: string;
      unique_visitors: string;
    }>(`
      SELECT 
        COALESCE(landing_page, '/') as page_path,
        COUNT(*) as page_views,
        COUNT(DISTINCT visitor_id) as unique_visitors
      FROM visitor_sessions
      WHERE store_id = $1
        AND session_started_at >= $2
        AND session_started_at <= $3::date + interval '1 day'
      GROUP BY landing_page
      ORDER BY page_views DESC
      LIMIT 100
    `, [user.store_id, start_date, end_date]);

    const pages = pageData.map(p => ({
      page_path: p.page_path,
      page_title: '',
      page_views: parseInt(p.page_views) || 0,
      unique_visitors: parseInt(p.unique_visitors) || 0,
      avg_time_on_page: 0,
      bounce_rate: 0,
    }));

    const totals = {
      total_views: pages.reduce((acc, p) => acc + p.page_views, 0),
      total_visitors: pages.reduce((acc, p) => acc + p.unique_visitors, 0),
    };

    return NextResponse.json({ pages, totals, period: { start_date, end_date } });
  } catch (error: any) {
    console.error('Error fetching top pages:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}

