import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

/**
 * GET /api/reports/sales-by-product
 * דוח מכירות לפי מוצר
 */
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

    // מכירות לפי מוצר
    const orderByClause = sort_by === 'quantity' ? 'quantity_sold DESC' : sort_by === 'orders' ? 'orders_count DESC' : 'revenue DESC';

    const productsData = await query<{
      product_id: number;
      product_title: string;
      product_image: string | null;
      variant_count: string;
      quantity_sold: string;
      orders_count: string;
      revenue: string;
      avg_price: string;
    }>(`
      SELECT 
        p.id as product_id,
        p.title as product_title,
        (SELECT pi.src FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) as product_image,
        (SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = p.id) as variant_count,
        SUM(oli.quantity) as quantity_sold,
        COUNT(DISTINCT oli.order_id) as orders_count,
        SUM(oli.quantity * oli.price) as revenue,
        AVG(oli.price) as avg_price
      FROM order_line_items oli
      JOIN products p ON p.id = oli.product_id
      JOIN orders o ON o.id = oli.order_id
      WHERE o.store_id = $1
        AND o.created_at >= $2
        AND o.created_at <= $3::date + interval '1 day'
        AND o.financial_status IN ('paid', 'partially_paid', 'authorized')
      GROUP BY p.id, p.title
      ORDER BY ${orderByClause}
      LIMIT 100
    `, [user.store_id, start_date, end_date]);

    // החזרים לפי מוצר - דרך transactions
    const refundsData = await query<{
      product_id: number;
      refunds: string;
    }>(`
      SELECT 
        oli.product_id,
        SUM(COALESCE(refunds.refund_amount, 0)) as refunds
      FROM order_line_items oli
      JOIN orders o ON o.id = oli.order_id
      LEFT JOIN (
        SELECT 
          t.order_id,
          SUM(t.amount) as refund_amount
        FROM transactions t
        WHERE t.store_id = $1
          AND t.kind = 'refund'
          AND t.status = 'success'
          AND t.created_at >= $2 
          AND t.created_at <= $3::date + interval '1 day'
        GROUP BY t.order_id
      ) refunds ON refunds.order_id = o.id
      WHERE o.store_id = $1
        AND o.created_at >= $2
        AND o.created_at <= $3::date + interval '1 day'
      GROUP BY oli.product_id
    `, [user.store_id, start_date, end_date]);

    const refundsByProduct: Record<number, number> = {};
    refundsData.forEach((r) => {
      refundsByProduct[r.product_id] = parseFloat(r.refunds) || 0;
    });

    // מכירות יומיות
    const dailySales = await query<{
      date: string;
      quantity: string;
      revenue: string;
    }>(`
      SELECT 
        DATE(o.created_at) as date,
        SUM(oli.quantity) as quantity,
        SUM(oli.quantity * oli.price) as revenue
      FROM order_line_items oli
      JOIN orders o ON o.id = oli.order_id
      WHERE o.store_id = $1
        AND o.created_at >= $2
        AND o.created_at <= $3::date + interval '1 day'
        AND o.financial_status IN ('paid', 'partially_paid', 'authorized')
      GROUP BY DATE(o.created_at)
      ORDER BY date
    `, [user.store_id, start_date, end_date]);

    // בניית התוצאות
    const products = productsData.map((p) => {
      const revenue = parseFloat(p.revenue) || 0;
      const refunds = refundsByProduct[p.product_id] || 0;
      return {
        product_id: p.product_id,
        product_title: p.product_title,
        product_image: p.product_image,
        variant_count: parseInt(p.variant_count) || 1,
        quantity_sold: parseInt(p.quantity_sold) || 0,
        orders_count: parseInt(p.orders_count) || 0,
        revenue,
        avg_price: parseFloat(p.avg_price) || 0,
        refunds,
        net_revenue: revenue - refunds,
        views: 0, // יכולים להוסיף מטבלת analytics_events
        conversion_rate: 0,
      };
    });

    // סיכומים
    const totals = {
      total_products: products.length,
      total_quantity: products.reduce((acc, p) => acc + p.quantity_sold, 0),
      total_orders: new Set(productsData.map((p) => p.orders_count)).size,
      total_revenue: products.reduce((acc, p) => acc + p.revenue, 0),
      avg_order_value: 0,
    };

    if (totals.total_orders > 0) {
      totals.avg_order_value = totals.total_revenue / totals.total_orders;
    }

    return NextResponse.json({
      products,
      daily_sales: dailySales.map((d) => ({
        date: d.date,
        quantity: parseInt(d.quantity) || 0,
        revenue: parseFloat(d.revenue) || 0,
      })),
      totals,
      period: { start_date, end_date },
    });
  } catch (error: any) {
    console.error('Error fetching sales by product:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}

