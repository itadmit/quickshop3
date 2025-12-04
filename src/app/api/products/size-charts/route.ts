import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/products/size-charts - Get all size charts for a store
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    let sql = 'SELECT * FROM size_charts WHERE store_id = $1';
    const params: any[] = [storeId];

    if (search) {
      sql += ' AND name ILIKE $2';
      params.push(`%${search}%`);
    }

    sql += ' ORDER BY name ASC';

    const sizeCharts = await query(sql, params);

    return NextResponse.json({ size_charts: sizeCharts });
  } catch (error: any) {
    console.error('Error fetching size charts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch size charts' },
      { status: 500 }
    );
  }
}

// POST /api/products/size-charts - Create a new size chart
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, chart_type, chart_data } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Size chart name is required' }, { status: 400 });
    }

    if (!chart_type) {
      return NextResponse.json({ error: 'chart_type is required' }, { status: 400 });
    }

    const storeId = user.store_id;

    // Create size chart
    const sizeChart = await queryOne<{
      id: number;
      name: string;
      chart_type: string;
      chart_data: any;
    }>(
      `INSERT INTO size_charts (store_id, name, chart_type, chart_data, created_at, updated_at)
       VALUES ($1, $2, $3, $4, now(), now())
       RETURNING id, name, chart_type, chart_data`,
      [
        storeId,
        name.trim(),
        chart_type,
        chart_data ? JSON.stringify(chart_data) : null,
      ]
    );

    if (!sizeChart) {
      throw new Error('Failed to create size chart');
    }

    // Parse chart_data if it's a string
    const parsedChart = {
      ...sizeChart,
      chart_data: typeof sizeChart.chart_data === 'string' 
        ? JSON.parse(sizeChart.chart_data) 
        : sizeChart.chart_data,
    };

    // Emit event
    await eventBus.emitEvent('product.size_chart.created', {
      size_chart: {
        id: parsedChart.id,
        name: parsedChart.name,
        chart_type: parsedChart.chart_type,
      },
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ size_chart: parsedChart }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating size chart:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create size chart' },
      { status: 500 }
    );
  }
}

