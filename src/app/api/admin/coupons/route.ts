/**
 * Admin Coupons API
 * 
 * GET /api/admin/coupons - List all coupons
 * POST /api/admin/coupons - Create a new coupon
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

    const coupons = await query<{
      id: number;
      code: string;
      type: string;
      value: number;
      value_type: string;
      max_discount: number | null;
      applicable_plans: string[];
      first_time_only: boolean;
      max_uses: number | null;
      current_uses: number;
      starts_at: string;
      expires_at: string | null;
      description: string | null;
      is_active: boolean;
      created_at: string;
    }>(`
      SELECT 
        id, code, type, value, value_type, max_discount,
        applicable_plans, first_time_only, max_uses, current_uses,
        starts_at, expires_at, description, is_active, created_at
      FROM qs_coupons
      ORDER BY created_at DESC
    `);

    return NextResponse.json({ coupons });

  } catch (error) {
    console.error('[Admin Coupons] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coupons' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isSuperAdmin(user.email)) {
      return NextResponse.json(
        { error: 'Unauthorized - Super Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      code,
      type,
      value,
      value_type = 'fixed',
      max_discount,
      applicable_plans = [],
      first_time_only = true,
      max_uses,
      starts_at,
      expires_at,
      description,
    } = body;

    // Validate required fields
    if (!code || !type || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: code, type, value' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['extra_trial_days', 'free_months', 'first_payment_discount', 'recurring_discount'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM qs_coupons WHERE code = $1',
      [code.toUpperCase()]
    );

    if (existing) {
      return NextResponse.json(
        { error: 'Coupon code already exists' },
        { status: 409 }
      );
    }

    // Create coupon
    const coupon = await queryOne<{ id: number; code: string }>(`
      INSERT INTO qs_coupons (
        code, type, value, value_type, max_discount,
        applicable_plans, first_time_only, max_uses,
        starts_at, expires_at, description, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      )
      RETURNING id, code
    `, [
      code.toUpperCase(),
      type,
      value,
      value_type,
      max_discount || null,
      applicable_plans,
      first_time_only,
      max_uses || null,
      starts_at || new Date().toISOString(),
      expires_at || null,
      description || null,
      user.email,
    ]);

    return NextResponse.json({
      success: true,
      coupon,
      message: 'Coupon created successfully',
    });

  } catch (error) {
    console.error('[Admin Coupons] Error creating coupon:', error);
    return NextResponse.json(
      { error: 'Failed to create coupon' },
      { status: 500 }
    );
  }
}

