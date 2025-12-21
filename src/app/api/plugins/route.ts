// API Routes for Plugins Management

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { getAllPlugins, getPluginBySlug } from '@/lib/plugins/registry';
import { subscribeToPlugin } from '@/lib/plugins/billing';
import { Plugin } from '@/types/plugin';

/**
 * GET /api/plugins - רשימת כל התוספים הזמינים
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const isFree = searchParams.get('is_free');

    // קבלת כל התוספים המובנים
    let plugins = getAllPlugins();

    // סינון לפי קטגוריה
    if (category) {
      plugins = plugins.filter(p => p.category === category);
    }

    // סינון לפי סוג
    if (type) {
      plugins = plugins.filter(p => p.type === type);
    }

    // סינון לפי חינמי/תשלום
    if (isFree !== null) {
      plugins = plugins.filter(p => p.is_free === (isFree === 'true'));
    }

    // בדיקה אילו תוספים מותקנים ופעילים לחנות זו
    const installedPlugins = await query<Plugin & { plugin_id: number }>(
      `SELECT * FROM plugins 
       WHERE store_id = $1 OR store_id IS NULL`,
      [storeId]
    );

    // קבלת מנויים לתוספים
    const subscriptions = await query<{
      plugin_id: number;
      status: string;
      end_date: Date | null;
      next_billing_date: Date | null;
      is_active: boolean;
    }>(
      `SELECT plugin_id, status, end_date, next_billing_date, is_active
       FROM plugin_subscriptions
       WHERE store_id = $1`,
      [storeId]
    );

    // הוספת מידע על התקנה, פעילות ומנוי
    const pluginsWithStatus = plugins.map(pluginDef => {
      const installed = installedPlugins.find(p => p.slug === pluginDef.slug);
      const subscription = installed ? subscriptions.find(s => s.plugin_id === installed.id) : null;
      
      return {
        ...pluginDef,
        is_installed: installed?.is_installed || false,
        is_active: installed?.is_active || false,
        config: installed?.config || pluginDef.defaultConfig,
        installed_at: installed?.installed_at || null,
        subscription: subscription ? {
          status: subscription.status,
          end_date: subscription.end_date,
          next_billing_date: subscription.next_billing_date,
        } : null,
      };
    });

    return NextResponse.json({
      plugins: pluginsWithStatus,
      total: pluginsWithStatus.length,
    });
  } catch (error: any) {
    console.error('Error fetching plugins:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch plugins' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/plugins - התקנת תוסף חדש
 * 
 * לתוספים חינמיים: התקנה ישירה
 * לתוספים בתשלום: חיוב מהטוקן הקיים והתקנה
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;
    const body = await request.json();
    const { pluginSlug } = body;

    if (!pluginSlug) {
      return NextResponse.json(
        { error: 'pluginSlug is required' },
        { status: 400 }
      );
    }

    // בדיקה אם התוסף קיים ב-registry
    const pluginDef = getPluginBySlug(pluginSlug);
    if (!pluginDef) {
      return NextResponse.json(
        { error: 'Plugin not found' },
        { status: 404 }
      );
    }

    // שימוש בפונקציה המאוחדת שמטפלת גם בתוספים חינמיים וגם בתשלום
    const result = await subscribeToPlugin(storeId, pluginSlug);

    if (!result.success) {
      // קודי שגיאה ספציפיים
      const statusCode = result.errorCode === 'NO_TOKEN' || result.errorCode === 'NOT_PAYING' 
        ? 402 // Payment Required 
        : result.errorCode === 'ALREADY_SUBSCRIBED' 
        ? 409 // Conflict
        : 400;
      
      return NextResponse.json(
        { 
          error: result.error, 
          errorCode: result.errorCode,
        },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      subscriptionId: result.subscriptionId,
    });
  } catch (error: any) {
    console.error('Error installing plugin:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to install plugin' },
      { status: 500 }
    );
  }
}



