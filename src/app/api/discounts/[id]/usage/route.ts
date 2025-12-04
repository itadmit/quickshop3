import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/discounts/:id/usage - Get discount usage statistics
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

    const discountId = parseInt(id);
    if (isNaN(discountId)) {
      return NextResponse.json({ error: 'Invalid discount ID' }, { status: 400 });
    }

    const storeId = user.store_id;

    // Get discount code
    const discount = await queryOne<{
      id: number;
      code: string;
      usage_count: number;
      usage_limit: number | null;
    }>(
      'SELECT id, code, usage_count, usage_limit FROM discount_codes WHERE id = $1 AND store_id = $2',
      [discountId, storeId]
    );

    if (!discount) {
      return NextResponse.json({ error: 'Discount code not found' }, { status: 404 });
    }

    // Get orders that used this discount
    const orders = await query<{
      id: number;
      order_name: string;
      email: string;
      name: string;
      total_price: string;
      created_at: Date;
    }>(
      `SELECT o.id, o.order_name, o.email, o.name, o.total_price, o.created_at
       FROM orders o
       WHERE o.store_id = $1 
         AND o.discount_code = $2
       ORDER BY o.created_at DESC
       LIMIT 50`,
      [storeId, discount.code]
    );

    // Calculate statistics
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_price), 0);
    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    // Get usage by date
    const usageByDate = await query<{
      date: string;
      usage_count: number;
      total_revenue: string;
    }>(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as usage_count,
        SUM(total_price::numeric) as total_revenue
       FROM orders
       WHERE store_id = $1 
         AND discount_code = $2
       GROUP BY DATE(created_at)
       ORDER BY date DESC
       LIMIT 30`,
      [storeId, discount.code]
    );

    return NextResponse.json({
      discount: {
        id: discount.id,
        code: discount.code,
        usage_count: discount.usage_count,
        usage_limit: discount.usage_limit,
        usage_percentage: discount.usage_limit 
          ? Math.round((discount.usage_count / discount.usage_limit) * 100) 
          : null,
      },
      statistics: {
        total_orders: orders.length,
        total_revenue: totalRevenue.toFixed(2),
        average_order_value: averageOrderValue.toFixed(2),
      },
      recent_orders: orders,
      usage_by_date: usageByDate,
    });
  } catch (error: any) {
    console.error('Error fetching discount usage:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch discount usage' },
      { status: 500 }
    );
  }
}

