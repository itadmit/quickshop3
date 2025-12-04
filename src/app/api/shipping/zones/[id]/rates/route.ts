import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { ShippingRate, CreateShippingRateRequest } from '@/types/payment';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';
// Initialize event listeners
import '@/lib/events/listeners';

// POST /api/shipping/zones/:id/rates - Create shipping rate
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const zoneId = parseInt(id);
    const body: CreateShippingRateRequest = await request.json();

    // Verify zone exists and belongs to store
    const zone = await queryOne(
      'SELECT id FROM shipping_zones WHERE id = $1 AND store_id = $2',
      [zoneId, user.store_id]
    );

    if (!zone) {
      return NextResponse.json({ error: 'Shipping zone not found' }, { status: 404 });
    }

    const rate = await queryOne<ShippingRate>(
      `INSERT INTO shipping_rates (
        shipping_zone_id, name, price, min_order_subtotal, max_order_subtotal,
        min_weight, max_weight, free_shipping_threshold,
        delivery_days_min, delivery_days_max, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), now())
      RETURNING *`,
      [
        zoneId,
        body.name,
        body.price,
        body.min_order_subtotal || null,
        body.max_order_subtotal || null,
        body.min_weight || null,
        body.max_weight || null,
        body.free_shipping_threshold || null,
        body.delivery_days_min || null,
        body.delivery_days_max || null,
      ]
    );

    if (!rate) {
      throw new Error('Failed to create shipping rate');
    }

    // Emit event
    await eventBus.emitEvent('shipping.rate.created', {
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

    return NextResponse.json({ rate }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating shipping rate:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create shipping rate' },
      { status: 500 }
    );
  }
}

