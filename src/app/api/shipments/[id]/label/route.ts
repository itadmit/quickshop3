import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { Shipment, StoreShippingIntegration } from '@/types/payment';
import { getUserFromRequest } from '@/lib/auth';
import { getShippingAdapter, registerAllShippingAdapters } from '@/lib/shipping';

// GET /api/shipments/[id]/label - Get shipping label
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

    // Return cached label if available
    if (shipment.label_url) {
      return NextResponse.json({
        success: true,
        labelUrl: shipment.label_url,
        labelFormat: shipment.label_format || 'pdf',
      });
    }

    if (!shipment.external_shipment_id) {
      return NextResponse.json({ 
        error: 'No external shipment ID available' 
      }, { status: 400 });
    }

    // Get integration
    const integration = await queryOne<StoreShippingIntegration>(
      'SELECT * FROM store_shipping_integrations WHERE id = $1',
      [shipment.integration_id]
    );

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    // Get label from provider
    registerAllShippingAdapters();
    const adapter = getShippingAdapter(integration.provider, integration);
    
    const labelResult = await adapter.getLabel(shipment.external_shipment_id);

    if (!labelResult.success) {
      return NextResponse.json({ 
        error: labelResult.error || 'Failed to get label' 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      labelUrl: labelResult.labelUrl,
      labelFormat: labelResult.format || 'pdf',
    });
  } catch (error: any) {
    console.error('Error getting shipment label:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get label' },
      { status: 500 }
    );
  }
}

