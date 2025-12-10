import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// GET /api/automations/[id] - Get single automation
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
    const storeId = user.store_id;

    const automation = await queryOne<{
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
    }>(
      `SELECT * FROM automations 
       WHERE id = $1 AND store_id = $2`,
      [id, storeId]
    );

    if (!automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    return NextResponse.json(automation);
  } catch (error: any) {
    console.error('Error fetching automation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch automation' },
      { status: 500 }
    );
  }
}

// PUT /api/automations/[id] - Update automation
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
    const body = await request.json();
    const storeId = user.store_id;

    // בדיקה שהאוטומציה קיימת ושייכת לחנות
    const existing = await queryOne<{ id: number }>(
      `SELECT id FROM automations WHERE id = $1 AND store_id = $2`,
      [id, storeId]
    );

    if (!existing) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    // בניית שאילתת עדכון דינמית
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (body.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(body.name);
    }

    if (body.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(body.description || null);
    }

    if (body.trigger_type !== undefined) {
      updates.push(`trigger_type = $${paramIndex++}`);
      values.push(body.trigger_type);
    }

    if (body.trigger_conditions !== undefined || body.conditions !== undefined) {
      const conditions = body.conditions || body.trigger_conditions;
      updates.push(`trigger_conditions = $${paramIndex++}`);
      values.push(conditions ? JSON.stringify(conditions) : null);
    }

    if (body.actions !== undefined) {
      updates.push(`actions = $${paramIndex++}`);
      values.push(JSON.stringify(body.actions));
    }

    if (body.is_active !== undefined || body.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(body.is_active !== undefined ? body.is_active : body.isActive);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push(`updated_at = now()`);
    values.push(id, storeId);

    const automation = await queryOne<{
      id: number;
      name: string;
      description: string | null;
      trigger_type: string;
      trigger_conditions: any;
      actions: any;
      is_active: boolean;
      updated_at: Date;
    }>(
      `UPDATE automations 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND store_id = $${paramIndex++}
       RETURNING id, name, description, trigger_type, trigger_conditions, actions, is_active, updated_at`,
      values
    );

    if (!automation) {
      throw new Error('Failed to update automation');
    }

    return NextResponse.json(automation);
  } catch (error: any) {
    console.error('Error updating automation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update automation' },
      { status: 500 }
    );
  }
}

// DELETE /api/automations/[id] - Delete automation
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
    const storeId = user.store_id;

    // בדיקה שהאוטומציה קיימת ושייכת לחנות
    const existing = await queryOne<{ id: number }>(
      `SELECT id FROM automations WHERE id = $1 AND store_id = $2`,
      [id, storeId]
    );

    if (!existing) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    await query(
      `DELETE FROM automations WHERE id = $1 AND store_id = $2`,
      [id, storeId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting automation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete automation' },
      { status: 500 }
    );
  }
}

