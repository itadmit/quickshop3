/**
 * Admin Stores API
 * 
 * GET /api/admin/stores - List all stores with subscription info
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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (status && status !== 'all') {
      conditions.push(`COALESCE(sub.status, 'no_subscription') = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (search) {
      conditions.push(`(
        s.name ILIKE $${paramIndex} OR 
        s.slug ILIKE $${paramIndex} OR 
        s.domain ILIKE $${paramIndex} OR 
        so.email ILIKE $${paramIndex} OR
        so.name ILIKE $${paramIndex}
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await queryOne<{ count: string }>(`
      SELECT COUNT(*) as count
      FROM stores s
      JOIN store_owners so ON s.owner_id = so.id
      LEFT JOIN qs_store_subscriptions sub ON s.id = sub.store_id
      ${whereClause}
    `, params);

    // Get stores with subscription info
    const stores = await query<{
      id: number;
      name: string;
      slug: string;
      domain: string | null;
      owner_email: string;
      owner_name: string;
      created_at: string;
      subscription_status: string | null;
      plan_name: string | null;
      trial_ends_at: string | null;
    }>(`
      SELECT 
        s.id,
        s.name,
        s.slug,
        s.domain,
        so.email as owner_email,
        so.name as owner_name,
        s.created_at,
        sub.status as subscription_status,
        p.display_name as plan_name,
        sub.trial_ends_at
      FROM stores s
      JOIN store_owners so ON s.owner_id = so.id
      LEFT JOIN qs_store_subscriptions sub ON s.id = sub.store_id
      LEFT JOIN qs_subscription_plans p ON sub.plan_id = p.id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset]);

    return NextResponse.json({
      stores,
      total: parseInt(countResult?.count || '0', 10),
      page,
      limit,
    });

  } catch (error) {
    console.error('[Admin Stores] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stores' },
      { status: 500 }
    );
  }
}

