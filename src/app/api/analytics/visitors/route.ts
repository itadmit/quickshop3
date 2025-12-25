import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getActiveVisitors } from '@/lib/session-tracker';
import { query } from '@/lib/db';

/**
 * GET /api/analytics/visitors
 * מחזיר רשימת מבקרים פעילים עם כל הנתונים (מיקום, device, וכו')
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // קבלת storeSlug
    const stores = await query<{ slug: string }>(
      'SELECT slug FROM stores WHERE id = $1',
      [user.store_id]
    );
    const storeSlug = stores && stores.length > 0 ? stores[0].slug : undefined;

    const visitors = await getActiveVisitors(undefined, storeSlug);

    // ✅ חישוב נתוני התנהגות (Funnel) ממקורות אמיתיים
    // עגלות פעילות - מ-visitor_carts שעודכנו ב-10 דקות האחרונות
    const activeCartsResult = await query<{ count: string }>(
      `SELECT COUNT(DISTINCT visitor_session_id) as count
       FROM visitor_carts
       WHERE store_id = $1
       AND updated_at > NOW() - INTERVAL '10 minutes'
       AND items::text != '[]'::text`,
      [user.store_id]
    );
    const active_carts = parseInt(activeCartsResult[0]?.count || '0');

    // בתהליך תשלום - מ-visitor_sessions עם reached_checkout = true ב-10 דקות האחרונות
    // או מ-analytics_events עם InitiateCheckout
    const checkingOutSessions = await query<{ count: string }>(
      `SELECT COUNT(DISTINCT visitor_id) as count
       FROM visitor_sessions
       WHERE store_id = $1
       AND reached_checkout = true
       AND session_started_at > NOW() - INTERVAL '10 minutes'
       AND completed_purchase = false`,
      [user.store_id]
    );
    
    const checkingOutEvents = await query<{ count: string }>(
      `SELECT COUNT(DISTINCT (metadata->>'visitor_id')::text) as count
       FROM analytics_events
       WHERE store_id = $1
       AND event_type IN ('InitiateCheckout', 'BeginCheckout')
       AND created_at > NOW() - INTERVAL '10 minutes'
       AND metadata->>'visitor_id' IS NOT NULL`,
      [user.store_id]
    );
    
    // ניקח את המקסימום בין השניים (יכול להיות שיש sessions בלי events או להיפך)
    const checking_out = Math.max(
      parseInt(checkingOutSessions[0]?.count || '0'),
      parseInt(checkingOutEvents[0]?.count || '0')
    );

    // רכישות שהושלמו - מ-visitor_sessions עם completed_purchase = true ב-10 דקות האחרונות
    // או מ-analytics_events עם Purchase
    const purchasedSessions = await query<{ count: string }>(
      `SELECT COUNT(DISTINCT visitor_id) as count
       FROM visitor_sessions
       WHERE store_id = $1
       AND completed_purchase = true
       AND session_started_at > NOW() - INTERVAL '10 minutes'`,
      [user.store_id]
    );
    
    const purchasedEvents = await query<{ count: string }>(
      `SELECT COUNT(DISTINCT (metadata->>'order_id')::text) as count
       FROM analytics_events
       WHERE store_id = $1
       AND event_type IN ('Purchase', 'CompletePayment')
       AND created_at > NOW() - INTERVAL '10 minutes'
       AND metadata->>'order_id' IS NOT NULL`,
      [user.store_id]
    );
    
    // ניקח את המקסימום בין השניים
    const purchased = Math.max(
      parseInt(purchasedSessions[0]?.count || '0'),
      parseInt(purchasedEvents[0]?.count || '0')
    );

    const behavior = {
      active_carts,
      checking_out,
      purchased,
    };

    return NextResponse.json({
      visitors: visitors.map((v) => ({
        visitor_id: v.visitor_id,
        first_seen: v.first_seen ? new Date(v.first_seen).toISOString() : null,
        last_activity: new Date(v.last_activity).toISOString(),
        session_duration: v.first_seen ? Math.floor((v.last_activity - v.first_seen) / 1000) : 0, // בשניות
        page_views: v.page_views || 1,
        current_page: v.current_page,
        // GeoIP
        location: v.city && v.country ? `${v.city}, ${v.country}` : v.country || 'Unknown',
        country: v.country,
        country_code: v.country_code,
        city: v.city,
        region: v.region,
        coordinates: v.lat && v.lon ? { lat: v.lat, lon: v.lon } : null,
        // Device
        device: v.device_type,
        browser: v.browser,
        os: v.os,
        // Referrer
        referrer: v.referrer || 'Direct',
        // UTM
        utm_source: v.utm_source,
        utm_medium: v.utm_medium,
        utm_campaign: v.utm_campaign,
      })),
      behavior,
      total: visitors.length,
    });
  } catch (error: any) {
    console.error('Error fetching visitors:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch visitors' },
      { status: 500 }
    );
  }
}

