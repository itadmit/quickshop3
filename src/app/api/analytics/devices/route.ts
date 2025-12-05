import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getActiveVisitors } from '@/lib/session-tracker';
import { query } from '@/lib/db';

/**
 * GET /api/analytics/devices
 * מחזיר התפלגות devices, browsers, OS
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

    // איסוף נתונים
    const devices: Record<string, number> = {};
    const browsers: Record<string, number> = {};
    const os: Record<string, number> = {};

    visitors.forEach((v) => {
      if (v.device_type) {
        devices[v.device_type] = (devices[v.device_type] || 0) + 1;
      }
      if (v.browser) {
        browsers[v.browser] = (browsers[v.browser] || 0) + 1;
      }
      if (v.os) {
        os[v.os] = (os[v.os] || 0) + 1;
      }
    });

    return NextResponse.json({
      devices: Object.entries(devices).map(([type, count]) => ({
        type,
        count,
        percentage: ((count / visitors.length) * 100).toFixed(1),
      })),
      browsers: Object.entries(browsers)
        .map(([name, count]) => ({
          name,
          count,
          percentage: ((count / visitors.length) * 100).toFixed(1),
        }))
        .sort((a, b) => b.count - a.count),
      os: Object.entries(os)
        .map(([name, count]) => ({
          name,
          count,
          percentage: ((count / visitors.length) * 100).toFixed(1),
        }))
        .sort((a, b) => b.count - a.count),
      total: visitors.length,
    });
  } catch (error: any) {
    console.error('Error fetching device data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch device data' },
      { status: 500 }
    );
  }
}

