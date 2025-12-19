/**
 * Inventory Listener - מנהל מלאי אוטומטית
 * 
 * הזרימה הנכונה:
 * - order.created → שריינות מלאי (committed += quantity, לא מורידים available)
 * - order.paid → הורדת מלאי בפועל (available -= quantity)
 * - order.cancelled → החזרת מלאי (committed -= quantity, available += quantity אם כבר שולם)
 */

import { eventBus } from '../eventBus';
import { query, queryOne } from '@/lib/db';

// ביצירת הזמנה - רק שריינות (committed), לא הורדת מלאי
eventBus.on('order.created', async (event) => {
  try {
    const { order } = event.payload;

    if (!order || !order.line_items) {
      return;
    }

    console.log(`[Inventory] Reserving stock for order ${order.id}`);

    // שריינות מלאי לכל פריט בהזמנה (committed)
    for (const lineItem of order.line_items) {
      if (lineItem.variant_id) {
        // עדכון committed ב-variant_inventory (לא מורידים available עדיין!)
        await query(
          `UPDATE variant_inventory 
           SET committed = committed + $1,
               updated_at = now()
           WHERE variant_id = $2`,
          [lineItem.quantity, lineItem.variant_id]
        );

        // פליטת אירוע inventory.reserved
        await eventBus.emitEvent('inventory.reserved', {
          variant_id: lineItem.variant_id,
          quantity: lineItem.quantity,
          reason: 'order_created',
          order_id: order.id,
        }, {
          store_id: event.store_id,
          source: 'system',
        });
      }
    }
  } catch (error) {
    console.error('[Inventory] Error reserving stock:', error);
  }
});

// אחרי תשלום מאושר - הורדת מלאי בפועל
eventBus.on('order.paid', async (event) => {
  try {
    const { order } = event.payload;

    if (!order || !order.id) {
      return;
    }

    // קבל את הפריטים מה-DB (כי order.paid לא בהכרח מכיל line_items מלאים)
    const lineItems = await query<{ variant_id: number; quantity: number }[]>(
      `SELECT variant_id, quantity FROM order_line_items WHERE order_id = $1`,
      [order.id]
    );

    if (!lineItems || lineItems.length === 0) {
      return;
    }

    console.log(`[Inventory] Deducting stock for paid order ${order.id}`);

    // הורדת מלאי בפועל לכל פריט
    for (const lineItem of lineItems) {
      if (lineItem.variant_id) {
        // הורדת available ושחרור committed
        await query(
          `UPDATE variant_inventory 
           SET available = available - $1,
               committed = GREATEST(0, committed - $1),
               updated_at = now()
           WHERE variant_id = $2`,
          [lineItem.quantity, lineItem.variant_id]
        );

        // עדכון מלאי ב-product_variants
        await query(
          `UPDATE product_variants 
           SET inventory_quantity = inventory_quantity - $1,
               updated_at = now()
           WHERE id = $2`,
          [lineItem.quantity, lineItem.variant_id]
        );

        // פליטת אירוע inventory.updated
        await eventBus.emitEvent('inventory.updated', {
          variant_id: lineItem.variant_id,
          quantity: -lineItem.quantity,
          reason: 'order_paid',
          order_id: order.id,
        }, {
          store_id: event.store_id,
          source: 'system',
        });
      }
    }
  } catch (error) {
    console.error('[Inventory] Error deducting stock:', error);
  }
});

// ביטול הזמנה - החזרת מלאי (תלוי אם שולמה או לא)
eventBus.on('order.cancelled', async (event) => {
  try {
    const { order } = event.payload;

    if (!order || !order.id) {
      return;
    }

    // קבל את ההזמנה המלאה כדי לדעת אם היא שולמה
    const fullOrder = await queryOne<{ financial_status: string }>(
      `SELECT financial_status FROM orders WHERE id = $1`,
      [order.id]
    );

    const wasPaid = fullOrder?.financial_status === 'paid' || fullOrder?.financial_status === 'refunded';

    // קבל את הפריטים מה-DB
    const lineItems = await query<{ variant_id: number; quantity: number }[]>(
      `SELECT variant_id, quantity FROM order_line_items WHERE order_id = $1`,
      [order.id]
    );

    if (!lineItems || lineItems.length === 0) {
      return;
    }

    console.log(`[Inventory] Releasing stock for cancelled order ${order.id} (was paid: ${wasPaid})`);

    // החזרת מלאי לכל פריט בהזמנה המבוטלת
    for (const lineItem of lineItems) {
      if (lineItem.variant_id) {
        if (wasPaid) {
          // ההזמנה שולמה - מחזירים available (כי כבר הורד)
          await query(
            `UPDATE variant_inventory 
             SET available = available + $1,
                 updated_at = now()
             WHERE variant_id = $2`,
            [lineItem.quantity, lineItem.variant_id]
          );

          // עדכון מלאי ב-product_variants
          await query(
            `UPDATE product_variants 
             SET inventory_quantity = inventory_quantity + $1,
                 updated_at = now()
             WHERE id = $2`,
            [lineItem.quantity, lineItem.variant_id]
          );
        } else {
          // ההזמנה לא שולמה - רק משחררים committed
          await query(
            `UPDATE variant_inventory 
             SET committed = GREATEST(0, committed - $1),
                 updated_at = now()
             WHERE variant_id = $2`,
            [lineItem.quantity, lineItem.variant_id]
          );
        }

        // פליטת אירוע inventory.updated
        await eventBus.emitEvent('inventory.updated', {
          variant_id: lineItem.variant_id,
          quantity: wasPaid ? lineItem.quantity : 0,
          committed_change: wasPaid ? 0 : -lineItem.quantity,
          reason: 'order_cancelled',
          order_id: order.id,
        }, {
          store_id: event.store_id,
          source: 'system',
        });
      }
    }
  } catch (error) {
    console.error('[Inventory] Error releasing stock:', error);
  }
});

