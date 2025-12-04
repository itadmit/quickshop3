import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { WebhookSubscription, CreateWebhookSubscriptionRequest } from '@/types/webhook';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/webhooks/subscriptions - List all webhook subscriptions
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscriptions = await query<WebhookSubscription>(
      'SELECT * FROM webhook_subscriptions WHERE store_id = $1 ORDER BY created_at DESC',
      [user.store_id]
    );

    return NextResponse.json({ subscriptions });
  } catch (error: any) {
    console.error('Error fetching webhook subscriptions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch webhook subscriptions' },
      { status: 500 }
    );
  }
}

// POST /api/webhooks/subscriptions - Create webhook subscription
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateWebhookSubscriptionRequest = await request.json();
    const storeId = user.store_id;

    if (!body.topic || !body.address) {
      return NextResponse.json({ error: 'Topic and address are required' }, { status: 400 });
    }

    const subscription = await queryOne<WebhookSubscription>(
      `INSERT INTO webhook_subscriptions (
        store_id, topic, address, format, fields, metafield_namespaces, api_version,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())
      RETURNING *`,
      [
        storeId,
        body.topic,
        body.address,
        body.format || 'json',
        body.fields || null,
        body.metafield_namespaces || null,
        body.api_version || '2024-01',
      ]
    );

    if (!subscription) {
      throw new Error('Failed to create webhook subscription');
    }

    // Emit event
    await eventBus.emitEvent('webhook.subscription.created', {
      subscription: {
        id: subscription.id,
        topic: subscription.topic,
        address: subscription.address,
      },
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ subscription }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating webhook subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create webhook subscription' },
      { status: 500 }
    );
  }
}

