import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/products/:id/size-charts - List size charts linked to a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productId = parseInt(id);
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const storeId = user.store_id;

    // Verify product belongs to store
    const product = await queryOne<{ id: number; store_id: number }>(
      'SELECT id, store_id FROM products WHERE id = $1',
      [productId]
    );

    if (!product || product.store_id !== storeId) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Fetch linked size charts
    const sizeCharts = await query(
      `SELECT sc.*
       FROM product_size_chart_map pscm
       INNER JOIN size_charts sc ON sc.id = pscm.size_chart_id
       WHERE pscm.product_id = $1 AND sc.store_id = $2
       ORDER BY sc.name ASC`,
      [productId, storeId]
    );

    // Parse chart_data if needed
    const parsedCharts = sizeCharts.map((chart: any) => ({
      ...chart,
      chart_data:
        typeof chart.chart_data === 'string'
          ? JSON.parse(chart.chart_data)
          : chart.chart_data,
    }));

    return NextResponse.json({ size_charts: parsedCharts });
  } catch (error: any) {
    console.error('Error fetching product size charts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product size charts' },
      { status: 500 }
    );
  }
}

// POST /api/products/:id/size-charts - Link product to size chart
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productId = parseInt(id);
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const body = await request.json();
    const { size_chart_id } = body;

    if (!size_chart_id) {
      return NextResponse.json({ error: 'size_chart_id is required' }, { status: 400 });
    }

    const storeId = user.store_id;

    // Verify product belongs to store
    const product = await queryOne<{ id: number; store_id: number }>(
      'SELECT id, store_id FROM products WHERE id = $1',
      [productId]
    );

    if (!product || product.store_id !== storeId) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Verify size chart belongs to store
    const sizeChart = await queryOne<{ id: number; store_id: number }>(
      'SELECT id, store_id FROM size_charts WHERE id = $1',
      [size_chart_id]
    );

    if (!sizeChart || sizeChart.store_id !== storeId) {
      return NextResponse.json({ error: 'Size chart not found' }, { status: 404 });
    }

    // Check if mapping already exists
    const existing = await queryOne<{ product_id: number }>(
      'SELECT product_id FROM product_size_chart_map WHERE product_id = $1 AND size_chart_id = $2',
      [productId, size_chart_id]
    );

    if (existing) {
      return NextResponse.json({ 
        success: true, 
        message: 'Product already linked to this size chart' 
      });
    }

    // Link product to size chart
    await query(
      'INSERT INTO product_size_chart_map (product_id, size_chart_id) VALUES ($1, $2)',
      [productId, size_chart_id]
    );

    // Emit event
    await eventBus.emitEvent('product.size_chart.linked', {
      product_id: productId,
      size_chart_id: size_chart_id,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ 
      success: true,
      message: 'Size chart linked to product successfully' 
    });
  } catch (error: any) {
    console.error('Error linking size chart to product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to link size chart to product' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/:id/size-charts - Unlink product from size chart
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
    const productId = parseInt(id);
    
    // Get chart ID from query string or body (support both chart_id and size_chart_id for compatibility)
    const url = new URL(request.url);
    const queryChartId = url.searchParams.get('chart_id') || url.searchParams.get('size_chart_id');
    const body = request.method === 'DELETE' ? await request.json().catch(() => null) : null;
    const bodyChartId = body?.chart_id ?? body?.size_chart_id;
    const chartIdParam = queryChartId ?? bodyChartId;
    const chartId = chartIdParam ? parseInt(chartIdParam) : NaN;

    if (isNaN(productId) || isNaN(chartId)) {
      return NextResponse.json({ error: 'Invalid product or size chart ID' }, { status: 400 });
    }

    const storeId = user.store_id;

    // Verify product belongs to store
    const product = await queryOne<{ id: number; store_id: number }>(
      'SELECT id, store_id FROM products WHERE id = $1',
      [productId]
    );

    if (!product || product.store_id !== storeId) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Unlink product from size chart
    await query(
      'DELETE FROM product_size_chart_map WHERE product_id = $1 AND size_chart_id = $2',
      [productId, chartId]
    );

    // Emit event
    await eventBus.emitEvent('product.size_chart.unlinked', {
      product_id: productId,
      size_chart_id: chartId,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ 
      success: true,
      message: 'Size chart unlinked from product successfully' 
    });
  } catch (error: any) {
    console.error('Error unlinking size chart from product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to unlink size chart from product' },
      { status: 500 }
    );
  }
}

