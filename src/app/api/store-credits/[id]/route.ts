import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { quickshopItem } from '@/lib/utils/apiFormatter';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/store-credits/:id - Get store credit details
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
    const storeCreditId = parseInt(id);
    const storeId = user.store_id;

    const storeCredit = await queryOne(
      `SELECT * FROM store_credits WHERE id = $1 AND store_id = $2`,
      [storeCreditId, storeId]
    );

    if (!storeCredit) {
      return NextResponse.json({ error: 'Store credit not found' }, { status: 404 });
    }

    // Get transactions
    const transactions = await query(
      `SELECT * FROM store_credit_transactions WHERE store_credit_id = $1 ORDER BY created_at DESC`,
      [storeCreditId]
    );

    return NextResponse.json(quickshopItem('store_credit', {
      ...storeCredit,
      transactions,
    }));
  } catch (error: any) {
    console.error('Error fetching store credit:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch store credit' },
      { status: 500 }
    );
  }
}

