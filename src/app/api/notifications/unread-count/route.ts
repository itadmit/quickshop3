import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/notifications/unread-count - Get count of unread notifications
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;
    const userId = user.id;

    // Count unread notifications (for this user or global)
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text as count 
       FROM notifications 
       WHERE store_id = $1 
         AND (user_id = $2 OR user_id IS NULL)
         AND (is_read IS NULL OR is_read = false)`,
      [storeId, userId]
    );

    const count = parseInt(result?.count || '0', 10);

    return NextResponse.json({
      count,
    });
  } catch (error: any) {
    console.error('Error fetching unread notifications count:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch unread notifications count' },
      { status: 500 }
    );
  }
}



