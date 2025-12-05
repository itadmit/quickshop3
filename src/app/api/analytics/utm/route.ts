import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getActiveVisitors } from '@/lib/session-tracker';
import { query } from '@/lib/db';

/**
 * GET /api/analytics/utm
 * מחזיר נתונים על מקורות תנועה (UTM)
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

    // איסוף נתוני UTM
    const sources: Record<string, number> = {};
    const mediums: Record<string, number> = {};
    const campaigns: Record<string, number> = {};
    const utmData: Array<{
      source: string;
      medium: string;
      campaign: string;
      count: number;
    }> = [];

    visitors.forEach((v) => {
      const source = v.utm_source || 'direct';
      const medium = v.utm_medium || 'none';
      const campaign = v.utm_campaign || 'none';

      sources[source] = (sources[source] || 0) + 1;
      mediums[medium] = (mediums[medium] || 0) + 1;
      campaigns[campaign] = (campaigns[campaign] || 0) + 1;

      // מציאת שילוב source+medium+campaign
      const existing = utmData.find(
        (u) => u.source === source && u.medium === medium && u.campaign === campaign
      );
      if (existing) {
        existing.count++;
      } else {
        utmData.push({ source, medium, campaign, count: 1 });
      }
    });

    return NextResponse.json({
      sources: Object.entries(sources)
        .map(([name, count]) => ({
          name,
          count,
          percentage: ((count / visitors.length) * 100).toFixed(1),
        }))
        .sort((a, b) => b.count - a.count),
      mediums: Object.entries(mediums)
        .map(([name, count]) => ({
          name,
          count,
          percentage: ((count / visitors.length) * 100).toFixed(1),
        }))
        .sort((a, b) => b.count - a.count),
      campaigns: Object.entries(campaigns)
        .map(([name, count]) => ({
          name,
          count,
          percentage: ((count / visitors.length) * 100).toFixed(1),
        }))
        .sort((a, b) => b.count - a.count),
      combinations: utmData.sort((a, b) => b.count - a.count).slice(0, 20),
      total: visitors.length,
    });
  } catch (error: any) {
    console.error('Error fetching UTM data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch UTM data' },
      { status: 500 }
    );
  }
}

