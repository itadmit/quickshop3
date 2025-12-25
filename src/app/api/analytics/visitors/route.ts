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

    // בתהליך תשלום - מי שהגיע לעמוד checkout אבל לא השלים רכישה
    // מקור 1: visitor_sessions עם reached_checkout = true ו-completed_purchase = false
    const checkingOutSessions = await query<{ count: string }>(
      `SELECT COUNT(DISTINCT visitor_id) as count
       FROM visitor_sessions
       WHERE store_id = $1
       AND reached_checkout = true
       AND session_started_at > NOW() - INTERVAL '10 minutes'
       AND completed_purchase = false`,
      [user.store_id]
    );
    
    // מקור 2: analytics_events עם InitiateCheckout ב-10 דקות (מינוס מי שכבר קנה)
    const checkingOutEvents = await query<{ count: string }>(
      `SELECT COUNT(DISTINCT COALESCE(
          metadata->>'visitor_id', 
          metadata->>'order_id',
          (metadata->>'timestamp')::text
        )) as count
       FROM analytics_events ae
       WHERE ae.store_id = $1
       AND ae.event_type IN ('InitiateCheckout', 'BeginCheckout')
       AND ae.created_at > NOW() - INTERVAL '10 minutes'
       AND NOT EXISTS (
         SELECT 1 FROM analytics_events pe 
         WHERE pe.store_id = ae.store_id 
         AND pe.event_type = 'Purchase'
         AND pe.created_at > NOW() - INTERVAL '10 minutes'
         AND COALESCE(pe.metadata->>'visitor_id', pe.metadata->>'order_id') = 
             COALESCE(ae.metadata->>'visitor_id', ae.metadata->>'order_id')
       )`,
      [user.store_id]
    );
    
    // ניקח את המקסימום בין השניים
    const checking_out = Math.max(
      parseInt(checkingOutSessions[0]?.count || '0'),
      parseInt(checkingOutEvents[0]?.count || '0')
    );

    // רכישות שהושלמו - מי שהגיע לדף תודה (Purchase event)
    // מקור 1: visitor_sessions עם completed_purchase = true
    const purchasedSessions = await query<{ count: string }>(
      `SELECT COUNT(DISTINCT visitor_id) as count
       FROM visitor_sessions
       WHERE store_id = $1
       AND completed_purchase = true
       AND session_started_at > NOW() - INTERVAL '10 minutes'`,
      [user.store_id]
    );
    
    // מקור 2: analytics_events עם Purchase
    const purchasedEvents = await query<{ count: string }>(
      `SELECT COUNT(DISTINCT COALESCE(
          metadata->>'order_id',
          metadata->>'visitor_id',
          (metadata->>'timestamp')::text
        )) as count
       FROM analytics_events
       WHERE store_id = $1
       AND event_type IN ('Purchase', 'CompletePayment')
       AND created_at > NOW() - INTERVAL '10 minutes'`,
      [user.store_id]
    );
    
    // מקור 3: הזמנות שנוצרו ושולמו ב-10 דקות האחרונות
    const purchasedOrders = await query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM orders
       WHERE store_id = $1
       AND financial_status = 'paid'
       AND created_at > NOW() - INTERVAL '10 minutes'`,
      [user.store_id]
    );
    
    // ניקח את המקסימום בין כל המקורות
    const purchased = Math.max(
      parseInt(purchasedSessions[0]?.count || '0'),
      parseInt(purchasedEvents[0]?.count || '0'),
      parseInt(purchasedOrders[0]?.count || '0')
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

