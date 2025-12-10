// API Routes for Specific Plugin

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { Plugin } from '@/types/plugin';
import { getPluginConfig, updatePluginConfig } from '@/lib/plugins/loader';

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
 * DELETE /api/plugins/[slug] - הסרת תוסף
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

    // בדיקה אם התוסף מובנה
    const plugin = await queryOne<{ is_built_in: boolean; is_deletable: boolean }>(
      `SELECT is_built_in, is_deletable FROM plugins 
       WHERE slug = $1 AND store_id = $2`,
      [slug, storeId]
    );

    if (!plugin) {
      return NextResponse.json(
        { error: 'Plugin not found' },
        { status: 404 }
      );
    }

    if (plugin.is_built_in && !plugin.is_deletable) {
      return NextResponse.json(
        { error: 'Cannot delete built-in plugin' },
        { status: 400 }
      );
    }

    // מחיקת התוסף
    await query(
      `DELETE FROM plugins WHERE slug = $1 AND store_id = $2`,
      [slug, storeId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting plugin:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete plugin' },
      { status: 500 }
    );
  }
}

