import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get sold out products (quantity = 0)
    const productData = await query<{
      product_id: number;
      variant_id: number;
      product_title: string;
      variant_title: string;
      sku: string;
      price: string;
    }>(`
      SELECT 
        p.id as product_id,
        pv.id as variant_id,
        p.title as product_title,
        pv.title as variant_title,
        pv.sku,
        pv.price
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      WHERE p.store_id = $1
        AND (pv.inventory_quantity IS NULL OR pv.inventory_quantity <= 0)
        AND p.status = 'active'
      ORDER BY p.title
      LIMIT 100
    `, [user.store_id]);

    // Get sales velocity to estimate lost revenue
    const salesData = await query<{
      product_id: number;
      avg_daily_revenue: string;
    }>(`
      SELECT 
        oli.product_id,
        SUM(oli.quantity * oli.price) / 30.0 as avg_daily_revenue
      FROM order_line_items oli
      JOIN orders o ON o.id = oli.order_id
      WHERE o.store_id = $1
        AND o.created_at >= NOW() - INTERVAL '60 days'
        AND o.created_at < NOW() - INTERVAL '30 days'
        AND o.financial_status IN ('paid', 'partially_paid', 'authorized')
      GROUP BY oli.product_id
    `, [user.store_id]);

    const salesMap: Record<number, number> = {};
    salesData.forEach(s => {
      salesMap[s.product_id] = parseFloat(s.avg_daily_revenue) || 0;
    });

    const products = productData.map(p => {
      const avgDailyRevenue = salesMap[p.product_id] || 0;
      const daysSoldOut = 7; // Assume average 7 days
      return {
        product_id: p.product_id,
        variant_id: p.variant_id,
        product_title: p.product_title,
        variant_title: p.variant_title,
        sku: p.sku || '',
        sold_out_date: '',
        days_sold_out: daysSoldOut,
        lost_revenue_estimate: avgDailyRevenue * daysSoldOut,
      };
    });

    const uniqueProducts = new Set(products.map(p => p.product_id));
    const totalLostRevenue = products.reduce((acc, p) => acc + p.lost_revenue_estimate, 0);

    const stats = {
      total_sold_out: products.length,
      products_sold_out: uniqueProducts.size,
      estimated_lost_revenue: totalLostRevenue,
    };

    return NextResponse.json({ products, stats });
  } catch (error: any) {
    console.error('Error fetching sold out products:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}

