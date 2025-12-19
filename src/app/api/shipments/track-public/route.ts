import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { Shipment, StoreShippingIntegration, ShippingProviderType } from '@/types/payment';
import { createShippingAdapter, ShippingAdapterConfig } from '@/lib/shipping';

/**
 * Create adapter from integration record
 */
function createAdapterFromIntegration(integration: StoreShippingIntegration) {
  const settings = (integration.settings || {}) as Record<string, any>;
  
  const credentials: Record<string, string> = {};
  if (integration.customer_number) credentials.customer_number = integration.customer_number;
  if (integration.api_key_encrypted) credentials.api_key = integration.api_key_encrypted;
  if (integration.api_token_encrypted) credentials.api_token = integration.api_token_encrypted;
  if (integration.api_base_url) credentials.api_base_url = integration.api_base_url;
  if (settings.customer_number) credentials.customer_number = settings.customer_number;
  if (settings.shipment_type_code) credentials.shipment_type_code = settings.shipment_type_code;
  if (settings.cargo_type_code) credentials.cargo_type_code = settings.cargo_type_code;
  if (settings.reference_prefix) credentials.reference_prefix = settings.reference_prefix;
  
  const config: ShippingAdapterConfig = {
    integrationId: integration.id,
    storeId: integration.store_id,
    provider: integration.provider as ShippingProviderType,
    isSandbox: false,
    credentials,
    settings,
  };
  
  return createShippingAdapter(config);
}

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
          // Create adapter using unified architecture
          const adapter = createAdapterFromIntegration(integration);
          
          // Get tracking via unified interface
          const trackResult = await adapter.getTracking({
            integration,
            shipmentId: shipment.external_shipment_id,
          });

          if (trackResult.success) {
            response.tracking = {
              status: trackResult.status,
              statusDescription: trackResult.statusDescription,
              isDelivered: trackResult.isDelivered,
              deliveryDate: trackResult.deliveryDate,
              deliveryTime: trackResult.deliveryTime,
              driverName: trackResult.driverName,
              statusHistory: trackResult.statusHistory || [],
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
