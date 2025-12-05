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

    // חישוב נתוני התנהגות (Funnel)
    const behavior = {
      active_carts: 0,
      checking_out: 0,
      purchased: 0,
    };

    visitors.forEach((v) => {
      const currentPage = v.current_page || '';
      
      // עגלות פעילות - מחפש /cart (עם או בלי /shops/[storeSlug])
      if (currentPage.includes('/cart') && !currentPage.includes('/checkout')) {
        behavior.active_carts++;
      } 
      // בתהליך תשלום - מחפש /checkout אבל לא /success
      else if (currentPage.includes('/checkout') && !currentPage.includes('/success')) {
        behavior.checking_out++;
      } 
      // רכישות שהושלמו - מחפש /checkout/success
      else if (currentPage.includes('/checkout/success')) {
        behavior.purchased++;
      }
    });

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

