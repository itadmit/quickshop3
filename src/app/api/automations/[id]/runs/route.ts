import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/automations/[id]/runs - Get automation runs history
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
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // בדיקה שהאוטומציה קיימת ושייכת לחנות
    const automation = await query<{ id: number }>(
      `SELECT id FROM automations WHERE id = $1 AND store_id = $2`,
      [id, storeId]
    );

    if (!automation || automation.length === 0) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    const runs = await query<{
      id: number;
      automation_id: number;
      trigger_event_id: number | null;
      status: string;
      result: any;
      error_message: string | null;
      started_at: Date;
      completed_at: Date | null;
    }>(
      `SELECT * FROM automation_runs 
       WHERE automation_id = $1
       ORDER BY started_at DESC
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    const total = await query<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM automation_runs WHERE automation_id = $1`,
      [id]
    );

    return NextResponse.json({
      runs,
      total: parseInt(total[0]?.count || '0'),
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Error fetching automation runs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch automation runs' },
      { status: 500 }
    );
  }
}

