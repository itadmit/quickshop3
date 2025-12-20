/**
 * Admin Commissions API
 * 
 * GET /api/admin/commissions - List all commission charges with summary
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (status && status !== 'all') {
      conditions.push(`c.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get commissions with store info
    const commissions = await query<{
      id: number;
      store_name: string;
      store_slug: string;
      period_start: string;
      period_end: string;
      total_sales: number;
      commission_rate: number;
      commission_amount: number;
      vat_amount: number;
      total_amount: number;
      status: string;
      charged_at: string | null;
      created_at: string;
    }>(`
      SELECT 
        c.id,
        s.name as store_name,
        s.slug as store_slug,
        c.period_start,
        c.period_end,
        c.total_sales,
        c.commission_rate,
        c.commission_amount,
        c.vat_amount,
        c.total_amount,
        c.status,
        c.charged_at,
        c.created_at
      FROM qs_commission_charges c
      JOIN stores s ON c.store_id = s.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset]);

    // Get summary
    const pendingStats = await queryOne<{ count: string; amount: string }>(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as amount
      FROM qs_commission_charges
      WHERE status = 'pending'
    `);

    const thisMonthCollected = await queryOne<{ total: string }>(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM qs_commission_charges
      WHERE status = 'success'
        AND charged_at >= date_trunc('month', CURRENT_DATE)
    `);

    const totalCollected = await queryOne<{ total: string }>(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM qs_commission_charges
      WHERE status = 'success'
    `);

    return NextResponse.json({
      commissions,
      summary: {
        pending_count: parseInt(pendingStats?.count || '0', 10),
        pending_amount: parseFloat(pendingStats?.amount || '0'),
        collected_this_month: parseFloat(thisMonthCollected?.total || '0'),
        collected_total: parseFloat(totalCollected?.total || '0'),
      },
      page,
      limit,
    });

  } catch (error) {
    console.error('[Admin Commissions] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commissions' },
      { status: 500 }
    );
  }
}

