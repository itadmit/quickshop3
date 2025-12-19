import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
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

// GET /api/shipments/[id] - Get single shipment
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

    return NextResponse.json({ shipment });
  } catch (error: any) {
    console.error('Error fetching shipment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch shipment' },
      { status: 500 }
    );
  }
}

// DELETE /api/shipments/[id] - Cancel shipment
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

    const shipment = await queryOne<Shipment>(
      'SELECT * FROM shipments WHERE id = $1 AND store_id = $2',
      [id, user.store_id]
    );

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    if (shipment.status === 'cancelled') {
      return NextResponse.json({ error: 'Shipment already cancelled' }, { status: 400 });
    }

    if (shipment.status === 'delivered') {
      return NextResponse.json({ error: 'Cannot cancel delivered shipment' }, { status: 400 });
    }

    // Get integration
    const integration = await queryOne<StoreShippingIntegration>(
      'SELECT * FROM store_shipping_integrations WHERE id = $1',
      [shipment.integration_id]
    );

    if (integration && shipment.external_random_id) {
      // Try to cancel with provider using unified architecture
      try {
        const adapter = createAdapterFromIntegration(integration);
        
        const cancelResult = await adapter.cancelShipment({
          integration,
          randomId: shipment.external_random_id,
        });
        
        if (!cancelResult.success) {
          console.warn('[CancelShipment] Provider cancel failed:', cancelResult.error);
        }
      } catch (cancelError) {
        console.warn('[CancelShipment] Provider cancel error:', cancelError);
      }
    }

    // Update shipment status
    await query(
      `UPDATE shipments SET status = 'cancelled', updated_at = now() WHERE id = $1`,
      [id]
    );

    // Update order fulfillment status back
    if (shipment.order_id) {
      await query(
        `UPDATE orders SET fulfillment_status = 'unfulfilled', updated_at = now() WHERE id = $1`,
        [shipment.order_id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error cancelling shipment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel shipment' },
      { status: 500 }
    );
  }
}
