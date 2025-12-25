import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const start_date = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end_date = searchParams.get('end_date') || new Date().toISOString().split('T')[0];

    const categoryData = await query<{
      category_id: number;
      category_name: string;
      category_handle: string;
      products_count: string;
      quantity_sold: string;
      orders_count: string;
      revenue: string;
    }>(`
      SELECT 
        c.id as category_id,
        c.title as category_name,
        c.handle as category_handle,
        COUNT(DISTINCT p.id) as products_count,
        COALESCE(SUM(oli.quantity), 0) as quantity_sold,
        COUNT(DISTINCT oli.order_id) as orders_count,
        COALESCE(SUM(oli.quantity * oli.price), 0) as revenue
      FROM product_collections c
      LEFT JOIN product_collection_map pcm ON pcm.collection_id = c.id
      LEFT JOIN products p ON p.id = pcm.product_id
      LEFT JOIN order_line_items oli ON oli.product_id = p.id
      LEFT JOIN orders o ON o.id = oli.order_id 
        AND o.created_at >= $2 
        AND o.created_at <= $3::date + interval '1 day'
        AND o.financial_status IN ('paid', 'partially_paid', 'authorized')
      WHERE c.store_id = $1
      GROUP BY c.id, c.title, c.handle
      ORDER BY revenue DESC
    `, [user.store_id, start_date, end_date]);

    const categories = categoryData.map(c => ({
      category_id: c.category_id,
      category_name: c.category_name,
      category_handle: c.category_handle,
      products_count: parseInt(c.products_count) || 0,
      quantity_sold: parseInt(c.quantity_sold) || 0,
      orders_count: parseInt(c.orders_count) || 0,
      revenue: parseFloat(c.revenue) || 0,
      avg_order_value: parseInt(c.orders_count) > 0 ? parseFloat(c.revenue) / parseInt(c.orders_count) : 0,
    }));

    const totals = {
      total_revenue: categories.reduce((acc, c) => acc + c.revenue, 0),
      total_orders: categories.reduce((acc, c) => acc + c.orders_count, 0),
      total_quantity: categories.reduce((acc, c) => acc + c.quantity_sold, 0),
    };

    return NextResponse.json({ categories, totals, period: { start_date, end_date } });
  } catch (error: any) {
    console.error('Error fetching sales by category:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}

