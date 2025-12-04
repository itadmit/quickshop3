import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { WebhookSubscription, CreateWebhookSubscriptionRequest } from '@/types/webhook';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/webhooks/subscriptions/:id - Get webhook subscription
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const subscriptionId = parseInt(id);
    const subscription = await queryOne<WebhookSubscription>(
      'SELECT * FROM webhook_subscriptions WHERE id = $1 AND store_id = $2',
      [subscriptionId, user.store_id]
    );

    if (!subscription) {
      return NextResponse.json({ error: 'Webhook subscription not found' }, { status: 404 });
    }

    return NextResponse.json({ subscription });
  } catch (error: any) {
    console.error('Error fetching webhook subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch webhook subscription' },
      { status: 500 }
    );
  }
}

// PUT /api/webhooks/subscriptions/:id - Update webhook subscription
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const subscriptionId = parseInt(id);
    const body: CreateWebhookSubscriptionRequest = await request.json();

    if (!body.topic || !body.address) {
      return NextResponse.json(
        { error: 'Topic and address are required' },
        { status: 400 }
      );
    }

    const subscription = await queryOne<WebhookSubscription>(
      `UPDATE webhook_subscriptions 
       SET topic = $1, address = $2, format = $3, fields = $4, 
           metafield_namespaces = $5, api_version = $6, updated_at = now()
       WHERE id = $7 AND store_id = $8
       RETURNING *`,
      [
        body.topic,
        body.address,
        body.format || 'json',
        body.fields || null,
        body.metafield_namespaces || null,
        body.api_version || '2024-01',
        subscriptionId,
        user.store_id,
      ]
    );

    if (!subscription) {
      return NextResponse.json({ error: 'Webhook subscription not found' }, { status: 404 });
    }

    // Emit event
    await eventBus.emitEvent('webhook.subscription.updated', {
      subscription: {
        id: subscription.id,
        topic: subscription.topic,
        address: subscription.address,
      },
    }, {
      store_id: user.store_id,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ subscription });
  } catch (error: any) {
    console.error('Error updating webhook subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update webhook subscription' },
      { status: 500 }
    );
  }
}

// DELETE /api/webhooks/subscriptions/:id - Delete webhook subscription
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
  ) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const subscriptionId = parseInt(id);

    const subscription = await queryOne<WebhookSubscription>(
      'SELECT * FROM webhook_subscriptions WHERE id = $1 AND store_id = $2',
      [subscriptionId, user.store_id]
    );

    if (!subscription) {
      return NextResponse.json({ error: 'Webhook subscription not found' }, { status: 404 });
    }

    await query(
      'DELETE FROM webhook_subscriptions WHERE id = $1 AND store_id = $2',
      [subscriptionId, user.store_id]
    );

    // Emit event
    await eventBus.emitEvent('webhook.subscription.deleted', {
      subscription: {
        id: subscription.id,
        topic: subscription.topic,
      },
    }, {
      store_id: user.store_id,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting webhook subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete webhook subscription' },
      { status: 500 }
    );
  }
}
