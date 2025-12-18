import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Shipment, StoreShippingIntegration } from '@/types/payment';
import { getUserFromRequest } from '@/lib/auth';
import { getShippingAdapter, registerAllShippingAdapters } from '@/lib/shipping';

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

    if (integration && shipment.external_shipment_id) {
      // Try to cancel with provider
      registerAllShippingAdapters();
      const adapter = getShippingAdapter(integration.provider, integration);
      
      try {
        const cancelResult = await adapter.cancelShipment(shipment.external_shipment_id);
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

