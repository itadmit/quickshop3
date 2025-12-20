/**
 * Admin Subscriptions API
 * 
 * GET /api/admin/subscriptions - List all subscriptions with details
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

    // Get all subscriptions with store and plan info
    const subscriptions = await query<{
      id: number;
      store_id: number;
      store_name: string;
      store_slug: string;
      owner_email: string;
      plan_name: string;
      plan_price: number;
      status: string;
      trial_ends_at: string | null;
      current_period_end: string | null;
      next_payment_date: string | null;
      last_payment_amount: number | null;
      last_payment_status: string | null;
      created_at: string;
    }>(`
      SELECT 
        sub.id,
        s.id as store_id,
        s.name as store_name,
        s.slug as store_slug,
        so.email as owner_email,
        p.display_name as plan_name,
        p.price as plan_price,
        sub.status,
        sub.trial_ends_at,
        sub.current_period_end,
        sub.next_payment_date,
        sub.last_payment_amount,
        sub.last_payment_status,
        sub.created_at
      FROM qs_store_subscriptions sub
      JOIN stores s ON sub.store_id = s.id
      JOIN store_owners so ON s.owner_id = so.id
      JOIN qs_subscription_plans p ON sub.plan_id = p.id
      ORDER BY sub.created_at DESC
    `);

    // Get summary stats
    const activeCount = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM qs_store_subscriptions WHERE status = 'active'"
    );

    const trialCount = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM qs_store_subscriptions WHERE status = 'trial'"
    );

    const monthlyRevenue = await queryOne<{ total: string }>(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM qs_billing_transactions
      WHERE type = 'subscription'
        AND status = 'success'
        AND created_at >= date_trunc('month', CURRENT_DATE)
    `);

    const totalRevenue = await queryOne<{ total: string }>(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM qs_billing_transactions
      WHERE status = 'success'
    `);

    return NextResponse.json({
      subscriptions,
      summary: {
        total_active: parseInt(activeCount?.count || '0', 10),
        total_trial: parseInt(trialCount?.count || '0', 10),
        monthly_revenue: parseFloat(monthlyRevenue?.total || '0'),
        total_revenue: parseFloat(totalRevenue?.total || '0'),
      },
    });

  } catch (error) {
    console.error('[Admin Subscriptions] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

