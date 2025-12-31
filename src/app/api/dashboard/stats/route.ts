import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// Helper to calculate percentage change
const calculatePercentageChange = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;
    const now = new Date();
    
    // Time ranges
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    
    const yesterdayEnd = new Date(todayStart);
    yesterdayEnd.setMilliseconds(-1);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(monthStart);
    lastMonthEnd.setMilliseconds(-1);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // 1. Basic Counts
    const counts = await queryOne<{
      active_products: number;
      total_products: number;
      pending_orders: number;
      total_orders: number;
    }>(
      `SELECT 
        (SELECT COUNT(*) FROM products WHERE store_id = $1 AND status = 'active') as active_products,
        (SELECT COUNT(*) FROM products WHERE store_id = $1) as total_products,
        (SELECT COUNT(*) FROM orders WHERE store_id = $1 AND (fulfillment_status IS NULL OR fulfillment_status = 'pending')) as pending_orders,
        (SELECT COUNT(*) FROM orders WHERE store_id = $1) as total_orders`,
      [storeId]
    );

    // 2. Sales & Revenue Stats (Current vs Previous)
    
    // Today's Revenue
    const todayStats = await queryOne<{ revenue: string; count: number }>(
      `SELECT 
        COALESCE(SUM(total_price::numeric), 0) as revenue,
        COUNT(*) as count
       FROM orders 
       WHERE store_id = $1 
         AND financial_status = 'paid'
         AND created_at >= $2`,
      [storeId, todayStart.toISOString()]
    );

    // Yesterday's Revenue
    const yesterdayStats = await queryOne<{ revenue: string; count: number }>(
      `SELECT 
        COALESCE(SUM(total_price::numeric), 0) as revenue,
        COUNT(*) as count
       FROM orders 
       WHERE store_id = $1 
         AND financial_status = 'paid'
         AND created_at >= $2 
         AND created_at <= $3`,
      [storeId, yesterdayStart.toISOString(), yesterdayEnd.toISOString()]
    );

    // This Month's Revenue
    const monthStats = await queryOne<{ revenue: string; count: number }>(
      `SELECT 
        COALESCE(SUM(total_price::numeric), 0) as revenue,
        COUNT(*) as count
       FROM orders 
       WHERE store_id = $1 
         AND financial_status = 'paid'
         AND created_at >= $2`,
      [storeId, monthStart.toISOString()]
    );

    // Last Month's Revenue
    const lastMonthStats = await queryOne<{ revenue: string; count: number }>(
      `SELECT 
        COALESCE(SUM(total_price::numeric), 0) as revenue,
        COUNT(*) as count
       FROM orders 
       WHERE store_id = $1 
         AND financial_status = 'paid'
         AND created_at >= $2 
         AND created_at <= $3`,
      [storeId, lastMonthStart.toISOString(), lastMonthEnd.toISOString()]
    );

    // AOV (Last 30 days vs Previous 30 days)
    const currentAOVStats = await queryOne<{ revenue: string; count: number }>(
      `SELECT 
        COALESCE(SUM(total_price::numeric), 0) as revenue,
        COUNT(*) as count
       FROM orders 
       WHERE store_id = $1 
         AND financial_status = 'paid'
         AND created_at >= $2`,
      [storeId, thirtyDaysAgo.toISOString()]
    );

    const previousAOVStats = await queryOne<{ revenue: string; count: number }>(
      `SELECT 
        COALESCE(SUM(total_price::numeric), 0) as revenue,
        COUNT(*) as count
       FROM orders 
       WHERE store_id = $1 
         AND financial_status = 'paid'
         AND created_at >= $2 
         AND created_at < $3`,
      [storeId, sixtyDaysAgo.toISOString(), thirtyDaysAgo.toISOString()]
    );

    // Calculate Trends
    const trends = {
      salesToday: calculatePercentageChange(
        parseFloat(todayStats?.revenue || '0'), 
        parseFloat(yesterdayStats?.revenue || '0')
      ),
      ordersToday: calculatePercentageChange(
        Number(todayStats?.count || 0), 
        Number(yesterdayStats?.count || 0)
      ),
      monthlySales: calculatePercentageChange(
        parseFloat(monthStats?.revenue || '0'), 
        parseFloat(lastMonthStats?.revenue || '0')
      ),
      aov: calculatePercentageChange(
        Number(currentAOVStats?.count || 0) > 0 ? parseFloat(currentAOVStats?.revenue || '0') / Number(currentAOVStats?.count) : 0,
        Number(previousAOVStats?.count || 0) > 0 ? parseFloat(previousAOVStats?.revenue || '0') / Number(previousAOVStats?.count) : 0
      )
    };

    // Calculate current AOV
    const currentAOV = Number(currentAOVStats?.count || 0) > 0 
      ? parseFloat(currentAOVStats?.revenue || '0') / Number(currentAOVStats?.count)
      : 0;

    // Get recent orders with customer name
    const recentOrders = await query(
      `SELECT 
        o.id,
        o.order_number,
        o.order_name,
        o.total_price,
        o.financial_status,
        o.fulfillment_status,
        o.created_at,
        o.customer_id,
        c.first_name as customer_first_name,
        c.last_name as customer_last_name,
        c.email as customer_email,
        cos.display_name as fulfillment_status_display,
        cos.color as fulfillment_status_color
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       LEFT JOIN custom_order_statuses cos ON o.fulfillment_status = cos.name AND cos.store_id = $1
       WHERE o.store_id = $1 
       ORDER BY o.created_at DESC 
       LIMIT 5`,
      [storeId]
    );

    // Get notifications
    const notifications = await query(
      `SELECT id, notification_type, title, message, link_url, is_read, created_at
       FROM notifications 
       WHERE store_id = $1 
       ORDER BY created_at DESC 
       LIMIT 5`,
      [storeId]
    );

    // Get low stock products
    const lowStockProducts = await query(
      `SELECT DISTINCT p.id, p.title, SUM(pv.inventory_quantity) as available
       FROM products p
       INNER JOIN product_variants pv ON pv.product_id = p.id
       WHERE p.store_id = $1 AND p.status = 'active'
       GROUP BY p.id, p.title
       HAVING SUM(pv.inventory_quantity) < 10
       ORDER BY SUM(pv.inventory_quantity) ASC
       LIMIT 5`,
      [storeId]
    );

    // Get user name
    const userName = await queryOne<{ name: string }>(
      `SELECT name FROM store_owners WHERE id = $1`,
      [user.id]
    );

    // Weekly Graph Data
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    
    const weeklyData = await query<{
      date: string;
      orders: number;
      revenue: string;
    }>(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        COALESCE(SUM(total_price::numeric), 0) as revenue
       FROM orders
       WHERE store_id = $1 
         AND financial_status = 'paid'
         AND created_at >= $2
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [storeId, weekAgo.toISOString()]
    );

    return NextResponse.json({
      userName: userName?.name || 'משתמש',
      metrics: {
        activeProducts: counts?.active_products || 0,
        totalProducts: counts?.total_products || 0,
        pendingOrders: counts?.pending_orders || 0,
        totalOrders: counts?.total_orders || 0,
        
        // Detailed metrics
        salesToday: todayStats?.revenue || '0',
        ordersToday: todayStats?.count || 0,
        monthlySales: monthStats?.revenue || '0',
        monthlyTransactions: monthStats?.count || 0,
        averageOrderValue: currentAOV.toString(),
        
        // Trends
        trends
      },
      weeklyData: weeklyData || [],
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
