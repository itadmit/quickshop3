import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/orders/unread-count - Get count of unread orders
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;

    // Count unread orders
    const result = await queryOne<{ count: string }>(
      'SELECT COUNT(*)::text as count FROM orders WHERE store_id = $1 AND (is_read IS NULL OR is_read = false)',
      [storeId]
    );

    const count = parseInt(result?.count || '0', 10);

    return NextResponse.json({
      count,
    });
  } catch (error: any) {
    console.error('Error fetching unread orders count:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch unread orders count' },
      { status: 500 }
    );
  }
}

