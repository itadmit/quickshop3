/**
 * Shipping Listener - מאזין לאירועים ושולח הזמנות למשלוח אוטומטי
 * 
 * Listens to:
 * - order.paid: שולח הזמנה לחברת שליחויות אם מופעל משלוח אוטומטי
 */

import { eventBus } from '../eventBus';
import { query, queryOne } from '@/lib/db';
import { getStoreShippingGateway } from '@/lib/shipping';

interface ShippingIntegration {
  id: number;
  provider: string;
  auto_ship_on_payment: boolean;
  is_active: boolean;
  settings: Record<string, any>;
}

// מאזין ל-order.paid ושולח למשלוח אם מופעל
eventBus.on('order.paid', async (event) => {
  try {
    const { order } = event.payload;

    if (!order || !order.id) {
      return;
    }

    // בדוק אם יש הגדרת משלוח אוטומטי לחנות
    const shippingIntegration = await queryOne<ShippingIntegration>(
      `SELECT * FROM store_shipping_integrations 
       WHERE store_id = $1 AND is_active = true AND auto_ship_on_payment = true
       ORDER BY is_default DESC LIMIT 1`,
      [event.store_id]
    );

    if (!shippingIntegration) {
      console.log(`[Shipping Listener] No auto-ship enabled for store ${event.store_id}`);
      return;
    }

    console.log(`[Shipping Listener] Auto-ship triggered for order ${order.id}`);

    // קבל את ההזמנה המלאה
    const fullOrder = await queryOne<any>(
      `SELECT o.*, s.slug as store_slug, s.name as store_name
       FROM orders o 
       JOIN stores s ON o.store_id = s.id
       WHERE o.id = $1`,
      [order.id]
    );

    if (!fullOrder) {
      console.warn(`[Shipping Listener] Order ${order.id} not found`);
      return;
    }

    // בדוק אם ההזמנה היא למשלוח (לא לאיסוף עצמי)
    if (fullOrder.delivery_method === 'pickup') {
      console.log(`[Shipping Listener] Order ${order.id} is for pickup, skipping auto-ship`);
      return;
    }

    // בדוק אם כבר נשלחה
    const existingShipment = await queryOne<any>(
      `SELECT id FROM shipments WHERE order_id = $1`,
      [order.id]
    );

    if (existingShipment) {
      console.log(`[Shipping Listener] Order ${order.id} already has a shipment`);
      return;
    }

    // קבל את ה-gateway
    const gateway = await getStoreShippingGateway(event.store_id);
    if (!gateway) {
      console.warn(`[Shipping Listener] No shipping gateway found for store ${event.store_id}`);
      return;
    }

    // Parse shipping address
    const shippingAddress = typeof fullOrder.shipping_address === 'string'
      ? JSON.parse(fullOrder.shipping_address)
      : (fullOrder.shipping_address || {});

    // צור משלוח
    const shipmentResult = await gateway.createShipment({
      orderId: fullOrder.id,
      orderNumber: fullOrder.order_number || `#${fullOrder.id}`,
      recipient: {
        name: `${shippingAddress.first_name || ''} ${shippingAddress.last_name || ''}`.trim() || fullOrder.name,
        phone: shippingAddress.phone || fullOrder.phone || '',
        email: fullOrder.email || '',
        address: shippingAddress.address1 || '',
        city: shippingAddress.city || '',
        zip: shippingAddress.zip || '',
        country: shippingAddress.country || 'Israel',
      },
      packages: [{
        weight: 1, // Default weight
        description: `הזמנה ${fullOrder.order_number || fullOrder.id}`,
      }],
    });

    if (!shipmentResult.success) {
      console.error(`[Shipping Listener] Failed to create shipment for order ${order.id}:`, shipmentResult.error);
      return;
    }

    // שמור את המשלוח ב-DB
    await query(
      `INSERT INTO shipments (
        store_id, order_id, provider, external_shipment_id,
        tracking_number, tracking_url, status, label_url,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())`,
      [
        event.store_id,
        order.id,
        gateway.provider,
        shipmentResult.shipmentId || null,
        shipmentResult.trackingNumber || null,
        shipmentResult.trackingUrl || null,
        'created',
        shipmentResult.labelUrl || null,
      ]
    );

    console.log(`✅ [Shipping Listener] Auto-shipment created for order ${order.id}`);

    // עדכן את סטטוס ההזמנה
    await query(
      `UPDATE orders SET 
        fulfillment_status = 'pending',
        updated_at = now()
       WHERE id = $1`,
      [order.id]
    );

    // פליטת אירוע shipment.created
    await eventBus.emitEvent('shipment.created', {
      order_id: order.id,
      shipment_id: shipmentResult.shipmentId,
      tracking_number: shipmentResult.trackingNumber,
      provider: gateway.provider,
      auto_created: true,
    }, {
      store_id: event.store_id,
      source: 'shipping_listener',
    });

  } catch (error) {
    console.error('[Shipping Listener] Error processing auto-ship:', error);
    // לא נכשל את האירוע אם יצירת המשלוח נכשלה
  }
});

