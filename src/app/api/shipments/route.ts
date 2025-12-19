import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Shipment, StoreShippingIntegration } from '@/types/payment';
import { getUserFromRequest } from '@/lib/auth';
import { getStoreShippingAdapter, getShippingAdapterById, createShippingAdapter, ShippingAdapterConfig } from '@/lib/shipping';
import { Order } from '@/types/order';
import { eventBus } from '@/lib/events/eventBus';

// GET /api/shipments - List shipments
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE store_id = $1';
    const values: any[] = [user.store_id];
    let paramIndex = 2;

    if (orderId) {
      whereClause += ` AND order_id = $${paramIndex++}`;
      values.push(orderId);
    }

    if (status) {
      whereClause += ` AND status = $${paramIndex++}`;
      values.push(status);
    }

    const shipments = await query<Shipment>(
      `SELECT * FROM shipments ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...values, limit, offset]
    );

    const total = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM shipments ${whereClause}`,
      values
    );

    return NextResponse.json({
      shipments,
      pagination: {
        page,
        limit,
        total: parseInt(total?.count || '0'),
        totalPages: Math.ceil(parseInt(total?.count || '0') / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching shipments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch shipments' },
      { status: 500 }
    );
  }
}

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
    provider: integration.provider,
    isSandbox: false,
    credentials,
    settings,
  };
  
  return createShippingAdapter(config);
}

// POST /api/shipments - Create shipment (single or bulk)
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, orderIds, integrationId } = body;

    // Handle single or bulk shipment creation
    const idsToProcess = orderIds || [orderId];
    
    if (!idsToProcess || idsToProcess.length === 0) {
      return NextResponse.json(
        { error: 'orderId or orderIds is required' },
        { status: 400 }
      );
    }

    // Get integration
    let integration: StoreShippingIntegration | null = null;
    
    if (integrationId) {
      integration = await queryOne<StoreShippingIntegration>(
        'SELECT * FROM store_shipping_integrations WHERE id = $1 AND store_id = $2',
        [integrationId, user.store_id]
      );
    } else {
      // Get default active integration
      integration = await queryOne<StoreShippingIntegration>(
        `SELECT * FROM store_shipping_integrations 
         WHERE store_id = $1 AND is_active = true AND is_default = true
         LIMIT 1`,
        [user.store_id]
      );
      
      if (!integration) {
        integration = await queryOne<StoreShippingIntegration>(
          `SELECT * FROM store_shipping_integrations 
           WHERE store_id = $1 AND is_active = true
           LIMIT 1`,
          [user.store_id]
        );
      }
    }

    if (!integration) {
      return NextResponse.json(
        { error: 'No active shipping integration found' },
        { status: 400 }
      );
    }

    // Create adapter using unified architecture
    const adapter = createAdapterFromIntegration(integration);

    const results: { orderId: number; success: boolean; shipment?: Shipment; error?: string }[] = [];

    for (const oid of idsToProcess) {
      try {
        // Get order
        const order = await queryOne<Order>(
          `SELECT o.*, 
                  COALESCE(o.shipping_address->>'city', '') as ship_city,
                  COALESCE(o.shipping_address->>'address1', '') as ship_address,
                  COALESCE(o.shipping_address->>'zip', '') as ship_zip,
                  COALESCE(o.shipping_address->>'phone', o.phone, '') as ship_phone
           FROM orders o
           WHERE o.id = $1 AND o.store_id = $2`,
          [oid, user.store_id]
        );

        if (!order) {
          results.push({ orderId: oid, success: false, error: 'Order not found' });
          continue;
        }

        // Check if already shipped
        const existingShipment = await queryOne<Shipment>(
          `SELECT id FROM shipments WHERE order_id = $1 AND status NOT IN ('cancelled', 'failed')`,
          [oid]
        );

        if (existingShipment) {
          results.push({ orderId: oid, success: false, error: 'Order already has an active shipment' });
          continue;
        }

        // Create shipment via adapter
        const shippingAddress = typeof order.shipping_address === 'string' 
          ? JSON.parse(order.shipping_address) 
          : order.shipping_address;

        // Use unified adapter interface
        const createResult = await adapter.createShipment({
          integration,
          shipment: {
            orderId: order.id,
            orderName: order.order_name || `#${order.id}`,
            consigneeName: order.name || shippingAddress?.name || '',
            phone: order.phone || shippingAddress?.phone || '',
            email: order.email || '',
            city: shippingAddress?.city || '',
            street: shippingAddress?.address1 || shippingAddress?.street || '',
            houseNumber: shippingAddress?.house_number || '',
            entrance: shippingAddress?.entrance || '',
            floor: shippingAddress?.floor || '',
            apartment: shippingAddress?.apartment || '',
            addressRemarks: shippingAddress?.notes || '',
            shipmentRemarks: order.note || '',
            numberOfPackages: 1,
          },
        });

        if (!createResult.success) {
          results.push({ orderId: oid, success: false, error: createResult.error });
          
          // Log failed shipment attempt
          await queryOne(
            `INSERT INTO shipments (
              store_id, order_id, integration_id, provider, status, error_message
            ) VALUES ($1, $2, $3, $4, 'failed', $5)
            RETURNING id`,
            [user.store_id, oid, integration.id, integration.provider, createResult.error]
          );
          continue;
        }

        // Create shipment record
        const shipment = await queryOne<Shipment>(
          `INSERT INTO shipments (
            store_id, order_id, integration_id, provider, 
            external_shipment_id, external_random_id, tracking_number, tracking_url,
            recipient_name, recipient_phone, recipient_address, recipient_city, recipient_zip,
            status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'created')
          RETURNING *`,
          [
            user.store_id,
            oid,
            integration.id,
            integration.provider,
            createResult.shipmentId || null,
            createResult.randomId || null,
            createResult.trackingNumber || null,
            createResult.trackingUrl || null,
            order.name || shippingAddress?.name || '',
            order.phone || shippingAddress?.phone || '',
            shippingAddress?.address1 || '',
            shippingAddress?.city || '',
            shippingAddress?.zip || '',
          ]
        );

        // Update order fulfillment status
        await query(
          `UPDATE orders SET fulfillment_status = 'in_progress', updated_at = now() WHERE id = $1`,
          [oid]
        );

        // Emit event
        await eventBus.emitEvent('shipment.created', {
          order_id: oid,
          shipment_id: shipment?.id,
          tracking_number: createResult.trackingNumber,
          provider: integration.provider,
        }, {
          store_id: user.store_id,
          source: 'api',
          user_id: user.id,
        });

        results.push({ orderId: oid, success: true, shipment: shipment || undefined });
      } catch (orderError: any) {
        console.error(`Error processing order ${oid}:`, orderError);
        results.push({ orderId: oid, success: false, error: orderError.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: successCount > 0,
      message: `Created ${successCount} shipments${failCount > 0 ? `, ${failCount} failed` : ''}`,
      results,
    });
  } catch (error: any) {
    console.error('Error creating shipment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create shipment' },
      { status: 500 }
    );
  }
}
