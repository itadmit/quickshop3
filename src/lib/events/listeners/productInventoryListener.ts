import { eventBus } from '../eventBus';
import { query, queryOne } from '@/lib/db';

/**
 * Event Listener for order events to manage product inventory
 * Listens to:
 * - order.created: Decrease inventory
 * - order.cancelled: Restore inventory
 */
export function setupProductInventoryListener() {
  // Listen to order.created event
  eventBus.on('order.created', async (event) => {
    try {
      const { order } = event.payload;
      
      if (!order || !order.line_items || !Array.isArray(order.line_items)) {
        return;
      }

      // Process each line item
      for (const item of order.line_items) {
        if (item.variant_id && item.quantity) {
          // Get variant
          const variant = await queryOne<{ inventory_quantity: number; product_id: number }>(
            'SELECT inventory_quantity, product_id FROM product_variants WHERE id = $1',
            [item.variant_id]
          );

          if (variant) {
            // Decrease inventory
            const newQuantity = Math.max(0, variant.inventory_quantity - item.quantity);
            
            await query(
              'UPDATE product_variants SET inventory_quantity = $1, updated_at = now() WHERE id = $2',
              [newQuantity, item.variant_id]
            );

            // Emit inventory.updated event
            await eventBus.emitEvent('inventory.updated', {
              variant_id: item.variant_id,
              quantity: newQuantity,
              reason: 'order_created',
            }, {
              store_id: event.store_id,
              source: 'system',
            });
          }
        }
      }
    } catch (error) {
      console.error('Error handling order.created event for inventory:', error);
    }
  });

  // Listen to order.cancelled event
  eventBus.on('order.cancelled', async (event) => {
    try {
      const { order } = event.payload;
      
      if (!order || !order.line_items || !Array.isArray(order.line_items)) {
        return;
      }

      // Process each line item
      for (const item of order.line_items) {
        if (item.variant_id && item.quantity) {
          // Get variant
          const variant = await queryOne<{ inventory_quantity: number }>(
            'SELECT inventory_quantity FROM product_variants WHERE id = $1',
            [item.variant_id]
          );

          if (variant) {
            // Restore inventory
            const newQuantity = variant.inventory_quantity + item.quantity;
            
            await query(
              'UPDATE product_variants SET inventory_quantity = $1, updated_at = now() WHERE id = $2',
              [newQuantity, item.variant_id]
            );

            // Emit inventory.updated event
            await eventBus.emitEvent('inventory.updated', {
              variant_id: item.variant_id,
              quantity: newQuantity,
              reason: 'order_cancelled',
            }, {
              store_id: event.store_id,
              source: 'system',
            });
          }
        }
      }
    } catch (error) {
      console.error('Error handling order.cancelled event for inventory:', error);
    }
  });
}

// Initialize listener when module is imported
setupProductInventoryListener();

