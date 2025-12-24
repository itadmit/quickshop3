import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/returns/pending-count - Get count of pending returns
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;

    // Count pending returns
    const result = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count 
       FROM returns 
       WHERE store_id = $1 AND status = 'PENDING'`,
      [storeId]
    );

    return NextResponse.json({ count: result?.count || 0 });
  } catch (error: any) {
    console.error('Error fetching pending returns count:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pending returns count' },
      { status: 500 }
    );
  }
}

