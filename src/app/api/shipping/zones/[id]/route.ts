import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { ShippingZone, ShippingRate } from '@/types/payment';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/shipping/zones/:id - Get zone details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const zoneId = parseInt(id);
    const zone = await queryOne<ShippingZone>(
      'SELECT * FROM shipping_zones WHERE id = $1 AND store_id = $2',
      [zoneId, user.store_id]
    );

    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }

    const rates = await query<ShippingRate>(
      `SELECT 
        id, shipping_zone_id, name, price, 
        min_order_subtotal, max_order_subtotal,
        min_weight, max_weight, free_shipping_threshold,
        min_shipping_amount, is_pickup,
        delivery_days_min, delivery_days_max, carrier_service_id,
        created_at, updated_at
       FROM shipping_rates 
       WHERE shipping_zone_id = $1 
       ORDER BY created_at DESC`,
      [zoneId]
    );

    // Load cities for each rate
    const ratesWithCities = await Promise.all(
      rates.map(async (rate) => {
        const cities = await query<{ id: number; shipping_rate_id: number; city_name: string; price: string; free_shipping_threshold: string | null }>(
          `SELECT id, shipping_rate_id, city_name, price, free_shipping_threshold 
           FROM shipping_rate_cities 
           WHERE shipping_rate_id = $1 
           ORDER BY city_name`,
          [rate.id]
        );
        return {
          ...rate,
          cities: cities.map(c => ({
            id: c.id,
            shipping_rate_id: c.shipping_rate_id,
            city_name: c.city_name,
            price: c.price,
            free_shipping_threshold: c.free_shipping_threshold,
            created_at: new Date(),
            updated_at: new Date(),
          })),
        };
      })
    );

    return NextResponse.json({
      zone: {
        ...zone,
        rates: ratesWithCities,
      },
    });
  } catch (error: any) {
    console.error('Error fetching zone:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch zone' },
      { status: 500 }
    );
  }
}

// PUT /api/shipping/zones/:id - Update zone
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const zoneId = parseInt(id);
    const body = await request.json();
    const { name, countries, provinces } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    const zone = await queryOne<ShippingZone>(
      `UPDATE shipping_zones 
       SET name = $1, countries = $2, provinces = $3, updated_at = now()
       WHERE id = $4 AND store_id = $5
       RETURNING *`,
      [name, countries || [], provinces || [], zoneId, user.store_id]
    );

    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }

    // Emit event
    await eventBus.emitEvent('shipping.zone.updated', {
      zone: {
        id: zone.id,
        name: zone.name,
        countries: zone.countries,
      },
    }, {
      store_id: user.store_id,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ zone });
  } catch (error: any) {
    console.error('Error updating zone:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update zone' },
      { status: 500 }
    );
  }
}

// DELETE /api/shipping/zones/:id - Delete zone
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
  ) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const zoneId = parseInt(id);

    // Get zone before deletion for event
    const zone = await queryOne<ShippingZone>(
      'SELECT * FROM shipping_zones WHERE id = $1 AND store_id = $2',
      [zoneId, user.store_id]
    );

    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }

    await query(
      'DELETE FROM shipping_zones WHERE id = $1 AND store_id = $2',
      [zoneId, user.store_id]
    );

    // Emit event
    await eventBus.emitEvent('shipping.zone.deleted', {
      zone_id: zoneId,
    }, {
      store_id: user.store_id,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting zone:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete zone' },
      { status: 500 }
    );
  }
}

