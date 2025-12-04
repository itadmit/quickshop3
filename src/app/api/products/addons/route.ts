import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/products/addons - Get all addons for a store
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    let sql = 'SELECT * FROM product_addons WHERE store_id = $1';
    const params: any[] = [storeId];

    if (search) {
      sql += ' AND name ILIKE $2';
      params.push(`%${search}%`);
    }

    sql += ' ORDER BY name ASC';

    const addons = await query(sql, params);

    // Get options for each addon
    const addonsWithOptions = await Promise.all(
      addons.map(async (addon: any) => {
        const options = await query(
          'SELECT * FROM product_addon_options WHERE addon_id = $1 ORDER BY position',
          [addon.id]
        );
        return {
          ...addon,
          options,
          settings: typeof addon.settings === 'string' ? JSON.parse(addon.settings) : addon.settings,
        };
      })
    );

    return NextResponse.json({ addons: addonsWithOptions });
  } catch (error: any) {
    console.error('Error fetching addons:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch addons' },
      { status: 500 }
    );
  }
}

// POST /api/products/addons - Create a new addon
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, addon_type, is_required, price_modifier, settings, options } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Addon name is required' }, { status: 400 });
    }

    if (!addon_type) {
      return NextResponse.json({ error: 'addon_type is required' }, { status: 400 });
    }

    const storeId = user.store_id;

    // Create addon
    const addon = await queryOne<{
      id: number;
      name: string;
      addon_type: string;
      settings: any;
    }>(
      `INSERT INTO product_addons (store_id, name, description, addon_type, is_required, price_modifier, settings, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())
       RETURNING id, name, addon_type, settings`,
      [
        storeId,
        name.trim(),
        description || null,
        addon_type,
        is_required || false,
        price_modifier || 0,
        settings ? JSON.stringify(settings) : null,
      ]
    );

    if (!addon) {
      throw new Error('Failed to create addon');
    }

    // Create options if provided
    if (options && Array.isArray(options) && options.length > 0) {
      for (const option of options) {
        await query(
          `INSERT INTO product_addon_options (addon_id, label, value, price_modifier, position, created_at)
           VALUES ($1, $2, $3, $4, $5, now())`,
          [
            addon.id,
            option.label,
            option.value || null,
            option.price_modifier || 0,
            option.position || 0,
          ]
        );
      }
    }

    // Get addon with options
    const addonOptions = await query(
      'SELECT * FROM product_addon_options WHERE addon_id = $1 ORDER BY position',
      [addon.id]
    );

    const parsedAddon = {
      ...addon,
      options: addonOptions,
      settings: typeof addon.settings === 'string' ? JSON.parse(addon.settings) : addon.settings,
    };

    // Emit event
    await eventBus.emitEvent('product.addon.created', {
      addon: {
        id: parsedAddon.id,
        name: parsedAddon.name,
        addon_type: parsedAddon.addon_type,
      },
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ addon: parsedAddon }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating addon:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create addon' },
      { status: 500 }
    );
  }
}

