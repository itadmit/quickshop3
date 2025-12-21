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

    // Get session duration data
    const durationData = await query<{
      duration_seconds: string;
    }>(`
      SELECT 
        EXTRACT(EPOCH FROM (last_activity_at - session_started_at)) as duration_seconds
      FROM visitor_sessions
      WHERE store_id = $1
        AND session_started_at >= $2
        AND session_started_at <= $3::date + interval '1 day'
        AND last_activity_at IS NOT NULL
        AND last_activity_at > session_started_at
    `, [user.store_id, start_date, end_date]);

    const durations = durationData.map(d => parseFloat(d.duration_seconds) || 0).filter(d => d > 0 && d < 3600);

    // Distribution ranges
    const ranges = [
      { min: 0, max: 10, label: '0-10 שנ' },
      { min: 10, max: 30, label: '10-30 שנ' },
      { min: 30, max: 60, label: '30-60 שנ' },
      { min: 60, max: 180, label: '1-3 דק' },
      { min: 180, max: 600, label: '3-10 דק' },
      { min: 600, max: 1800, label: '10-30 דק' },
      { min: 1800, max: Infinity, label: '30+ דק' },
    ];

    const totalSessions = durations.length;
    const distribution = ranges.map(range => {
      const count = durations.filter(d => d >= range.min && d < range.max).length;
      return {
        duration_range: range.label,
        sessions: count,
        percentage: totalSessions > 0 ? (count / totalSessions) * 100 : 0,
      };
    });

    // Daily averages
    const dailyData = await query<{
      date: string;
      avg_duration: string;
      sessions: string;
    }>(`
      SELECT 
        DATE(session_started_at)::text as date,
        AVG(EXTRACT(EPOCH FROM (last_activity_at - session_started_at))) as avg_duration,
        COUNT(*) as sessions
      FROM visitor_sessions
      WHERE store_id = $1
        AND session_started_at >= $2
        AND session_started_at <= $3::date + interval '1 day'
        AND last_activity_at IS NOT NULL
        AND last_activity_at > session_started_at
      GROUP BY DATE(session_started_at)
      ORDER BY date
    `, [user.store_id, start_date, end_date]);

    const daily_data = dailyData.map(d => ({
      date: d.date,
      avg_duration: parseFloat(d.avg_duration) || 0,
      sessions: parseInt(d.sessions) || 0,
    }));

    // Stats
    const sortedDurations = [...durations].sort((a, b) => a - b);
    const stats = {
      avg_duration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      median_duration: sortedDurations.length > 0 ? sortedDurations[Math.floor(sortedDurations.length / 2)] : 0,
      total_sessions: totalSessions,
    };

    return NextResponse.json({ distribution, daily_data, stats, period: { start_date, end_date } });
  } catch (error: any) {
    console.error('Error fetching session duration:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}

