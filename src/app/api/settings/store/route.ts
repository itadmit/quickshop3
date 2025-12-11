import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

interface Store {
  id: number;
  owner_id: number;
  name: string;
  slug: string;
  domain: string | null;
  myshopify_domain: string | null;
  currency: string;
  locale: string;
  timezone: string;
  plan: string;
  is_active: boolean;
  settings: any;
  created_at: Date;
  updated_at: Date;
}

// GET /api/settings/store - Get store settings
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to get settings from store_settings table first
    let storeSettings = null;
    try {
      const settingsResult = await queryOne<{ settings: any }>(
        'SELECT settings FROM store_settings WHERE store_id = $1',
        [user.store_id]
      );
      if (settingsResult) {
        storeSettings = typeof settingsResult.settings === 'string' 
          ? JSON.parse(settingsResult.settings) 
          : settingsResult.settings;
      }
    } catch (error: any) {
      // If store_settings table doesn't exist, continue without it
      if (!error.message?.includes('does not exist')) {
        console.warn('Error fetching store_settings:', error);
      }
    }

    const store = await queryOne<Store>(
      'SELECT * FROM stores WHERE id = $1',
      [user.store_id]
    );

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Merge settings from store_settings if exists
    if (storeSettings) {
      store.settings = storeSettings;
    } else {
      store.settings = {};
    }

    return NextResponse.json({ store });
  } catch (error: any) {
    console.error('Error fetching store settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch store settings' },
      { status: 500 }
    );
  }
}

// PUT /api/settings/store - Update store settings
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (body.name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(body.name);
      paramIndex++;
    }

    if (body.domain !== undefined) {
      updates.push(`domain = $${paramIndex}`);
      values.push(body.domain);
      paramIndex++;
    }

    if (body.currency !== undefined) {
      updates.push(`currency = $${paramIndex}`);
      values.push(body.currency);
      paramIndex++;
    }

    if (body.locale !== undefined) {
      updates.push(`locale = $${paramIndex}`);
      values.push(body.locale);
      paramIndex++;
    }

    if (body.timezone !== undefined) {
      updates.push(`timezone = $${paramIndex}`);
      values.push(body.timezone);
      paramIndex++;
    }

    // Handle themeSettings (email colors, sender name, etc.)
    if (body.themeSettings !== undefined || body.giftCardSettings !== undefined) {
      // Try to update store_settings table
      try {
        // Check if store_settings table exists
        const tableExists = await queryOne<{ count: number }>(
          `SELECT COUNT(*) as count 
           FROM information_schema.tables 
           WHERE table_schema = 'public' AND table_name = 'store_settings'`
        );

        if (tableExists && tableExists.count > 0) {
          // Get existing settings
          const existing = await queryOne<{ settings: any }>(
            'SELECT settings FROM store_settings WHERE store_id = $1',
            [user.store_id]
          );

          const existingSettings = existing 
            ? (typeof existing.settings === 'string' ? JSON.parse(existing.settings) : existing.settings)
            : {};

          // Merge themeSettings
          const mergedSettings: any = {
            ...existingSettings,
          };

          if (body.themeSettings !== undefined) {
            mergedSettings.themeSettings = {
              ...(existingSettings.themeSettings || {}),
              ...body.themeSettings,
            };
          }

          // Merge giftCardSettings
          if (body.giftCardSettings !== undefined) {
            mergedSettings.giftCardSettings = {
              ...(existingSettings.giftCardSettings || {}),
              ...body.giftCardSettings,
            };
          }

          // Update or insert
          await query(
            `INSERT INTO store_settings (store_id, settings, updated_at)
             VALUES ($1, $2, now())
             ON CONFLICT (store_id) 
             DO UPDATE SET settings = $2, updated_at = now()`,
            [user.store_id, JSON.stringify(mergedSettings)]
          );
        }
      } catch (error: any) {
        // If store_settings table doesn't exist, silently ignore
        if (!error.message?.includes('does not exist')) {
          console.warn('Error updating store_settings:', error);
        }
      }
    }

    if (updates.length === 0 && body.themeSettings === undefined && body.giftCardSettings === undefined) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    let updatedStore: Store | null = null;

    if (updates.length > 0) {
      updates.push(`updated_at = now()`);
      values.push(user.store_id);

      const sql = `
        UPDATE stores 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      updatedStore = await queryOne<Store>(sql, values);
    } else {
      // If only themeSettings was updated, fetch the store
      updatedStore = await queryOne<Store>(
        'SELECT * FROM stores WHERE id = $1',
        [user.store_id]
      );
    }

    if (!updatedStore) {
      return NextResponse.json({ error: 'Failed to update store settings' }, { status: 500 });
    }

    // Load settings from store_settings if exists
    try {
      const settingsResult = await queryOne<{ settings: any }>(
        'SELECT settings FROM store_settings WHERE store_id = $1',
        [user.store_id]
      );
      if (settingsResult) {
        updatedStore.settings = typeof settingsResult.settings === 'string' 
          ? JSON.parse(settingsResult.settings) 
          : settingsResult.settings;
      } else {
        updatedStore.settings = {};
      }
    } catch (error: any) {
      if (!error.message?.includes('does not exist')) {
        console.warn('Error fetching store_settings:', error);
      }
      updatedStore.settings = {};
    }

    return NextResponse.json({ store: updatedStore });
  } catch (error: any) {
    console.error('Error updating store settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update store settings' },
      { status: 500 }
    );
  }
}

