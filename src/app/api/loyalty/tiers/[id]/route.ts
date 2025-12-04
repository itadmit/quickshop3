import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { CustomerLoyaltyTier } from '@/types/loyalty';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/loyalty/tiers/:id - Get tier details
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
    const tierId = parseInt(id);
    const tier = await queryOne<CustomerLoyaltyTier>(
      'SELECT * FROM customer_loyalty_tiers WHERE id = $1 AND store_id = $2',
      [tierId, user.store_id]
    );

    if (!tier) {
      return NextResponse.json({ error: 'Tier not found' }, { status: 404 });
    }

    return NextResponse.json({ tier });
  } catch (error: any) {
    console.error('Error fetching tier:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tier' },
      { status: 500 }
    );
  }
}

// PUT /api/loyalty/tiers/:id - Update tier
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const tierId = parseInt(id);
    const body = await request.json();
    const { name, tier_level, min_points, discount_percentage, benefits } = body;

    if (!name || tier_level === undefined) {
      return NextResponse.json(
        { error: 'name and tier_level are required' },
        { status: 400 }
      );
    }

    const tier = await queryOne<CustomerLoyaltyTier>(
      `UPDATE customer_loyalty_tiers 
       SET name = $1, tier_level = $2, min_points = $3, discount_percentage = $4, 
           benefits = $5, updated_at = now()
       WHERE id = $6 AND store_id = $7
       RETURNING *`,
      [
        name,
        tier_level,
        min_points || 0,
        discount_percentage || '0',
        benefits ? JSON.stringify(benefits) : null,
        tierId,
        user.store_id,
      ]
    );

    if (!tier) {
      return NextResponse.json({ error: 'Tier not found' }, { status: 404 });
    }

    // Emit event
    await eventBus.emitEvent('loyalty.tier.updated', {
      tier: {
        id: tier.id,
        name: tier.name,
        tier_level: tier.tier_level,
      },
    }, {
      store_id: user.store_id,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ tier });
  } catch (error: any) {
    console.error('Error updating tier:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update tier' },
      { status: 500 }
    );
  }
}

// DELETE /api/loyalty/tiers/:id - Delete tier
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const tierId = parseInt(id);

    // Get tier before deletion for event
    const tier = await queryOne<CustomerLoyaltyTier>(
      'SELECT * FROM customer_loyalty_tiers WHERE id = $1 AND store_id = $2',
      [tierId, user.store_id]
    );

    if (!tier) {
      return NextResponse.json({ error: 'Tier not found' }, { status: 404 });
    }

    await query(
      'DELETE FROM customer_loyalty_tiers WHERE id = $1 AND store_id = $2',
      [tierId, user.store_id]
    );

    // Emit event
    await eventBus.emitEvent('loyalty.tier.deleted', {
      tier_id: tierId,
    }, {
      store_id: user.store_id,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting tier:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete tier' },
      { status: 500 }
    );
  }
}

