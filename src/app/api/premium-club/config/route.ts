import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/premium-club/config - Get premium club configuration
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = user.store_id;

    // Get or create default config
    let config = await queryOne<{
      id: number;
      store_id: number;
      enabled: boolean;
      config: any;
    }>(
      `SELECT id, store_id, enabled, config
       FROM premium_club_config
       WHERE store_id = $1`,
      [storeId]
    );

    if (!config) {
      // Create default config with default tiers
      const defaultConfig = {
        enabled: false,
        tiers: [
          {
            slug: 'silver',
            name: 'כסף',
            color: '#C0C0C0',
            priority: 3,
            minSpent: 500,
            minOrders: 3,
            discount: {
              type: 'PERCENTAGE',
              value: 5,
            },
            benefits: {
              freeShipping: false,
              earlyAccess: false,
              exclusiveProducts: false,
              birthdayGift: true,
              pointsMultiplier: 1.2,
            },
          },
          {
            slug: 'gold',
            name: 'זהב',
            color: '#FFD700',
            priority: 2,
            minSpent: 2000,
            minOrders: 10,
            discount: {
              type: 'PERCENTAGE',
              value: 10,
            },
            benefits: {
              freeShipping: true,
              earlyAccess: true,
              exclusiveProducts: false,
              birthdayGift: true,
              pointsMultiplier: 1.5,
            },
          },
          {
            slug: 'platinum',
            name: 'פלטינה',
            color: '#E5E4E2',
            priority: 1,
            minSpent: 5000,
            minOrders: 25,
            discount: {
              type: 'PERCENTAGE',
              value: 15,
            },
            benefits: {
              freeShipping: true,
              earlyAccess: true,
              exclusiveProducts: true,
              birthdayGift: true,
              pointsMultiplier: 2,
            },
          },
        ],
        benefits: {
          freeShippingThreshold: null,
          birthdayDiscount: {
            enabled: false,
            value: 20,
            type: 'PERCENTAGE',
          },
          earlyAccessToSales: false,
          exclusiveProductsAccess: false,
          vipSupport: false,
          monthlyGift: false,
        },
        notifications: {
          tierUpgradeEmail: true,
          tierUpgradeSMS: false,
        },
      };

      const newConfig = await queryOne<{
        id: number;
        store_id: number;
        enabled: boolean;
        config: any;
      }>(
        `INSERT INTO premium_club_config (store_id, enabled, config)
         VALUES ($1, $2, $3::jsonb)
         RETURNING id, store_id, enabled, config`,
        [storeId, false, JSON.stringify(defaultConfig)]
      );

      config = newConfig!;
    }

    return NextResponse.json({
      config: config.config || {},
      enabled: config.enabled,
    });
  } catch (error: any) {
    console.error('Error fetching premium club config:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch premium club config' },
      { status: 500 }
    );
  }
}

// PUT /api/premium-club/config - Update premium club configuration
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { config, enabled } = body;
    const storeId = user.store_id;

    if (!config) {
      return NextResponse.json(
        { error: 'config is required' },
        { status: 400 }
      );
    }

    // Update or insert config
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM premium_club_config WHERE store_id = $1',
      [storeId]
    );

    if (existing) {
      await query(
        `UPDATE premium_club_config
         SET config = $1::jsonb, enabled = $2, updated_at = now()
         WHERE store_id = $3`,
        [JSON.stringify(config), enabled ?? false, storeId]
      );
    } else {
      await query(
        `INSERT INTO premium_club_config (store_id, enabled, config)
         VALUES ($1, $2, $3::jsonb)`,
        [storeId, enabled ?? false, JSON.stringify(config)]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating premium club config:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update premium club config' },
      { status: 500 }
    );
  }
}

