import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { Shipment, StoreShippingIntegration } from '@/types/payment';
import { getShippingAdapter, registerAllShippingAdapters } from '@/lib/shipping';

// GET /api/shipments/track-public - Public tracking endpoint for customers
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');
    const trackingNumber = searchParams.get('trackingNumber');
    const storeSlug = searchParams.get('storeSlug');

    if (!storeSlug) {
      return NextResponse.json({ error: 'storeSlug is required' }, { status: 400 });
    }

    if (!orderId && !trackingNumber) {
      return NextResponse.json(
        { error: 'orderId or trackingNumber is required' },
        { status: 400 }
      );
    }

    // Get store
    const store = await queryOne<{ id: number }>(
      'SELECT id FROM stores WHERE slug = $1',
      [storeSlug]
    );

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Find shipment
    let shipment: Shipment | null = null;

    if (orderId) {
      shipment = await queryOne<Shipment>(
        `SELECT s.* FROM shipments s
         JOIN orders o ON s.order_id = o.id
         WHERE o.id = $1 AND s.store_id = $2 AND s.status != 'cancelled'
         ORDER BY s.created_at DESC LIMIT 1`,
        [orderId, store.id]
      );
    } else if (trackingNumber) {
      shipment = await queryOne<Shipment>(
        `SELECT * FROM shipments 
         WHERE tracking_number = $1 AND store_id = $2
         LIMIT 1`,
        [trackingNumber, store.id]
      );
    }

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    // Get basic tracking info
    const response: any = {
      shipment: {
        id: shipment.id,
        tracking_number: shipment.tracking_number,
        tracking_url: shipment.tracking_url,
        status: shipment.status,
        recipient_city: shipment.recipient_city,
        created_at: shipment.created_at,
        delivered_at: shipment.delivered_at,
      },
    };

    // Try to get live tracking if available
    if (shipment.external_shipment_id && shipment.integration_id) {
      const integration = await queryOne<StoreShippingIntegration>(
        'SELECT * FROM store_shipping_integrations WHERE id = $1',
        [shipment.integration_id]
      );

      if (integration) {
        try {
          registerAllShippingAdapters();
          const adapter = getShippingAdapter(integration.provider, integration);
          const trackResult = await adapter.trackShipment(shipment.external_shipment_id);

          if (trackResult.success) {
            response.tracking = {
              status: trackResult.status,
              statusText: trackResult.statusText,
              estimatedDelivery: trackResult.estimatedDelivery,
              events: trackResult.events || [],
            };
          }
        } catch (trackError) {
          console.warn('[TrackPublic] Tracking error:', trackError);
        }
      }
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error tracking shipment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to track shipment' },
      { status: 500 }
    );
  }
}

