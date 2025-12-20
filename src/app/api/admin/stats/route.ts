/**
 * Admin Stats API
 * 
 * GET /api/admin/stats - Get dashboard statistics for super admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest, isSuperAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isSuperAdmin(user.email)) {
      return NextResponse.json(
        { error: 'Unauthorized - Super Admin access required' },
        { status: 403 }
      );
    }

    // Total stores
    const totalStores = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM stores'
    );

    // Store counts by subscription status
    const storesByStatus = await query<{ status: string; count: string }>(`
      SELECT 
        COALESCE(sub.status, 'no_subscription') as status,
        COUNT(*) as count
      FROM stores s
      LEFT JOIN qs_store_subscriptions sub ON s.id = sub.store_id
      GROUP BY COALESCE(sub.status, 'no_subscription')
    `);

    const statusCounts: Record<string, number> = {};
    storesByStatus.forEach(row => {
      statusCounts[row.status] = parseInt(row.count, 10);
    });

    // Monthly revenue (current month subscriptions)
    const monthlyRevenue = await queryOne<{ total: string }>(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM qs_billing_transactions
      WHERE type = 'subscription'
        AND status = 'success'
        AND created_at >= date_trunc('month', CURRENT_DATE)
    `);

    // Pending commissions
    const pendingCommissions = await queryOne<{ total: string }>(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM qs_commission_charges
      WHERE status = 'pending'
    `);

    // Total commissions collected
    const totalCommissions = await queryOne<{ total: string }>(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM qs_billing_transactions
      WHERE type = 'commission'
        AND status = 'success'
    `);

    // Total subscriptions count
    const totalSubscriptions = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM qs_store_subscriptions WHERE status = $1',
      ['active']
    );

    return NextResponse.json({
      total_stores: parseInt(totalStores?.count || '0', 10),
      active_stores: statusCounts['active'] || 0,
      trial_stores: statusCounts['trial'] || 0,
      blocked_stores: (statusCounts['blocked'] || 0) + (statusCounts['expired'] || 0),
      total_subscriptions: parseInt(totalSubscriptions?.count || '0', 10),
      monthly_revenue: parseFloat(monthlyRevenue?.total || '0'),
      pending_commissions: parseFloat(pendingCommissions?.total || '0'),
      total_commissions_collected: parseFloat(totalCommissions?.total || '0'),
    });

  } catch (error) {
    console.error('[Admin Stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

