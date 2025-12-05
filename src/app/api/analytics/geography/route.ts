import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getActiveVisitors } from '@/lib/session-tracker';
import { query } from '@/lib/db';

/**
 * GET /api/analytics/geography
 * מחזיר נתונים גיאוגרפיים למפה (ישראל/עולם)
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

    // איסוף נתונים גיאוגרפיים
    const countries: Record<string, number> = {};
    const cities: Record<string, number> = {};
    const coordinates: Array<{ lat: number; lon: number; count: number }> = [];

    visitors.forEach((v) => {
      if (v.country_code) {
        countries[v.country_code] = (countries[v.country_code] || 0) + 1;
      }
      if (v.city && v.country) {
        const cityKey = `${v.city}, ${v.country}`;
        cities[cityKey] = (cities[cityKey] || 0) + 1;
      }
      if (v.lat && v.lon) {
        // מציאת קואורדינטות דומות (עד 0.1 מעלה)
        const existing = coordinates.find(
          (c) => Math.abs(c.lat - v.lat!) < 0.1 && Math.abs(c.lon - v.lon!) < 0.1
        );
        if (existing) {
          existing.count++;
        } else {
          coordinates.push({ lat: v.lat, lon: v.lon!, count: 1 });
        }
      }
    });

    return NextResponse.json({
      countries: Object.entries(countries).map(([code, count]) => ({
        code,
        count,
      })),
      cities: Object.entries(cities)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 50), // Top 50 cities
      coordinates: coordinates.slice(0, 100), // Max 100 points for map
      total_visitors: visitors.length,
    });
  } catch (error: any) {
    console.error('Error fetching geography data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch geography data' },
      { status: 500 }
    );
  }
}

