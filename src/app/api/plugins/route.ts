// API Routes for Plugins Management

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { getAllPlugins, getPluginBySlug } from '@/lib/plugins/registry';
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
    const installedPlugins = await query<Plugin>(
      `SELECT * FROM plugins 
       WHERE store_id = $1 OR store_id IS NULL`,
      [storeId]
    );

    // הוספת מידע על התקנה ופעילות
    const pluginsWithStatus = plugins.map(pluginDef => {
      const installed = installedPlugins.find(p => p.slug === pluginDef.slug);
      
      return {
        ...pluginDef,
        is_installed: installed?.is_installed || false,
        is_active: installed?.is_active || false,
        config: installed?.config || pluginDef.defaultConfig,
        installed_at: installed?.installed_at || null,
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

    // בדיקה אם התוסף כבר מותקן
    const existing = await queryOne<{ id: number }>(
      `SELECT id FROM plugins 
       WHERE slug = $1 AND store_id = $2`,
      [pluginSlug, storeId]
    );

    if (existing) {
      return NextResponse.json(
        { error: 'Plugin already installed' },
        { status: 400 }
      );
    }

    // יצירת התוסף במסד הנתונים
    const plugin = await queryOne<Plugin>(
      `INSERT INTO plugins (
        store_id, name, slug, description, icon, version, author,
        type, category, is_built_in, is_free, price, currency,
        script_url, script_content, inject_location,
        config_schema, config, metadata, display_order,
        is_installed, is_active, installed_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18::jsonb, $19::jsonb, $20,
        true, true, now()
      ) RETURNING *`,
      [
        storeId,
        pluginDef.name,
        pluginDef.slug,
        pluginDef.description,
        pluginDef.icon || null,
        pluginDef.version,
        pluginDef.author || null,
        pluginDef.type,
        pluginDef.category,
        pluginDef.is_built_in,
        pluginDef.is_free,
        pluginDef.price || null,
        pluginDef.currency || 'ILS',
        pluginDef.script_url || null,
        pluginDef.script_content || null,
        pluginDef.inject_location || null,
        pluginDef.config_schema || null,
        JSON.stringify(pluginDef.defaultConfig),
        JSON.stringify(pluginDef.metadata || {}),
        pluginDef.display_order || 0,
      ]
    );

    return NextResponse.json({
      success: true,
      plugin,
    });
  } catch (error: any) {
    console.error('Error installing plugin:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to install plugin' },
      { status: 500 }
    );
  }
}



