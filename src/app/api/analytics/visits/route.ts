import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/analytics/visits - Get visits analytics
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];

    // Get visits from analytics_daily
    const visitsData = await query<{
      date: string;
      visits: number;
      unique_visitors: number;
    }>(
      `SELECT 
        date,
        visits,
        unique_visitors
      FROM analytics_daily
      WHERE store_id = $1 
        AND date >= $2 
        AND date <= $3
      ORDER BY date ASC`,
      [user.store_id, startDate, endDate]
    );

    // Calculate totals
    const totals = await queryOne<{
      total_visits: number;
      total_unique_visitors: number;
    }>(
      `SELECT 
        SUM(visits) as total_visits,
        SUM(unique_visitors) as total_unique_visitors
      FROM analytics_daily
      WHERE store_id = $1 
        AND date >= $2 
        AND date <= $3`,
      [user.store_id, startDate, endDate]
    );

    return NextResponse.json({
      visits: visitsData,
      totals: totals || {
        total_visits: 0,
        total_unique_visitors: 0,
      },
      period: {
        start_date: startDate,
        end_date: endDate,
      },
    });
  } catch (error: any) {
    console.error('Error fetching visits analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch visits analytics' },
      { status: 500 }
    );
  }
}

