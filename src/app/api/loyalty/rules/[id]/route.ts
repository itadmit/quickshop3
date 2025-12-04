import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { LoyaltyProgramRule } from '@/types/loyalty';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/loyalty/rules/:id - Get rule details
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
    const ruleId = parseInt(id);
    const rule = await queryOne<LoyaltyProgramRule>(
      'SELECT * FROM loyalty_program_rules WHERE id = $1 AND store_id = $2',
      [ruleId, user.store_id]
    );

    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    return NextResponse.json({ rule });
  } catch (error: any) {
    console.error('Error fetching rule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch rule' },
      { status: 500 }
    );
  }
}

// PUT /api/loyalty/rules/:id - Update rule
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
    const ruleId = parseInt(id);
    const body = await request.json();
    const { name, rule_type, points_amount, is_active } = body;

    if (!name || !rule_type || points_amount === undefined) {
      return NextResponse.json(
        { error: 'name, rule_type, and points_amount are required' },
        { status: 400 }
      );
    }

    const rule = await queryOne<LoyaltyProgramRule>(
      `UPDATE loyalty_program_rules 
       SET name = $1, rule_type = $2, points_amount = $3, is_active = $4, updated_at = now()
       WHERE id = $5 AND store_id = $6
       RETURNING *`,
      [name, rule_type, points_amount, is_active !== undefined ? is_active : true, ruleId, user.store_id]
    );

    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    // Emit event
    await eventBus.emitEvent('loyalty.rule.updated', {
      rule: {
        id: rule.id,
        name: rule.name,
        rule_type: rule.rule_type,
      },
    }, {
      store_id: user.store_id,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ rule });
  } catch (error: any) {
    console.error('Error updating rule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update rule' },
      { status: 500 }
    );
  }
}

// DELETE /api/loyalty/rules/:id - Delete rule
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
    const ruleId = parseInt(id);

    // Get rule before deletion for event
    const rule = await queryOne<LoyaltyProgramRule>(
      'SELECT * FROM loyalty_program_rules WHERE id = $1 AND store_id = $2',
      [ruleId, user.store_id]
    );

    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    await query(
      'DELETE FROM loyalty_program_rules WHERE id = $1 AND store_id = $2',
      [ruleId, user.store_id]
    );

    // Emit event
    await eventBus.emitEvent('loyalty.rule.deleted', {
      rule_id: ruleId,
    }, {
      store_id: user.store_id,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting rule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete rule' },
      { status: 500 }
    );
  }
}

