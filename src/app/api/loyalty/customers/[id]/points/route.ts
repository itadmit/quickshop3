import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { CustomerLoyaltyPoints, LoyaltyPointTransaction } from '@/types/loyalty';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/loyalty/customers/:id/points - Get customer loyalty points
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

    const customerId = parseInt(id);

    // Get customer loyalty points
    const loyaltyPoints = await queryOne<CustomerLoyaltyPoints>(
      'SELECT * FROM customer_loyalty_points WHERE customer_id = $1 AND store_id = $2',
      [customerId, user.store_id]
    );

    // Get transactions
    const transactions = loyaltyPoints
      ? await query<LoyaltyPointTransaction>(
          'SELECT * FROM loyalty_point_transactions WHERE loyalty_points_id = $1 ORDER BY created_at DESC LIMIT 50',
          [loyaltyPoints.id]
        )
      : [];

    return NextResponse.json({
      loyalty_points: loyaltyPoints || null,
      transactions,
    });
  } catch (error: any) {
    console.error('Error fetching customer loyalty points:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customer loyalty points' },
      { status: 500 }
    );
  }
}

