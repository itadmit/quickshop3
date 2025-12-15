import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { eventBus } from '@/lib/events/eventBus';

/**
 * CRON Job: בדיקת הזמנות נטושות
 * נקרא כל שעה דרך Upstash QStash
 * 
 * תהליך:
 * 1. עובר על כל החנויות
 * 2. לכל חנות - בודק את הגדרת הזמן לעגלות נטושות (ברירת מחדל 4 שעות)
 * 3. מוצא הזמנות עם financial_status = 'pending' שעברו את הזמן
 * 4. שולח אירוע 'order.abandoned' עבור כל הזמנה (לטריגר אוטומציות)
 */
async function handler(request: NextRequest) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  try {
    console.log(`[CRON check-abandoned-orders] Starting at ${timestamp}`);
    
    // Get all active stores
    const stores = await query(
      `SELECT s.id, s.name, 
              COALESCE((ss.settings->>'abandonedCartTimeoutHours')::int, 4) as timeout_hours
       FROM stores s
       LEFT JOIN store_settings ss ON ss.store_id = s.id
       WHERE s.is_active = true`
    );
    
    let totalAbandoned = 0;
    const abandonedByStore: Record<number, number> = {};
    
    for (const store of stores) {
      const timeoutHours = store.timeout_hours || 4;
      
      // Find orders that are pending and older than the timeout
      // Also check that we haven't already marked them as abandoned (using a note or tag)
      const abandonedOrders = await query(
        `SELECT o.* 
         FROM orders o
         WHERE o.store_id = $1
         AND o.financial_status = 'pending'
         AND o.created_at < NOW() - INTERVAL '${timeoutHours} hours'
         AND (o.tags IS NULL OR o.tags NOT LIKE '%__abandoned_notified__%')
         ORDER BY o.created_at ASC
         LIMIT 50`,
        [store.id]
      );
      
      if (abandonedOrders.length > 0) {
        console.log(`[CRON check-abandoned-orders] Found ${abandonedOrders.length} abandoned orders for store ${store.id} (${store.name})`);
        abandonedByStore[store.id] = abandonedOrders.length;
        
        for (const order of abandonedOrders) {
          // Calculate hours since creation
          const createdAt = new Date(order.created_at);
          const hoursSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
          
          // Emit event for automation triggers
          await eventBus.emitEvent('order.abandoned', {
            order: {
              id: order.id,
              order_name: order.order_name,
              order_number: order.order_number,
              order_handle: order.order_handle,
              email: order.email,
              name: order.name,
              phone: order.phone,
              customer_id: order.customer_id,
              total_price: order.total_price,
              currency: order.currency,
              created_at: order.created_at,
            },
            hours_since_creation: Math.round(hoursSinceCreation),
          }, {
            store_id: store.id,
            source: 'cron',
          });
          
          // Mark order as notified (add tag)
          const currentTags = order.tags || '';
          const newTags = currentTags 
            ? `${currentTags},__abandoned_notified__`
            : '__abandoned_notified__';
          
          await query(
            `UPDATE orders SET tags = $1, updated_at = NOW() WHERE id = $2`,
            [newTags, order.id]
          );
          
          totalAbandoned++;
        }
      }
    }
    
    const duration = Date.now() - startTime;
    
    const summary = {
      stores_checked: stores.length,
      total_abandoned_orders: totalAbandoned,
      by_store: abandonedByStore,
    };

    console.log(`[CRON check-abandoned-orders] ✅ Completed in ${duration}ms`);
    console.log(`[CRON check-abandoned-orders] Summary:`, JSON.stringify(summary, null, 2));

    return NextResponse.json({
      success: true,
      ...summary,
      timestamp,
      duration_ms: duration,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[CRON check-abandoned-orders] ❌ Error after ${duration}ms:`, error);
    console.error(`[CRON check-abandoned-orders] Error stack:`, error.stack);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to check abandoned orders',
        timestamp,
        duration_ms: duration,
      },
      { status: 500 }
    );
  }
}

// QStash signature verification
const hasQStashConfig = process.env.QSTASH_TOKEN && process.env.QSTASH_CURRENT_SIGNING_KEY;

export const GET = hasQStashConfig 
  ? verifySignatureAppRouter(handler)
  : handler;

export const POST = hasQStashConfig
  ? verifySignatureAppRouter(handler)
  : handler;

