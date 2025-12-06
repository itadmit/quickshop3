import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// POST /api/webhooks/events/:id/retry - Retry failed webhook delivery
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const eventId = parseInt(id);

    // Get webhook event and verify it belongs to store
    const webhookEvent = await queryOne<{
      id: number;
      subscription_id: number;
      topic: string;
      payload: any;
      status: string;
      attempts: number;
    }>(
      `SELECT we.id, we.subscription_id, we.topic, we.payload, we.status, we.attempts
       FROM webhook_events we
       INNER JOIN webhook_subscriptions ws ON ws.id = we.subscription_id
       WHERE we.id = $1 AND ws.store_id = $2`,
      [eventId, user.store_id]
    );

    if (!webhookEvent) {
      return NextResponse.json({ error: 'Webhook event not found' }, { status: 404 });
    }

    if (webhookEvent.status === 'sent') {
      return NextResponse.json({ error: 'Webhook already sent successfully' }, { status: 400 });
    }

    // Get subscription details
    const subscription = await queryOne<{ address: string }>(
      'SELECT address FROM webhook_subscriptions WHERE id = $1',
      [webhookEvent.subscription_id]
    );

    if (!subscription) {
      return NextResponse.json({ error: 'Webhook subscription not found' }, { status: 404 });
    }

    // Update attempts
    await query(
      `UPDATE webhook_events 
       SET attempts = attempts + 1, updated_at = now()
       WHERE id = $1`,
      [eventId]
    );

    // Try to send webhook
    try {
      const payload = typeof webhookEvent.payload === 'string' 
        ? JSON.parse(webhookEvent.payload) 
        : webhookEvent.payload;

      const response = await fetch(subscription.address, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Topic': webhookEvent.topic,
          'X-Webhook-Store-Id': user.store_id.toString(),
        },
        body: JSON.stringify(payload),
      });

      const responseTime = Date.now(); // Simplified

      // Record delivery attempt
      await query(
        `INSERT INTO webhook_delivery_attempts 
         (webhook_event_id, attempt_number, status, http_status, response_time_ms, created_at)
         VALUES ($1, $2, $3, $4, $5, now())`,
        [
          eventId,
          webhookEvent.attempts + 1,
          response.ok ? 'success' : 'failed',
          response.status,
          responseTime,
        ]
      );

      // Update event status
      await query(
        `UPDATE webhook_events 
         SET status = $1, updated_at = now()
         WHERE id = $2`,
        [response.ok ? 'sent' : 'failed', eventId]
      );

      return NextResponse.json({
        success: true,
        http_status: response.status,
        message: response.ok ? 'Webhook retried successfully' : 'Webhook retried but received error response',
      });
    } catch (error: any) {
      // Record failed attempt
      await query(
        `INSERT INTO webhook_delivery_attempts 
         (webhook_event_id, attempt_number, status, error_message, created_at)
         VALUES ($1, $2, $3, $4, now())`,
        [eventId, webhookEvent.attempts + 1, 'failed', error.message]
      );

      await query(
        `UPDATE webhook_events 
         SET status = 'failed', last_error = $1, updated_at = now()
         WHERE id = $2`,
        [error.message, eventId]
      );

      return NextResponse.json({
        success: false,
        error: error.message || 'Failed to retry webhook',
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error retrying webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retry webhook' },
      { status: 500 }
    );
  }
}

