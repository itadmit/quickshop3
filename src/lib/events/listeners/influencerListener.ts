import { eventBus } from '../eventBus';
import { query, queryOne } from '@/lib/db';

/**
 * Listener for influencer-related events
 * Handles discount code usage tracking when orders are created/cancelled
 */

// Listen to order.cancelled event to decrement usage_count
eventBus.on('order.cancelled', async (event) => {
  try {
    const { order } = event.payload;

    if (!order || !order.id) {
      return;
    }

    // Get full order details including discount_codes
    const fullOrder = await queryOne<{
      id: number;
      discount_codes: string[] | null;
      store_id: number;
    }>(
      'SELECT id, discount_codes, store_id FROM orders WHERE id = $1',
      [order.id]
    );

    if (!fullOrder || !fullOrder.discount_codes || !Array.isArray(fullOrder.discount_codes)) {
      return;
    }

    // Decrement usage_count for each discount code
    for (const code of fullOrder.discount_codes) {
      if (code && typeof code === 'string') {
        await queryOne(
          `UPDATE discount_codes 
           SET usage_count = GREATEST(0, usage_count - 1), updated_at = now()
           WHERE store_id = $1 AND code = $2`,
          [fullOrder.store_id, code.toUpperCase()]
        );
      }
    }

    console.log(`✅ Decremented usage_count for discount codes in cancelled order ${order.id}`);
  } catch (error) {
    console.error('Error in influencer listener (order.cancelled):', error);
  }
});

// Listen to order.voided event (financial_status = voided)
eventBus.on('order.voided', async (event) => {
  try {
    const { order } = event.payload;

    if (!order || !order.id) {
      return;
    }

    // Get full order details including discount_codes
    const fullOrder = await queryOne<{
      id: number;
      discount_codes: string[] | null;
      store_id: number;
    }>(
      'SELECT id, discount_codes, store_id FROM orders WHERE id = $1',
      [order.id]
    );

    if (!fullOrder || !fullOrder.discount_codes || !Array.isArray(fullOrder.discount_codes)) {
      return;
    }

    // Decrement usage_count for each discount code
    for (const code of fullOrder.discount_codes) {
      if (code && typeof code === 'string') {
        await queryOne(
          `UPDATE discount_codes 
           SET usage_count = GREATEST(0, usage_count - 1), updated_at = now()
           WHERE store_id = $1 AND code = $2`,
          [fullOrder.store_id, code.toUpperCase()]
        );
      }
    }

    console.log(`✅ Decremented usage_count for discount codes in voided order ${order.id}`);
  } catch (error) {
    console.error('Error in influencer listener (order.voided):', error);
  }
});

