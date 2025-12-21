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

    // Try to get search terms from analytics_events if exists
    let terms: { term: string; searches: number; results_count: number; clicks: number; conversion_rate: number }[] = [];
    let no_results: { term: string; searches: number; results_count: number; clicks: number; conversion_rate: number }[] = [];

    try {
      const searchData = await query<{
        search_term: string;
        searches: string;
        results_count: string;
      }>(`
        SELECT 
          event_data->>'search_term' as search_term,
          COUNT(*) as searches,
          AVG(COALESCE((event_data->>'results_count')::int, 0)) as results_count
        FROM analytics_events
        WHERE store_id = $1
          AND event_type = 'search'
          AND created_at >= $2
          AND created_at <= $3::date + interval '1 day'
          AND event_data->>'search_term' IS NOT NULL
        GROUP BY event_data->>'search_term'
        ORDER BY searches DESC
        LIMIT 100
      `, [user.store_id, start_date, end_date]);

      terms = searchData.map(s => ({
        term: s.search_term,
        searches: parseInt(s.searches) || 0,
        results_count: Math.round(parseFloat(s.results_count) || 0),
        clicks: 0,
        conversion_rate: 0,
      }));

      no_results = terms.filter(t => t.results_count === 0);
      terms = terms.filter(t => t.results_count > 0);
    } catch {
      // Table doesn't exist, return empty
    }

    const stats = {
      total_searches: terms.reduce((acc, t) => acc + t.searches, 0) + no_results.reduce((acc, t) => acc + t.searches, 0),
      unique_terms: terms.length + no_results.length,
      avg_results: terms.length > 0 ? terms.reduce((acc, t) => acc + t.results_count, 0) / terms.length : 0,
    };

    return NextResponse.json({ terms, no_results, stats, period: { start_date, end_date } });
  } catch (error: any) {
    console.error('Error fetching search terms:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}

