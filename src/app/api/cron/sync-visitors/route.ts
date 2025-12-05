import { NextRequest, NextResponse } from 'next/server';
import { syncAllVisitorsToPostgres, updateDailyAnalytics } from '@/lib/analytics/redis-to-postgres';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';

/**
 * CRON Job: העברת מבקרים מ-Redis ל-PostgreSQL
 * נקרא כל 5 דקות דרך Upstash QStash
 * 
 * הגדרה:
 * 1. קבל QSTASH_TOKEN מ-https://console.upstash.com/qstash
 * 2. הוסף ל-.env.local: QSTASH_TOKEN=...
 * 3. הרץ: npm run setup:qstash
 */
async function handler(request: NextRequest) {
  try {
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

// QStash signature verification (אם יש QSTASH_TOKEN ו-QSTASH_CURRENT_SIGNING_KEY)
// אם אין, מאפשר גישה ישירה (למקרה של בדיקות מקומיות)
const hasQStashConfig = process.env.QSTASH_TOKEN && process.env.QSTASH_CURRENT_SIGNING_KEY;

export const GET = hasQStashConfig 
  ? verifySignatureAppRouter(handler)
  : handler;

// Allow POST for manual triggers (with QStash verification)
export const POST = hasQStashConfig
  ? verifySignatureAppRouter(handler)
  : handler;
