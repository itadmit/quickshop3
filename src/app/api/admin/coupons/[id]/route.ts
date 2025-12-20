/**
 * Admin Coupon Detail API
 * 
 * GET /api/admin/coupons/:id - Get coupon details with usage stats
 * PUT /api/admin/coupons/:id - Update coupon
 * DELETE /api/admin/coupons/:id - Delete coupon
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest, isSuperAdmin } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isSuperAdmin(user.email)) {
      return NextResponse.json(
        { error: 'Unauthorized - Super Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const coupon = await queryOne<{
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
      created_by: string;
      created_at: string;
    }>(`
      SELECT * FROM qs_coupons WHERE id = $1
    `, [id]);

    if (!coupon) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      );
    }

    // Get usage history
    const usage = await query<{
      id: number;
      store_name: string;
      store_slug: string;
      applied_at: string;
      savings_amount: number;
    }>(`
      SELECT 
        u.id,
        s.name as store_name,
        s.slug as store_slug,
        u.applied_at,
        u.savings_amount
      FROM qs_coupon_usage u
      JOIN stores s ON u.store_id = s.id
      WHERE u.coupon_id = $1
      ORDER BY u.applied_at DESC
    `, [id]);

    return NextResponse.json({
      coupon,
      usage,
    });

  } catch (error) {
    console.error('[Admin Coupon Detail] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coupon' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isSuperAdmin(user.email)) {
      return NextResponse.json(
        { error: 'Unauthorized - Super Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'type', 'value', 'value_type', 'max_discount',
      'applicable_plans', 'first_time_only', 'max_uses',
      'starts_at', 'expires_at', 'description', 'is_active'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        values.push(body[field]);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(id);

    const coupon = await queryOne<{ id: number; code: string }>(`
      UPDATE qs_coupons
      SET ${updates.join(', ')}, updated_at = now()
      WHERE id = $${paramIndex}
      RETURNING id, code
    `, values);

    if (!coupon) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      coupon,
    });

  } catch (error) {
    console.error('[Admin Coupon Update] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update coupon' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isSuperAdmin(user.email)) {
      return NextResponse.json(
        { error: 'Unauthorized - Super Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const result = await queryOne<{ id: number }>(
      'DELETE FROM qs_coupons WHERE id = $1 RETURNING id',
      [id]
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Coupon deleted successfully',
    });

  } catch (error) {
    console.error('[Admin Coupon Delete] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete coupon' },
      { status: 500 }
    );
  }
}

