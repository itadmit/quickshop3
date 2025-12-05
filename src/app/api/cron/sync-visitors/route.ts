import { NextRequest, NextResponse } from 'next/server';
import { syncAllVisitorsToPostgres, updateDailyAnalytics } from '@/lib/analytics/redis-to-postgres';

/**
 * CRON Job: העברת מבקרים מ-Redis ל-PostgreSQL
 * נקרא כל 5 דקות (Vercel Cron Jobs או external cron service)
 * 
 * Vercel Cron: https://vercel.com/docs/cron-jobs
 * הוסף ל-vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/sync-visitors",
 *     "schedule": "*/5 * * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // בדיקת Authorization (Vercel Cron או API Key)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // אם יש CRON_SECRET, נדרוש אותו
      // אם לא, נאפשר גישה (למקרה של Vercel Cron)
      const isVercelCron = request.headers.get('user-agent')?.includes('vercel-cron');
      if (!isVercelCron) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // העברת מבקרים מ-Redis ל-PostgreSQL
    const synced = await syncAllVisitorsToPostgres();
    
    // עדכון analytics_daily (רק פעם ביום, בשעה 00:00)
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() < 5) {
      await updateDailyAnalytics(new Date(now.getTime() - 24 * 60 * 60 * 1000)); // אתמול
    }

    return NextResponse.json({
      success: true,
      synced,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[CRON sync-visitors] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync visitors' },
      { status: 500 }
    );
  }
}

// Allow POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}

