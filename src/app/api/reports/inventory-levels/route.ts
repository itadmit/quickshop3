import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

/**
 * GET /api/reports/inventory-levels
 * דוח מצב מלאי
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // מוצרים עם מלאי
    let statusCondition = '';
    if (status === 'low_stock') {
      statusCondition = 'AND pv.inventory_quantity > 0 AND pv.inventory_quantity <= COALESCE(pv.low_stock_threshold, 5)';
    } else if (status === 'out_of_stock') {
      statusCondition = 'AND pv.inventory_quantity <= 0';
    }

    const inventoryData = await query<{
      product_id: number;
      product_title: string;
      product_image: string | null;
      variant_id: number;
      variant_title: string | null;
      sku: string | null;
      stock_quantity: string;
      low_stock_threshold: string;
      price: string;
    }>(`
      SELECT 
        p.id as product_id,
        p.title as product_title,
        (SELECT pi.src FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) as product_image,
        pv.id as variant_id,
        pv.title as variant_title,
        pv.sku,
        COALESCE(pv.inventory_quantity, 0) as stock_quantity,
        COALESCE(pv.low_stock_threshold, 5) as low_stock_threshold,
        COALESCE(pv.price, p.price, 0) as price
      FROM products p
      JOIN product_variants pv ON pv.product_id = p.id
      WHERE p.store_id = $1
        AND p.status = 'active'
        ${statusCondition}
      ORDER BY pv.inventory_quantity ASC
      LIMIT 100
    `, [user.store_id]);

    // חישוב קצב מכירות (30 ימים אחרונים)
    const salesVelocity = await query<{
      variant_id: number;
      quantity_sold: string;
    }>(`
      SELECT 
        oli.variant_id,
        SUM(oli.quantity) as quantity_sold
      FROM order_line_items oli
      JOIN orders o ON o.id = oli.order_id
      WHERE o.store_id = $1
        AND o.created_at >= NOW() - interval '30 days'
        AND o.financial_status IN ('paid', 'partially_paid', 'authorized')
      GROUP BY oli.variant_id
    `, [user.store_id]);

    const velocityByVariant: Record<number, number> = {};
    salesVelocity.forEach((v) => {
      velocityByVariant[v.variant_id] = parseInt(v.quantity_sold) / 30; // יחידות ליום
    });

    // סטטיסטיקות כלליות
    const statsResult = await queryOne<{
      total_products: string;
      in_stock: string;
      low_stock: string;
      out_of_stock: string;
      total_units: string;
      total_value: string;
    }>(`
      SELECT 
        COUNT(DISTINCT p.id) as total_products,
        COUNT(DISTINCT CASE WHEN pv.inventory_quantity > COALESCE(pv.low_stock_threshold, 5) THEN p.id END) as in_stock,
        COUNT(DISTINCT CASE WHEN pv.inventory_quantity > 0 AND pv.inventory_quantity <= COALESCE(pv.low_stock_threshold, 5) THEN p.id END) as low_stock,
        COUNT(DISTINCT CASE WHEN pv.inventory_quantity <= 0 THEN p.id END) as out_of_stock,
        SUM(GREATEST(pv.inventory_quantity, 0)) as total_units,
        SUM(GREATEST(pv.inventory_quantity, 0) * COALESCE(pv.price, p.price, 0)) as total_value
      FROM products p
      JOIN product_variants pv ON pv.product_id = p.id
      WHERE p.store_id = $1
        AND p.status = 'active'
    `, [user.store_id]);

    const items = inventoryData.map((item) => {
      const stockQty = parseInt(item.stock_quantity);
      const lowThreshold = parseInt(item.low_stock_threshold);
      const velocity = velocityByVariant[item.variant_id] || 0;
      
      let status: 'in_stock' | 'low_stock' | 'out_of_stock';
      if (stockQty <= 0) {
        status = 'out_of_stock';
      } else if (stockQty <= lowThreshold) {
        status = 'low_stock';
      } else {
        status = 'in_stock';
      }

      const daysUntilStockout = velocity > 0 ? Math.floor(stockQty / velocity) : null;

      return {
        product_id: item.product_id,
        product_title: item.product_title,
        product_image: item.product_image,
        sku: item.sku || '',
        variant_title: item.variant_title || '',
        stock_quantity: stockQty,
        low_stock_threshold: lowThreshold,
        status,
        last_sold_at: null,
        sales_velocity: velocity,
        days_until_stockout: daysUntilStockout,
      };
    });

    return NextResponse.json({
      items,
      stats: {
        total_products: parseInt(statsResult?.total_products || '0'),
        in_stock: parseInt(statsResult?.in_stock || '0'),
        low_stock: parseInt(statsResult?.low_stock || '0'),
        out_of_stock: parseInt(statsResult?.out_of_stock || '0'),
        total_inventory_units: parseInt(statsResult?.total_units || '0'),
        total_inventory_value: parseFloat(statsResult?.total_value || '0'),
      },
    });
  } catch (error: any) {
    console.error('Error fetching inventory levels:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}

