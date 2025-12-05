/**
 * Redis to PostgreSQL Sync
 * מערכת היברידית להעברת נתונים מ-Redis (זמן אמת) ל-PostgreSQL (היסטוריה)
 * 
 * אסטרטגיה:
 * 1. Redis = נתונים בזמן אמת (TTL 10 דקות) - מהיר, זול, לא מעמיס על DB
 * 2. PostgreSQL = נתונים היסטוריים - לסיכומים יומיים/חודשיים
 * 3. Batch Job כל 5 דקות מעביר נתונים מ-Redis ל-PostgreSQL לפני שהם נמחקים
 */

import { getRedis } from '../session-tracker';
import { query } from '../db';
import type { ActiveVisitorData } from '../session-tracker';

const ACTIVE_VISITOR_PREFIX = 'active_visitor:';
const ACTIVE_VISITORS_SET = 'active_visitors_set';

/**
 * העברת מבקר מ-Redis ל-PostgreSQL לפני שהוא נמחק
 */
export async function syncVisitorToPostgres(visitorId: string, visitorData: ActiveVisitorData): Promise<void> {
  try {
    // בדיקה אם המבקר כבר נשמר (למנוע כפילויות)
    const existing = await query<{ id: number }>(
      `SELECT id FROM visitor_sessions 
       WHERE visitor_id = $1 AND store_slug = $2 
       ORDER BY session_started_at DESC LIMIT 1`,
      [visitorId, visitorData.store_slug]
    );

    if (existing && existing.length > 0) {
      // עדכון session קיים במקום יצירת חדש
      await query(
        `UPDATE visitor_sessions SET
          session_ended_at = $1,
          duration_seconds = EXTRACT(EPOCH FROM ($1 - session_started_at))::INT,
          page_views = $2,
          reached_cart = $3,
          reached_checkout = $4,
          completed_purchase = $5,
          pages_visited = COALESCE(pages_visited, '[]'::jsonb) || $6::jsonb
        WHERE id = $7`,
        [
          new Date(visitorData.last_activity),
          visitorData.page_views || 1,
          visitorData.current_page?.includes('/cart') || false,
          visitorData.current_page?.includes('/checkout') && !visitorData.current_page?.includes('/success') || false,
          visitorData.current_page?.includes('/checkout/success') || false,
          JSON.stringify(visitorData.current_page ? [visitorData.current_page] : []),
          existing[0].id
        ]
      );
      return;
    }

    // יצירת session חדש
    const pagesVisited = visitorData.current_page ? [visitorData.current_page] : [];

    await query(
      `INSERT INTO visitor_sessions (
        visitor_id, store_id, store_slug,
        session_started_at, session_ended_at, duration_seconds, page_views,
        ip_address, country, country_code, city, region, lat, lon, timezone,
        device_type, browser, os, user_agent,
        referrer, utm_source, utm_medium, utm_campaign, utm_term, utm_content,
        pages_visited, reached_cart, reached_checkout, completed_purchase,
        metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)`,
      [
        visitorId,
        visitorData.store_id || null,
        visitorData.store_slug || null,
        visitorData.first_seen ? new Date(visitorData.first_seen) : new Date(visitorData.last_activity),
        new Date(visitorData.last_activity),
        visitorData.first_seen 
          ? Math.floor((visitorData.last_activity - visitorData.first_seen) / 1000)
          : 0,
        visitorData.page_views || 1,
        visitorData.ip_address || null,
        visitorData.country || null,
        visitorData.country_code || null,
        visitorData.city || null,
        visitorData.region || null,
        visitorData.lat || null,
        visitorData.lon || null,
        visitorData.timezone || null,
        visitorData.device_type || null,
        visitorData.browser || null,
        visitorData.os || null,
        visitorData.user_agent || null,
        visitorData.referrer || null,
        visitorData.utm_source || null,
        visitorData.utm_medium || null,
        visitorData.utm_campaign || null,
        visitorData.utm_term || null,
        visitorData.utm_content || null,
        JSON.stringify(pagesVisited),
        visitorData.current_page?.includes('/cart') || false,
        visitorData.current_page?.includes('/checkout') && !visitorData.current_page?.includes('/success') || false,
        visitorData.current_page?.includes('/checkout/success') || false,
        JSON.stringify({}) // metadata נוסף
      ]
    );
  } catch (error) {
    console.error('[syncVisitorToPostgres] Error syncing visitor:', error);
    // לא נכשל את התהליך אם יש שגיאה - רק נרשום לוג
  }
}

/**
 * Batch Job: העברת כל המבקרים הפעילים מ-Redis ל-PostgreSQL
 * נקרא כל 5 דקות (לפני שהנתונים נמחקים אחרי 10 דקות)
 */
export async function syncAllVisitorsToPostgres(): Promise<number> {
  try {
    const redisClient = getRedis();
    if (!redisClient) {
      return 0;
    }

    const visitorIds = await redisClient.smembers(ACTIVE_VISITORS_SET);
    let synced = 0;

    for (const visitorId of visitorIds) {
      const key = `${ACTIVE_VISITOR_PREFIX}${visitorId}`;
      try {
        const data = await redisClient.get<string>(key);
        if (data) {
          let visitorData: ActiveVisitorData;
          if (typeof data === 'string') {
            visitorData = JSON.parse(data);
          } else {
            visitorData = data as ActiveVisitorData;
          }

          // העברה ל-PostgreSQL
          await syncVisitorToPostgres(visitorId, visitorData);
          synced++;
        }
      } catch (error) {
        console.error(`[syncAllVisitorsToPostgres] Error syncing visitor ${visitorId}:`, error);
        continue;
      }
    }

    return synced;
  } catch (error) {
    console.error('[syncAllVisitorsToPostgres] Error:', error);
    return 0;
  }
}

/**
 * עדכון analytics_daily מסיכום visitor_sessions
 */
export async function updateDailyAnalytics(date: Date = new Date()): Promise<void> {
  try {
    const targetDate = date.toISOString().split('T')[0];
    
    await query(
      `SELECT update_analytics_daily_from_visitors($1)`,
      [targetDate]
    );
  } catch (error) {
    console.error('[updateDailyAnalytics] Error:', error);
  }
}

