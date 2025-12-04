import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { CustomerLoyaltyTier, CreateLoyaltyTierRequest } from '@/types/loyalty';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/loyalty/tiers - List all loyalty tiers
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tiers = await query<CustomerLoyaltyTier>(
      'SELECT * FROM customer_loyalty_tiers WHERE store_id = $1 ORDER BY tier_level ASC',
      [user.store_id]
    );

    return NextResponse.json({ tiers });
  } catch (error: any) {
    console.error('Error fetching loyalty tiers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch loyalty tiers' },
      { status: 500 }
    );
  }
}

// POST /api/loyalty/tiers - Create loyalty tier
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateLoyaltyTierRequest = await request.json();
    const storeId = user.store_id;

    if (!body.name || body.tier_level === undefined) {
      return NextResponse.json({ error: 'Name and tier_level are required' }, { status: 400 });
    }

    const tier = await queryOne<CustomerLoyaltyTier>(
      `INSERT INTO customer_loyalty_tiers (
        store_id, name, tier_level, min_points, discount_percentage, benefits,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, now(), now())
      RETURNING *`,
      [
        storeId,
        body.name,
        body.tier_level,
        body.min_points || 0,
        body.discount_percentage || '0',
        body.benefits ? JSON.stringify(body.benefits) : null,
      ]
    );

    if (!tier) {
      throw new Error('Failed to create loyalty tier');
    }

    // Emit event
    await eventBus.emitEvent('loyalty.tier.created', {
      tier: {
        id: tier.id,
        name: tier.name,
        tier_level: tier.tier_level,
      },
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ tier }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating loyalty tier:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create loyalty tier' },
      { status: 500 }
    );
  }
}

