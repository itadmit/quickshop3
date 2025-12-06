import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { quickshopList } from '@/lib/utils/apiFormatter';

// GET /api/webhooks/subscriptions/:id/deliveries - Get webhook delivery logs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const subscriptionId = parseInt(id);

    // Verify subscription belongs to store
    const subscription = await queryOne<{ id: number }>(
      'SELECT id FROM webhook_subscriptions WHERE id = $1 AND store_id = $2',
      [subscriptionId, user.store_id]
    );

    if (!subscription) {
      return NextResponse.json({ error: 'Webhook subscription not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status'); // pending, sent, failed

    let queryStr = `
      SELECT 
        we.id,
        we.topic,
        we.status,
        we.attempts,
        we.last_error,
        we.created_at,
        we.updated_at,
        COUNT(wda.id) as delivery_attempts_count
      FROM webhook_events we
      LEFT JOIN webhook_delivery_attempts wda ON wda.webhook_event_id = we.id
      WHERE we.subscription_id = $1
    `;
    const queryParams: any[] = [subscriptionId];

    if (status) {
      queryStr += ` AND we.status = $${queryParams.length + 1}`;
      queryParams.push(status);
    }

    queryStr += `
      GROUP BY we.id, we.topic, we.status, we.attempts, we.last_error, we.created_at, we.updated_at
      ORDER BY we.created_at DESC
      LIMIT $${queryParams.length + 1}
    `;
    queryParams.push(limit);

    const deliveries = await query(queryStr, queryParams);

    return NextResponse.json(quickshopList('deliveries', deliveries));
  } catch (error: any) {
    console.error('Error fetching webhook deliveries:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch webhook deliveries' },
      { status: 500 }
    );
  }
}

