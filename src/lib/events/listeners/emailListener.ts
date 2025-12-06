/**
 * Email Listener - מאזין לאירועים ושולח מיילים אוטומטיים
 * 
 * Listens to:
 * - order.paid: שולח מייל אישור הזמנה
 * - order.fulfilled: שולח מייל עדכון משלוח
 * - order.refunded: שולח מייל החזר
 */

import { eventBus } from '../eventBus';
import { sendOrderReceiptEmail } from '@/lib/order-email';
import { queryOne } from '@/lib/db';
import { Order } from '@/types/order';
import { EmailEngine } from '@/lib/services/email-engine';

// מאזין ל-order.paid ושולח מייל אישור הזמנה
eventBus.on('order.paid', async (event) => {
  try {
    const { order } = event.payload;

    if (!order || !order.id) {
      console.warn('Email listener: order.paid event missing order data');
      return;
    }

    // קבל את ההזמנה המלאה מה-DB
    const fullOrder = await queryOne<Order>(
      'SELECT * FROM orders WHERE id = $1',
      [order.id]
    );

    if (!fullOrder) {
      console.warn(`Email listener: Order ${order.id} not found`);
      return;
    }

    // בדוק אם יש כתובת אימייל
    if (!fullOrder.email) {
      console.warn(`Email listener: Order ${order.id} has no email address`);
      return;
    }

    // שלח מייל אישור הזמנה
    try {
      await sendOrderReceiptEmail(fullOrder.id, event.store_id);
      console.log(`✅ Order confirmation email sent for order ${fullOrder.order_name || fullOrder.id}`);
    } catch (error: any) {
      // אם SendGrid לא מוגדר, רק לוג - לא נכשל את האירוע
      if (error.message?.includes('not configured')) {
        console.warn(`⚠️ SendGrid not configured - skipping email for order ${fullOrder.id}`);
        return;
      }
      console.error(`Error sending order confirmation email:`, error);
    }
  } catch (error) {
    console.error('Error in email listener (order.paid):', error);
    // לא נכשל את האירוע אם שליחת המייל נכשלה
  }
});

// מאזין ל-order.fulfilled ושולח מייל עדכון משלוח
eventBus.on('order.fulfilled', async (event) => {
  try {
    const { order, fulfillment } = event.payload;

    if (!order || !order.id) {
      console.warn('Email listener: order.fulfilled event missing order data');
      return;
    }

    // קבל את ההזמנה המלאה מה-DB
    const fullOrder = await queryOne<Order>(
      'SELECT * FROM orders WHERE id = $1',
      [order.id]
    );

    if (!fullOrder || !fullOrder.email) {
      console.warn(`Email listener: Order ${order.id} not found or has no email`);
      return;
    }

    // שליחת מייל עדכון משלוח
    try {
      const engine = new EmailEngine(event.store_id);
      
      // Get tracking info if available
      const trackingNumber = fulfillment?.tracking_number || undefined;
      const trackingUrl = fulfillment?.tracking_url || undefined;
      
      await engine.send('ORDER_FULFILLED', fullOrder.email, {
        customer_first_name: fullOrder.name?.split(' ')[0] || 'לקוח יקר',
        order_name: fullOrder.order_name || `#${fullOrder.order_number || fullOrder.id}`,
        order_status_url: `https://${process.env.NEXT_PUBLIC_APP_URL || 'quickshop.co.il'}/orders/${fullOrder.id}`,
        tracking_number: trackingNumber,
        tracking_url: trackingUrl,
      });
      
      console.log(`✅ Order fulfilled email sent for order ${fullOrder.order_name || fullOrder.id}`);
    } catch (error: any) {
      if (error.message?.includes('not configured')) {
        console.warn(`⚠️ SendGrid not configured - skipping email for order ${fullOrder.id}`);
        return;
      }
      console.error(`Error sending order fulfilled email:`, error);
    }
  } catch (error) {
    console.error('Error in email listener (order.fulfilled):', error);
  }
});

// מאזין ל-order.refunded ושולח מייל החזר
eventBus.on('order.refunded', async (event) => {
  try {
    const { order, refund } = event.payload;

    if (!order || !order.id) {
      console.warn('Email listener: order.refunded event missing order data');
      return;
    }

    // קבל את ההזמנה המלאה מה-DB
    const fullOrder = await queryOne<Order>(
      'SELECT * FROM orders WHERE id = $1',
      [order.id]
    );

    if (!fullOrder || !fullOrder.email) {
      console.warn(`Email listener: Order ${order.id} not found or has no email`);
      return;
    }

    // שליחת מייל החזר
    try {
      const engine = new EmailEngine(event.store_id);
      
      const refundAmount = refund?.amount ? `₪${parseFloat(refund.amount.toString()).toFixed(2)}` : undefined;
      const refundReason = refund?.reason || undefined;
      
      await engine.send('ORDER_REFUNDED', fullOrder.email, {
        customer_first_name: fullOrder.name?.split(' ')[0] || 'לקוח יקר',
        order_name: fullOrder.order_name || `#${fullOrder.order_number || fullOrder.id}`,
        order_status_url: `https://${process.env.NEXT_PUBLIC_APP_URL || 'quickshop.co.il'}/orders/${fullOrder.id}`,
        refund_amount: refundAmount,
        refund_reason: refundReason,
      });
      
      console.log(`✅ Order refunded email sent for order ${fullOrder.order_name || fullOrder.id}`);
    } catch (error: any) {
      if (error.message?.includes('not configured')) {
        console.warn(`⚠️ SendGrid not configured - skipping email for order ${fullOrder.id}`);
        return;
      }
      console.error(`Error sending order refunded email:`, error);
    }
  } catch (error) {
    console.error('Error in email listener (order.refunded):', error);
  }
});

