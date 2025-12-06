import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// POST /api/webhooks/subscriptions/:id/test - Test webhook
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
    const subscriptionId = parseInt(id);

    const subscription = await queryOne<{
      id: number;
      address: string;
      topic: string;
    }>(
      'SELECT id, address, topic FROM webhook_subscriptions WHERE id = $1 AND store_id = $2',
      [subscriptionId, user.store_id]
    );

    if (!subscription) {
      return NextResponse.json({ error: 'Webhook subscription not found' }, { status: 404 });
    }

    // Send test webhook
    const testPayload = {
      test: true,
      topic: subscription.topic,
      payload: {
        test: 'This is a test webhook',
        timestamp: new Date().toISOString(),
      },
    };

    try {
      const response = await fetch(subscription.address, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Topic': subscription.topic,
          'X-Webhook-Store-Id': user.store_id.toString(),
        },
        body: JSON.stringify(testPayload),
      });

      return NextResponse.json({
        success: true,
        http_status: response.status,
        response_time_ms: 0, // Would need to measure
        message: response.ok ? 'Webhook sent successfully' : 'Webhook sent but received error response',
      });
    } catch (error: any) {
      return NextResponse.json({
        success: false,
        error: error.message || 'Failed to send webhook',
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error testing webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to test webhook' },
      { status: 500 }
    );
  }
}

