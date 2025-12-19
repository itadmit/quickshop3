import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { Shipment, StoreShippingIntegration, ShippingProviderType } from '@/types/payment';
import { getUserFromRequest } from '@/lib/auth';
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

// GET /api/shipments/[id]/track - Get shipment tracking info
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

    const shipment = await queryOne<Shipment>(
      'SELECT * FROM shipments WHERE id = $1 AND store_id = $2',
      [id, user.store_id]
    );

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    if (!shipment.external_shipment_id) {
      return NextResponse.json({ 
        shipment,
        tracking: null,
        message: 'No external tracking available' 
      });
    }

    // Get integration
    const integration = await queryOne<StoreShippingIntegration>(
      'SELECT * FROM store_shipping_integrations WHERE id = $1',
      [shipment.integration_id]
    );

    if (!integration) {
      return NextResponse.json({ 
        shipment,
        tracking: null,
        message: 'Integration not found' 
      });
    }

    // Create adapter using unified architecture
    const adapter = createAdapterFromIntegration(integration);
    
    // Get tracking via unified interface
    const trackResult = await adapter.getTracking({
      integration,
      shipmentId: shipment.external_shipment_id,
    });

    return NextResponse.json({
      shipment,
      tracking: trackResult.success ? trackResult : null,
      error: trackResult.success ? undefined : trackResult.error,
    });
  } catch (error: any) {
    console.error('Error tracking shipment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to track shipment' },
      { status: 500 }
    );
  }
}
