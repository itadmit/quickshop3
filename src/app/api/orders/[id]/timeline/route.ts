import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/orders/:id/timeline - Get order timeline events
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderId = parseInt(id);

    // Get events from system_logs related to this order
    const events = await query<{
      id: number;
      event_type: string;
      message: string;
      created_at: Date;
      user_id: number | null;
    }>(
      `SELECT 
        id,
        source as event_type,
        message,
        created_at,
        user_id
      FROM system_logs
      WHERE store_id = $1 
        AND message LIKE $2
      ORDER BY created_at DESC
      LIMIT 50`,
      [user.store_id, `%order_id:${orderId}%`]
    );

    return NextResponse.json({ events });
  } catch (error: any) {
    console.error('Error fetching timeline:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch timeline' },
      { status: 500 }
    );
  }
}

