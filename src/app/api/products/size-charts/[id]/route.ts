import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/products/size-charts/:id - Get size chart details
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
    if (isNaN(chartId)) {
      return NextResponse.json({ error: 'Invalid size chart ID' }, { status: 400 });
    }

    const storeId = user.store_id;

    const sizeChart = await queryOne<{
      id: number;
      name: string;
      chart_type: string;
      chart_data: any;
    }>(
      'SELECT * FROM size_charts WHERE id = $1 AND store_id = $2',
      [chartId, storeId]
    );

    if (!sizeChart) {
      return NextResponse.json({ error: 'Size chart not found' }, { status: 404 });
    }

    // Parse chart_data if it's a string
    const parsedChart = {
      ...sizeChart,
      chart_data: typeof sizeChart.chart_data === 'string' 
        ? JSON.parse(sizeChart.chart_data) 
        : sizeChart.chart_data,
    };

    return NextResponse.json({ size_chart: parsedChart });
  } catch (error: any) {
    console.error('Error fetching size chart:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch size chart' },
      { status: 500 }
    );
  }
}

// PUT /api/products/size-charts/:id - Update size chart
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
    if (isNaN(chartId)) {
      return NextResponse.json({ error: 'Invalid size chart ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, chart_type, chart_data } = body;

    const storeId = user.store_id;

    // Get old chart for comparison
    const oldChart = await queryOne<{ id: number; store_id: number }>(
      'SELECT id, store_id FROM size_charts WHERE id = $1',
      [chartId]
    );

    if (!oldChart || oldChart.store_id !== storeId) {
      return NextResponse.json({ error: 'Size chart not found' }, { status: 404 });
    }

    // Build dynamic update query - only update fields that were explicitly sent
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if ('name' in body) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(name ? name.trim() : null);
    }
    if ('chart_type' in body) {
      updateFields.push(`chart_type = $${paramIndex++}`);
      values.push(chart_type || null);
    }
    if ('chart_data' in body) {
      updateFields.push(`chart_data = $${paramIndex++}`);
      values.push(chart_data ? JSON.stringify(chart_data) : null);
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updateFields.push('updated_at = now()');
    values.push(chartId, storeId);

    // Update size chart
    const sizeChart = await queryOne<{
      id: number;
      name: string;
      chart_type: string;
      chart_data: any;
    }>(
      `UPDATE size_charts 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1}
       RETURNING id, name, chart_type, chart_data`,
      values
    );

    if (!sizeChart) {
      throw new Error('Failed to update size chart');
    }

    // Parse chart_data if it's a string
    const parsedChart = {
      ...sizeChart,
      chart_data: typeof sizeChart.chart_data === 'string' 
        ? JSON.parse(sizeChart.chart_data) 
        : sizeChart.chart_data,
    };

    // Emit event
    await eventBus.emitEvent('product.size_chart.updated', {
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

    return NextResponse.json({ size_chart: parsedChart });
  } catch (error: any) {
    console.error('Error updating size chart:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update size chart' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/size-charts/:id - Delete size chart
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
    if (isNaN(chartId)) {
      return NextResponse.json({ error: 'Invalid size chart ID' }, { status: 400 });
    }

    const storeId = user.store_id;

    // Get chart before deletion for event
    const sizeChart = await queryOne<{ id: number; name: string }>(
      'SELECT id, name FROM size_charts WHERE id = $1 AND store_id = $2',
      [chartId, storeId]
    );

    if (!sizeChart) {
      return NextResponse.json({ error: 'Size chart not found' }, { status: 404 });
    }

    // Delete size chart (CASCADE will delete mappings)
    await query(
      'DELETE FROM size_charts WHERE id = $1',
      [chartId]
    );

    // Emit event
    await eventBus.emitEvent('product.size_chart.deleted', {
      size_chart_id: chartId,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ 
      success: true,
      message: 'Size chart deleted successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting size chart:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete size chart' },
      { status: 500 }
    );
  }
}

