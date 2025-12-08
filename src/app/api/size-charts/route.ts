import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/size-charts - Get all size charts for a store (dashboard management)
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope');
    const storeId = user.store_id;

    let sql = `
      SELECT id, store_id, name, chart_type, chart_data, image_url, description,
             scope, category_ids, position, created_at, updated_at
      FROM size_charts
      WHERE store_id = $1
    `;
    const params: any[] = [storeId];
    let paramIndex = 2;

    if (scope) {
      sql += ` AND scope = $${paramIndex}`;
      params.push(scope);
      paramIndex++;
    }

    sql += ` ORDER BY position ASC, created_at ASC`;

    const sizeCharts = await query(sql, params);

    // Parse chart_data if needed
    const parsedCharts = sizeCharts.map((chart: any) => ({
      ...chart,
      chart_data:
        typeof chart.chart_data === 'string'
          ? JSON.parse(chart.chart_data)
          : chart.chart_data,
    }));

    return NextResponse.json(parsedCharts);
  } catch (error: any) {
    console.error('Error fetching size charts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch size charts' },
      { status: 500 }
    );
  }
}

// POST /api/size-charts - Create new size chart
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      chart_type = 'clothing',
      chart_data,
      image_url,
      description,
      scope = 'GLOBAL',
      category_ids = [],
      position = 0,
    } = body;

    const storeId = user.store_id;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    // Validate scope
    if (scope !== 'GLOBAL' && scope !== 'CATEGORY') {
      return NextResponse.json(
        { error: 'scope must be GLOBAL or CATEGORY' },
        { status: 400 }
      );
    }

    // Validate category_ids if scope is CATEGORY
    if (scope === 'CATEGORY' && (!Array.isArray(category_ids) || category_ids.length === 0)) {
      return NextResponse.json(
        { error: 'category_ids is required when scope is CATEGORY' },
        { status: 400 }
      );
    }

    // Create size chart
    const sizeChart = await queryOne<{
      id: number;
      store_id: number;
      name: string;
      chart_type: string;
      chart_data: any;
      image_url: string | null;
      description: string | null;
      scope: string;
      category_ids: number[];
      position: number;
      created_at: Date;
      updated_at: Date;
    }>(
      `INSERT INTO size_charts 
       (store_id, name, chart_type, chart_data, image_url, description, scope, category_ids, position, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())
       RETURNING *`,
      [
        storeId,
        name.trim(),
        chart_type,
        chart_data ? JSON.stringify(chart_data) : '{}',
        image_url || null,
        description || null,
        scope,
        category_ids,
        position,
      ]
    );

    // Parse chart_data
    const parsedChart = {
      ...sizeChart,
      chart_data:
        typeof sizeChart.chart_data === 'string'
          ? JSON.parse(sizeChart.chart_data)
          : sizeChart.chart_data,
    };

    return NextResponse.json(parsedChart, { status: 201 });
  } catch (error: any) {
    console.error('Error creating size chart:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create size chart' },
      { status: 500 }
    );
  }
}

