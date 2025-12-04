// Webhook Listener - מאזין לכל האירועים ושולח Webhooks חיצוניים

import { eventBus } from '../eventBus';
import { query, queryOne } from '@/lib/db';

// מאזין לכל האירועים
eventBus.on('*', async (event) => {
  try {
    // מצא את כל ה-webhook subscriptions שמאזינים לאירוע הזה
    const subscriptions = await query(
      `SELECT * FROM webhook_subscriptions 
       WHERE store_id = $1 
       AND (topic = $2 OR topic = '*')
       AND EXISTS (
         SELECT 1 FROM stores WHERE id = $1
       )`,
      [event.store_id, event.topic]
    );

    if (subscriptions.length === 0) {
      return;
    }

    // צור webhook event לכל subscription
    for (const subscription of subscriptions) {
      // צור webhook event
      const webhookEvent = await queryOne(
        `INSERT INTO webhook_events (
          store_id, subscription_id, topic, payload, status, attempts, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, now(), now())
        RETURNING id`,
        [
          event.store_id,
          subscription.id,
          event.topic,
          JSON.stringify(event.payload),
          'pending',
          0,
        ]
      );

      if (webhookEvent) {
        // נסה לשלוח את ה-webhook (בדרך כלל זה יעשה ב-background job)
        // כאן רק ניצור את ה-event, השליחה תיעשה ב-background worker
        console.log(`Webhook event created: ${webhookEvent.id} for subscription ${subscription.id}`);
      }
    }
  } catch (error) {
    console.error('Error in webhook listener:', error);
  }
});

