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
    const sort_by = searchParams.get('sort_by') || 'revenue';

    // Calculate period length for previous period comparison
    const startD = new Date(start_date);
    const endD = new Date(end_date);
    const periodDays = Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24));
    const prevStart = new Date(startD.getTime() - periodDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const prevEnd = start_date;

    // Current period data
    const currentData = await query<{
      product_id: number;
      product_title: string;
      product_image: string | null;
      quantity_sold: string;
      orders_count: string;
      revenue: string;
    }>(`
      SELECT 
        p.id as product_id,
        p.title as product_title,
        (SELECT pi.src FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) as product_image,
        SUM(oli.quantity) as quantity_sold,
        COUNT(DISTINCT oli.order_id) as orders_count,
        SUM(oli.quantity * oli.price) as revenue
      FROM order_line_items oli
      JOIN products p ON p.id = oli.product_id
      JOIN orders o ON o.id = oli.order_id
      WHERE o.store_id = $1
        AND o.created_at >= $2
        AND o.created_at <= $3::date + interval '1 day'
        AND o.financial_status IN ('paid', 'partially_paid', 'authorized')
      GROUP BY p.id, p.title
      ORDER BY revenue DESC
      LIMIT 100
    `, [user.store_id, start_date, end_date]);

    // Previous period data
    const prevData = await query<{
      product_id: number;
      quantity_sold: string;
      revenue: string;
    }>(`
      SELECT 
        p.id as product_id,
        SUM(oli.quantity) as quantity_sold,
        SUM(oli.quantity * oli.price) as revenue
      FROM order_line_items oli
      JOIN products p ON p.id = oli.product_id
      JOIN orders o ON o.id = oli.order_id
      WHERE o.store_id = $1
        AND o.created_at >= $2
        AND o.created_at < $3
        AND o.financial_status IN ('paid', 'partially_paid', 'authorized')
      GROUP BY p.id
    `, [user.store_id, prevStart, prevEnd]);

    const prevMap: Record<number, { quantity: number; revenue: number }> = {};
    prevData.forEach(p => {
      prevMap[p.product_id] = {
        quantity: parseInt(p.quantity_sold) || 0,
        revenue: parseFloat(p.revenue) || 0,
      };
    });

    let products = currentData.map(p => {
      const currentRevenue = parseFloat(p.revenue) || 0;
      const currentQuantity = parseInt(p.quantity_sold) || 0;
      const prev = prevMap[p.product_id] || { quantity: 0, revenue: 0 };
      const changePercent = prev.revenue > 0 ? ((currentRevenue - prev.revenue) / prev.revenue) * 100 : (currentRevenue > 0 ? 100 : 0);

      return {
        product_id: p.product_id,
        product_title: p.product_title,
        product_image: p.product_image,
        current_revenue: currentRevenue,
        previous_revenue: prev.revenue,
        change_percent: changePercent,
        current_quantity: currentQuantity,
        previous_quantity: prev.quantity,
        orders_count: parseInt(p.orders_count) || 0,
        views: 0,
        conversion_rate: 0,
      };
    });

    // Sort
    if (sort_by === 'quantity') {
      products = products.sort((a, b) => b.current_quantity - a.current_quantity);
    } else if (sort_by === 'growth') {
      products = products.sort((a, b) => b.change_percent - a.change_percent);
    }

    const stats = {
      total_products: products.length,
      growing: products.filter(p => p.change_percent > 0).length,
      declining: products.filter(p => p.change_percent < 0).length,
    };

    return NextResponse.json({ products, stats, period: { start_date, end_date } });
  } catch (error: any) {
    console.error('Error fetching product performance:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}

