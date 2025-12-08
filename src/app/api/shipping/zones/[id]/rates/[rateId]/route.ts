import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { ShippingRate, CreateShippingRateRequest } from '@/types/payment';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';
// Initialize event listeners
import '@/lib/events/listeners';

// PUT /api/shipping/zones/:id/rates/:rateId - Update shipping rate
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; rateId: string }> }
) {
  try {
    const { id, rateId } = await params;
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const zoneId = parseInt(id);
    const rateIdNum = parseInt(rateId);
    const body: CreateShippingRateRequest = await request.json();

    // Verify zone exists and belongs to store
    const zone = await queryOne(
      'SELECT id FROM shipping_zones WHERE id = $1 AND store_id = $2',
      [zoneId, user.store_id]
    );

    if (!zone) {
      return NextResponse.json({ error: 'Shipping zone not found' }, { status: 404 });
    }

    // Verify rate exists and belongs to zone
    const existingRate = await queryOne(
      'SELECT id FROM shipping_rates WHERE id = $1 AND shipping_zone_id = $2',
      [rateIdNum, zoneId]
    );

    if (!existingRate) {
      return NextResponse.json({ error: 'Shipping rate not found' }, { status: 404 });
    }

    const rate = await queryOne<ShippingRate>(
      `UPDATE shipping_rates SET
        name = $1, price = $2, min_order_subtotal = $3, max_order_subtotal = $4,
        min_weight = $5, max_weight = $6, free_shipping_threshold = $7,
        min_shipping_amount = $8, is_pickup = $9,
        delivery_days_min = $10, delivery_days_max = $11, updated_at = now()
      WHERE id = $12 AND shipping_zone_id = $13
      RETURNING *`,
      [
        body.name,
        body.price || '0',
        body.min_order_subtotal || null,
        body.max_order_subtotal || null,
        body.min_weight || null,
        body.max_weight || null,
        body.free_shipping_threshold || null,
        body.min_shipping_amount || null,
        body.is_pickup || false,
        body.delivery_days_min || null,
        body.delivery_days_max || null,
        rateIdNum,
        zoneId,
      ]
    );

    if (!rate) {
      throw new Error('Failed to update shipping rate');
    }

    // Update cities if provided
    if (body.cities !== undefined) {
      // Delete existing cities
      await query(
        'DELETE FROM shipping_rate_cities WHERE shipping_rate_id = $1',
        [rateIdNum]
      );

      // Insert new cities
      if (body.cities.length > 0) {
        for (const city of body.cities) {
          await query(
            `INSERT INTO shipping_rate_cities (
              shipping_rate_id, city_name, price, free_shipping_threshold, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, now(), now())`,
            [
              rateIdNum,
              city.city_name,
              city.price,
              city.free_shipping_threshold || null,
            ]
          );
        }
      }
    }

    // Emit event
    await eventBus.emitEvent('shipping.rate.updated', {
      rate: {
        id: rate.id,
        name: rate.name,
        price: rate.price,
      },
    }, {
      store_id: user.store_id,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ rate });
  } catch (error: any) {
    console.error('Error updating shipping rate:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update shipping rate' },
      { status: 500 }
    );
  }
}

// DELETE /api/shipping/zones/:id/rates/:rateId - Delete shipping rate
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; rateId: string }> }
) {
  try {
    const { id, rateId } = await params;
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const zoneId = parseInt(id);
    const rateIdNum = parseInt(rateId);

    // Verify zone exists and belongs to store
    const zone = await queryOne(
      'SELECT id FROM shipping_zones WHERE id = $1 AND store_id = $2',
      [zoneId, user.store_id]
    );

    if (!zone) {
      return NextResponse.json({ error: 'Shipping zone not found' }, { status: 404 });
    }

    // Verify rate exists and belongs to zone
    const existingRate = await queryOne(
      'SELECT id FROM shipping_rates WHERE id = $1 AND shipping_zone_id = $2',
      [rateIdNum, zoneId]
    );

    if (!existingRate) {
      return NextResponse.json({ error: 'Shipping rate not found' }, { status: 404 });
    }

    // Delete rate (cascade will delete cities)
    await query(
      'DELETE FROM shipping_rates WHERE id = $1 AND shipping_zone_id = $2',
      [rateIdNum, zoneId]
    );

    // Emit event
    await eventBus.emitEvent('shipping.rate.deleted', {
      rate_id: rateIdNum,
    }, {
      store_id: user.store_id,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting shipping rate:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete shipping rate' },
      { status: 500 }
    );
  }
}

