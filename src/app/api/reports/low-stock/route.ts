import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const threshold = 10; // Default low stock threshold

    // Get low stock products
    const productData = await query<{
      product_id: number;
      variant_id: number;
      product_title: string;
      variant_title: string;
      sku: string;
      quantity: string;
      price: string;
    }>(`
      SELECT 
        p.id as product_id,
        pv.id as variant_id,
        p.title as product_title,
        pv.title as variant_title,
        pv.sku,
        pv.inventory_quantity as quantity,
        pv.price
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      WHERE p.store_id = $1
        AND pv.inventory_quantity IS NOT NULL
        AND pv.inventory_quantity <= $2
        AND pv.inventory_quantity >= 0
      ORDER BY pv.inventory_quantity ASC
      LIMIT 100
    `, [user.store_id, threshold]);

    // Get sales velocity for each product (last 30 days)
    const salesData = await query<{
      product_id: number;
      avg_daily_sales: string;
    }>(`
      SELECT 
        oli.product_id,
        SUM(oli.quantity) / 30.0 as avg_daily_sales
      FROM order_line_items oli
      JOIN orders o ON o.id = oli.order_id
      WHERE o.store_id = $1
        AND o.created_at >= NOW() - INTERVAL '30 days'
        AND o.financial_status IN ('paid', 'partially_paid', 'authorized')
      GROUP BY oli.product_id
    `, [user.store_id]);

    const salesMap: Record<number, number> = {};
    salesData.forEach(s => {
      salesMap[s.product_id] = parseFloat(s.avg_daily_sales) || 0;
    });

    const products = productData.map(p => {
      const quantity = parseInt(p.quantity) || 0;
      const avgDailySales = salesMap[p.product_id] || 0;
      const daysOfStock = avgDailySales > 0 ? Math.floor(quantity / avgDailySales) : 0;
      return {
        product_id: p.product_id,
        variant_id: p.variant_id,
        product_title: p.product_title,
        variant_title: p.variant_title,
        sku: p.sku || '',
        quantity,
        reorder_point: threshold,
        days_of_stock: daysOfStock,
        avg_daily_sales: avgDailySales,
      };
    });

    const stats = {
      low_stock_count: products.length,
      critical_count: products.filter(p => p.quantity <= threshold / 2).length,
      total_value_at_risk: 0, // Would need price data to calculate
    };

    return NextResponse.json({ products, stats });
  } catch (error: any) {
    console.error('Error fetching low stock:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}

