// API Route for Active Plugins

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { loadActivePlugins } from '@/lib/plugins/loader';

/**
 * GET /api/plugins/active - רשימת תוספים פעילים לחנות
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;
    const plugins = await loadActivePlugins(storeId);

    return NextResponse.json({
      plugins,
      total: plugins.length,
    });
  } catch (error: any) {
    console.error('Error fetching active plugins:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch active plugins' },
      { status: 500 }
    );
  }
}

