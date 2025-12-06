import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;

    // Get active products count
    const activeProducts = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM products WHERE store_id = $1 AND status = 'active'`,
      [storeId]
    );

    // Get total products count
    const totalProducts = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM products WHERE store_id = $1`,
      [storeId]
    );

    // Get pending orders count
    const pendingOrders = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM orders WHERE store_id = $1 AND (fulfillment_status IS NULL OR fulfillment_status = 'pending')`,
      [storeId]
    );

    // Get total orders count
    const totalOrders = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM orders WHERE store_id = $1`,
      [storeId]
    );

    // Get revenue (paid orders only)
    const revenue = await queryOne<{ revenue: string; count: number; avg: string }>(
      `SELECT 
        COALESCE(SUM(total_price::numeric), 0) as revenue,
        COUNT(*) as count,
        COALESCE(AVG(total_price::numeric), 0) as avg
       FROM orders 
       WHERE store_id = $1 AND financial_status = 'paid'`,
      [storeId]
    );

    // Get recent orders (last 5)
    const recentOrders = await query(
      `SELECT 
        id,
        order_number,
        order_name,
        total_price,
        financial_status,
        fulfillment_status,
        created_at,
        customer_id
       FROM orders 
       WHERE store_id = $1 
       ORDER BY created_at DESC 
       LIMIT 5`,
      [storeId]
    );

    // Get recent notifications (from notifications table)
    const notifications = await query(
      `SELECT 
        id,
        notification_type,
        title,
        message,
        link_url,
        is_read,
        created_at
       FROM notifications 
       WHERE store_id = $1 
       ORDER BY created_at DESC 
       LIMIT 5`,
      [storeId]
    );

    // Get low stock products
    const lowStockProducts = await query(
      `SELECT DISTINCT
        p.id,
        p.title,
        vi.available
       FROM products p
       INNER JOIN product_variants pv ON pv.product_id = p.id
       INNER JOIN variant_inventory vi ON vi.variant_id = pv.id
       WHERE p.store_id = $1 
         AND p.status = 'active'
         AND vi.available < 10
       ORDER BY vi.available ASC
       LIMIT 5`,
      [storeId]
    );

    // Get user name
    const userName = await queryOne<{ name: string }>(
      `SELECT name FROM store_owners WHERE id = $1`,
      [user.id]
    );

    return NextResponse.json({
      userName: userName?.name || 'משתמש',
      metrics: {
        activeProducts: activeProducts?.count || 0,
        totalProducts: totalProducts?.count || 0,
        pendingOrders: pendingOrders?.count || 0,
        totalOrders: totalOrders?.count || 0,
        revenue: revenue?.revenue || '0',
        revenueCount: revenue?.count || 0,
        averageOrderValue: revenue?.avg || '0',
      },
      recentOrders: recentOrders || [],
      notifications: notifications || [],
      lowStockProducts: lowStockProducts || [],
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}

