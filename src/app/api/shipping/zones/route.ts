import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { ShippingZone, ShippingZoneWithRates, ShippingRate, CreateShippingZoneRequest } from '@/types/payment';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/shipping/zones - List all shipping zones
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const zones = await query<ShippingZone>(
      'SELECT * FROM shipping_zones WHERE store_id = $1 ORDER BY created_at DESC',
      [user.store_id]
    );

    // Get rates for each zone
    const zonesWithRates: ShippingZoneWithRates[] = await Promise.all(
      zones.map(async (zone) => {
        const rates = await query<ShippingRate>(
          'SELECT * FROM shipping_rates WHERE shipping_zone_id = $1 ORDER BY created_at DESC',
          [zone.id]
        );
        return { ...zone, rates };
      })
    );

    return NextResponse.json({ zones: zonesWithRates });
  } catch (error: any) {
    console.error('Error fetching shipping zones:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch shipping zones' },
      { status: 500 }
    );
  }
}

// POST /api/shipping/zones - Create shipping zone
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateShippingZoneRequest = await request.json();
    const storeId = user.store_id;

    const zone = await queryOne<ShippingZone>(
      `INSERT INTO shipping_zones (
        store_id, name, countries, provinces, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, now(), now())
      RETURNING *`,
      [
        storeId,
        body.name,
        body.countries,
        body.provinces || [],
      ]
    );

    if (!zone) {
      throw new Error('Failed to create shipping zone');
    }

    // Emit event
    await eventBus.emitEvent('shipping.zone.created', {
      zone: {
        id: zone.id,
        name: zone.name,
        countries: zone.countries,
      },
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ zone }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating shipping zone:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create shipping zone' },
      { status: 500 }
    );
  }
}

