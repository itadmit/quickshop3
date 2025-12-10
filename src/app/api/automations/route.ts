import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// GET /api/automations - Get all automations for store
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;

    const automations = await query<{
      id: number;
      name: string;
      description: string | null;
      trigger_type: string;
      trigger_conditions: any;
      actions: any;
      is_active: boolean;
      run_count: number;
      last_run_at: Date | null;
      created_at: Date;
      updated_at: Date;
      run_count_total: number;
    }>(
      `SELECT 
        a.*,
        COUNT(ar.id)::int as run_count_total
       FROM automations a
       LEFT JOIN automation_runs ar ON ar.automation_id = a.id
       WHERE a.store_id = $1
       GROUP BY a.id
       ORDER BY a.created_at DESC`,
      [storeId]
    );

    return NextResponse.json(automations);
  } catch (error: any) {
    console.error('Error fetching automations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch automations' },
      { status: 500 }
    );
  }
}

// POST /api/automations - Create new automation
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      trigger_type,
      trigger_conditions,
      actions,
      conditions,
      is_active = true,
    } = body;

    if (!name || !trigger_type || !actions || !Array.isArray(actions) || actions.length === 0) {
      return NextResponse.json(
        { error: 'name, trigger_type, and actions are required' },
        { status: 400 }
      );
    }

    const storeId = user.store_id;

    // שמירת conditions ב-trigger_conditions אם קיימים
    const finalTriggerConditions = conditions && conditions.length > 0 ? conditions : trigger_conditions || null;

    const automation = await queryOne<{
      id: number;
      name: string;
      description: string | null;
      trigger_type: string;
      trigger_conditions: any;
      actions: any;
      is_active: boolean;
      created_at: Date;
    }>(
      `INSERT INTO automations (
        store_id, name, description, trigger_type, trigger_conditions, actions, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())
      RETURNING id, name, description, trigger_type, trigger_conditions, actions, is_active, created_at`,
      [
        storeId,
        name,
        description || null,
        trigger_type,
        finalTriggerConditions ? JSON.stringify(finalTriggerConditions) : null,
        JSON.stringify(actions),
        is_active,
      ]
    );

    if (!automation) {
      throw new Error('Failed to create automation');
    }

    return NextResponse.json(automation, { status: 201 });
  } catch (error: any) {
    console.error('Error creating automation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create automation' },
      { status: 500 }
    );
  }
}

