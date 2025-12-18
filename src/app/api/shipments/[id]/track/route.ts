import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { Shipment, StoreShippingIntegration } from '@/types/payment';
import { getUserFromRequest } from '@/lib/auth';
import { getShippingAdapter, registerAllShippingAdapters } from '@/lib/shipping';

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

    // Get tracking from provider
    registerAllShippingAdapters();
    const adapter = getShippingAdapter(integration.provider, integration);
    
    const trackResult = await adapter.trackShipment(shipment.external_shipment_id);

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

