// API Routes for Specific Plugin

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { Plugin } from '@/types/plugin';
import { getPluginConfig, updatePluginConfig } from '@/lib/plugins/loader';
import { cancelPluginSubscription } from '@/lib/plugins/billing';

/**
 * GET /api/plugins/[slug] - פרטי תוסף
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const storeId = user.store_id;

    const plugin = await queryOne<Plugin>(
      `SELECT * FROM plugins 
       WHERE slug = $1 AND (store_id = $2 OR store_id IS NULL)`,
      [slug, storeId]
    );

    if (!plugin) {
      return NextResponse.json(
        { error: 'Plugin not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ plugin });
  } catch (error: any) {
    console.error('Error fetching plugin:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch plugin' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/plugins/[slug] - עדכון הגדרות תוסף
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const storeId = user.store_id;
    const body = await request.json();
    const { config } = body;

    if (!config) {
      return NextResponse.json(
        { error: 'config is required' },
        { status: 400 }
      );
    }

    const success = await updatePluginConfig(storeId, slug, config);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update plugin config' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating plugin:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update plugin' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/plugins/[slug] - הסרת/ביטול תוסף
 * 
 * לתוספים בתשלום: מבטל רק את המנוי של התוסף הספציפי הזה
 * התוסף ימשיך לעבוד עד סוף התקופה ששולמה
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const storeId = user.store_id;

    // בדיקה אם התוסף קיים ומותקן
    const plugin = await queryOne<{ 
      id: number;
      is_built_in: boolean; 
      is_deletable: boolean;
      is_free: boolean;
    }>(
      `SELECT id, is_built_in, is_deletable, is_free FROM plugins 
       WHERE slug = $1 AND store_id = $2`,
      [slug, storeId]
    );

    if (!plugin) {
      return NextResponse.json(
        { error: 'Plugin not found' },
        { status: 404 }
      );
    }

    // בדיקה אם יש מנוי פעיל לתוסף הזה
    const subscription = await queryOne<{ id: number; status: string; end_date: Date }>(
      `SELECT id, status, end_date FROM plugin_subscriptions 
       WHERE store_id = $1 AND plugin_id = $2`,
      [storeId, plugin.id]
    );

    // אם זה תוסף בתשלום עם מנוי פעיל - מבטלים את המנוי
    if (subscription && subscription.status === 'ACTIVE') {
      const cancelResult = await cancelPluginSubscription(storeId, slug);
      
      if (!cancelResult.success) {
        return NextResponse.json(
          { error: cancelResult.error || 'Failed to cancel subscription' },
          { status: 400 }
        );
      }

      // התוסף ימשיך לעבוד עד סוף התקופה ששולמה
      return NextResponse.json({ 
        success: true,
        message: 'המנוי בוטל. התוסף יישאר פעיל עד סוף התקופה ששולמה',
        endDate: cancelResult.endDate,
      });
    }

    // אם זה תוסף חינמי או שאין מנוי - פשוט מכבים
    await query(
      `UPDATE plugins 
       SET is_active = false, is_installed = false, updated_at = now()
       WHERE slug = $1 AND store_id = $2`,
      [slug, storeId]
    );

    // אם יש מנוי שכבר בוטל - רק מכבים
    if (subscription && subscription.status === 'CANCELLED') {
      await query(
        `UPDATE plugin_subscriptions 
         SET is_active = false, updated_at = now()
         WHERE id = $1`,
        [subscription.id]
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'התוסף הוסר בהצלחה',
    });
  } catch (error: any) {
    console.error('Error deleting plugin:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete plugin' },
      { status: 500 }
    );
  }
}



