// API Route for Active Plugins

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';
import { PluginSubscription, Plugin } from '@/types/plugin';

/**
 * GET /api/plugins/active - רשימת תוספים פעילים לחנות עם פרטי מנוי
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;

    // קבלת כל המנויים הפעילים עם פרטי התוספים
    const subscriptions = await query<PluginSubscription & { plugin_name: string; plugin_slug: string }>(
      `SELECT 
        ps.*,
        p.name as plugin_name,
        p.slug as plugin_slug
      FROM plugin_subscriptions ps
      JOIN plugins p ON p.id = ps.plugin_id
      WHERE ps.store_id = $1 
      AND ps.status = 'ACTIVE'
      AND ps.is_active = true
      ORDER BY ps.created_at DESC`,
      [storeId]
    );

    return NextResponse.json({
      plugins: subscriptions,
      total: subscriptions.length,
    });
  } catch (error: any) {
    console.error('Error fetching active plugins:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch active plugins' },
      { status: 500 }
    );
  }
}

