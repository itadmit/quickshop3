import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { LoyaltyProgramRule, CreateLoyaltyRuleRequest } from '@/types/loyalty';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/loyalty/rules - List all loyalty rules
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const isActive = searchParams.get('is_active');

    let sql = 'SELECT * FROM loyalty_program_rules WHERE store_id = $1';
    const params: any[] = [user.store_id];

    if (isActive !== null) {
      sql += ' AND is_active = $2';
      params.push(isActive === 'true');
    }

    sql += ' ORDER BY created_at DESC';

    const rules = await query<LoyaltyProgramRule>(sql, params);

    return NextResponse.json({ rules });
  } catch (error: any) {
    console.error('Error fetching loyalty rules:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch loyalty rules' },
      { status: 500 }
    );
  }
}

// POST /api/loyalty/rules - Create loyalty rule
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateLoyaltyRuleRequest = await request.json();
    const storeId = user.store_id;

    if (!body.name || !body.rule_type || body.points_amount === undefined) {
      return NextResponse.json({ error: 'Name, rule_type, and points_amount are required' }, { status: 400 });
    }

    const rule = await queryOne<LoyaltyProgramRule>(
      `INSERT INTO loyalty_program_rules (
        store_id, name, rule_type, points_amount, conditions, is_active,
        starts_at, ends_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
      RETURNING *`,
      [
        storeId,
        body.name,
        body.rule_type,
        body.points_amount,
        body.conditions ? JSON.stringify(body.conditions) : null,
        body.is_active !== undefined ? body.is_active : true,
        body.starts_at || null,
        body.ends_at || null,
      ]
    );

    if (!rule) {
      throw new Error('Failed to create loyalty rule');
    }

    // Emit event
    await eventBus.emitEvent('loyalty.rule.created', {
      rule: {
        id: rule.id,
        name: rule.name,
        rule_type: rule.rule_type,
        points_amount: rule.points_amount,
      },
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating loyalty rule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create loyalty rule' },
      { status: 500 }
    );
  }
}

