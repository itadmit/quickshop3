import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getRedis } from '@/lib/session-tracker';
import { query } from '@/lib/db';

/**
 * GET /api/analytics/popular-pages
 * מחזיר רשימת עמודים פופולריים (Sorted Set ב-Redis)
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

    if (!storeSlug) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const redisClient = getRedis();
    if (!redisClient) {
      return NextResponse.json({ pages: [], total: 0 });
    }

    const pageKey = `store:${storeSlug}:popular_pages`;
    
    // קבלת Top 20 עמודים פופולריים
    const pages = await redisClient.zrevrange(pageKey, 0, 19, { withScores: true });

    const popularPages = [];
    if (Array.isArray(pages)) {
      for (let i = 0; i < pages.length; i += 2) {
        const page = pages[i] as string;
        const views = pages[i + 1] as number;
        if (page && views !== undefined) {
          popularPages.push({
            page,
            views: Math.floor(views),
          });
        }
      }
    }

    return NextResponse.json({
      pages: popularPages,
      total: popularPages.length,
    });
  } catch (error: any) {
    console.error('Error fetching popular pages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch popular pages' },
      { status: 500 }
    );
  }
}

