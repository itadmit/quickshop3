import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { WebhookEvent } from '@/types/webhook';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/webhooks/events - List webhook events
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    let sql = 'SELECT * FROM webhook_events WHERE store_id = $1';
    const params: any[] = [user.store_id];

    if (status) {
      sql += ' AND status = $2';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const events = await query<WebhookEvent>(sql, params);

    return NextResponse.json({ events });
  } catch (error: any) {
    console.error('Error fetching webhook events:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch webhook events' },
      { status: 500 }
    );
  }
}

