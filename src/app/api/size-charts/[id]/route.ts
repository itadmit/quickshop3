import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/size-charts/[id] - Get single size chart
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
    const chartId = parseInt(id);
    const storeId = user.store_id;

    if (isNaN(chartId)) {
      return NextResponse.json({ error: 'Invalid size chart ID' }, { status: 400 });
    }

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
      `SELECT id, store_id, name, chart_type, chart_data, image_url, description,
              scope, category_ids, position, created_at, updated_at
       FROM size_charts
       WHERE id = $1 AND store_id = $2`,
      [chartId, storeId]
    );

    if (!sizeChart) {
      return NextResponse.json(
        { error: 'Size chart not found' },
        { status: 404 }
      );
    }

    // Parse chart_data
    const parsedChart = {
      ...sizeChart,
      chart_data:
        typeof sizeChart.chart_data === 'string'
          ? JSON.parse(sizeChart.chart_data)
          : sizeChart.chart_data,
    };

    return NextResponse.json(parsedChart);
  } catch (error: any) {
    console.error('Error fetching size chart:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch size chart' },
      { status: 500 }
    );
  }
}

// PUT /api/size-charts/[id] - Update size chart
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
    const chartId = parseInt(id);
    const storeId = user.store_id;

    if (isNaN(chartId)) {
      return NextResponse.json({ error: 'Invalid size chart ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      chart_type,
      chart_data,
      image_url,
      description,
      scope,
      category_ids,
      position,
    } = body;

    // Check if chart exists
    const existing = await queryOne<{ id: number; scope: string }>(
      'SELECT id, scope FROM size_charts WHERE id = $1 AND store_id = $2',
      [chartId, storeId]
    );

    if (!existing) {
      return NextResponse.json(
        { error: 'Size chart not found' },
        { status: 404 }
      );
    }

    // Validate scope if provided
    if (scope && scope !== 'GLOBAL' && scope !== 'CATEGORY') {
      return NextResponse.json(
        { error: 'scope must be GLOBAL or CATEGORY' },
        { status: 400 }
      );
    }

    // Validate category_ids if scope is CATEGORY
    const finalScope = scope || existing.scope;
    if (finalScope === 'CATEGORY' && category_ids !== undefined) {
      if (!Array.isArray(category_ids) || category_ids.length === 0) {
        return NextResponse.json(
          { error: 'category_ids is required when scope is CATEGORY' },
          { status: 400 }
        );
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(name.trim());
    }

    if (chart_type !== undefined) {
      updates.push(`chart_type = $${paramIndex++}`);
      params.push(chart_type);
    }

    if (chart_data !== undefined) {
      updates.push(`chart_data = $${paramIndex++}`);
      params.push(JSON.stringify(chart_data));
    }

    if (image_url !== undefined) {
      updates.push(`image_url = $${paramIndex++}`);
      params.push(image_url || null);
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(description || null);
    }

    if (scope !== undefined) {
      updates.push(`scope = $${paramIndex++}`);
      params.push(scope);
    }

    if (category_ids !== undefined) {
      updates.push(`category_ids = $${paramIndex++}`);
      params.push(category_ids);
    }

    if (position !== undefined) {
      updates.push(`position = $${paramIndex++}`);
      params.push(position);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    updates.push(`updated_at = now()`);
    params.push(chartId, storeId);

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
      `UPDATE size_charts
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1}
       RETURNING *`,
      params
    );

    // Parse chart_data
    const parsedChart = {
      ...sizeChart,
      chart_data:
        typeof sizeChart.chart_data === 'string'
          ? JSON.parse(sizeChart.chart_data)
          : sizeChart.chart_data,
    };

    return NextResponse.json(parsedChart);
  } catch (error: any) {
    console.error('Error updating size chart:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update size chart' },
      { status: 500 }
    );
  }
}

// DELETE /api/size-charts/[id] - Delete size chart
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
    const chartId = parseInt(id);
    const storeId = user.store_id;

    if (isNaN(chartId)) {
      return NextResponse.json({ error: 'Invalid size chart ID' }, { status: 400 });
    }

    // Check if chart exists
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM size_charts WHERE id = $1 AND store_id = $2',
      [chartId, storeId]
    );

    if (!existing) {
      return NextResponse.json(
        { error: 'Size chart not found' },
        { status: 404 }
      );
    }

    // Count how many products use this chart
    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM product_size_chart_map
       WHERE size_chart_id = $1`,
      [chartId]
    );

    const productsCount = parseInt(countResult?.count || '0');

    // Delete chart (product_size_chart_map will be cascade deleted)
    await query(
      'DELETE FROM size_charts WHERE id = $1 AND store_id = $2',
      [chartId, storeId]
    );

    return NextResponse.json({
      message: 'Size chart deleted successfully',
      deletedProducts: productsCount,
    });
  } catch (error: any) {
    console.error('Error deleting size chart:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete size chart' },
      { status: 500 }
    );
  }
}

