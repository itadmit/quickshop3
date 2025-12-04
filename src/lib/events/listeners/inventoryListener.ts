// Inventory Listener - מאזין ל-order.created ומוריד מלאי אוטומטית

import { eventBus } from '../eventBus';
import { query } from '@/lib/db';

eventBus.on('order.created', async (event) => {
  try {
    const { order } = event.payload;

    if (!order || !order.line_items) {
      return;
    }

    // הורדת מלאי לכל פריט בהזמנה
    for (const lineItem of order.line_items) {
      if (lineItem.variant_id) {
        // עדכון מלאי ב-variant_inventory
        await query(
          `UPDATE variant_inventory 
           SET available = available - $1,
               committed = committed + $1,
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
          reason: 'order_created',
          order_id: order.id,
        }, {
          store_id: event.store_id,
          source: 'system',
        });
      }
    }
  } catch (error) {
    console.error('Error in inventory listener:', error);
  }
});

eventBus.on('order.cancelled', async (event) => {
  try {
    const { order } = event.payload;

    if (!order || !order.line_items) {
      return;
    }

    // החזרת מלאי לכל פריט בהזמנה המבוטלת
    for (const lineItem of order.line_items) {
      if (lineItem.variant_id) {
        // עדכון מלאי ב-variant_inventory
        await query(
          `UPDATE variant_inventory 
           SET available = available + $1,
               committed = committed - $1,
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

        // פליטת אירוע inventory.updated
        await eventBus.emitEvent('inventory.updated', {
          variant_id: lineItem.variant_id,
          quantity: lineItem.quantity,
          reason: 'order_cancelled',
          order_id: order.id,
        }, {
          store_id: event.store_id,
          source: 'system',
        });
      }
    }
  } catch (error) {
    console.error('Error in inventory listener (cancelled):', error);
  }
});

