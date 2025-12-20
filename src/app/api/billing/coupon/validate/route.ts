/**
 * Coupon Validation API
 * 
 * POST /api/billing/coupon/validate - Validate a coupon code
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

interface CouponValidationResult {
  valid: boolean;
  coupon?: {
    code: string;
    type: string;
    value: number;
    value_type: string;
    description: string | null;
    message: string;
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { code, plan_name } = body;

    if (!code) {
      return NextResponse.json(
        { valid: false, error: 'Coupon code is required' },
        { status: 400 }
      );
    }

    // Find coupon
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
    }>(`
      SELECT * FROM qs_coupons WHERE code = $1
    `, [code.toUpperCase()]);

    if (!coupon) {
      return NextResponse.json<CouponValidationResult>({
        valid: false,
        error: 'קוד קופון לא נמצא',
      });
    }

    // Check if active
    if (!coupon.is_active) {
      return NextResponse.json<CouponValidationResult>({
        valid: false,
        error: 'קופון זה אינו פעיל',
      });
    }

    // Check dates
    const now = new Date();
    const startsAt = new Date(coupon.starts_at);
    const expiresAt = coupon.expires_at ? new Date(coupon.expires_at) : null;

    if (now < startsAt) {
      return NextResponse.json<CouponValidationResult>({
        valid: false,
        error: 'קופון זה עדיין לא התחיל',
      });
    }

    if (expiresAt && now > expiresAt) {
      return NextResponse.json<CouponValidationResult>({
        valid: false,
        error: 'פג תוקף הקופון',
      });
    }

    // Check usage limits
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return NextResponse.json<CouponValidationResult>({
        valid: false,
        error: 'קופון זה הגיע למגבלת השימושים',
      });
    }

    // Check if already used by this store
    const existingUsage = await queryOne<{ id: number }>(
      'SELECT id FROM qs_coupon_usage WHERE coupon_id = $1 AND store_id = $2',
      [coupon.id, user.store_id]
    );

    if (existingUsage) {
      return NextResponse.json<CouponValidationResult>({
        valid: false,
        error: 'כבר השתמשת בקופון זה',
      });
    }

    // Check first_time_only
    if (coupon.first_time_only) {
      // Check if store ever had a subscription
      const hasSubscription = await queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM qs_billing_transactions WHERE store_id = $1 AND type = $2 AND status = $3',
        [user.store_id, 'subscription', 'success']
      );

      if (parseInt(hasSubscription?.count || '0', 10) > 0) {
        return NextResponse.json<CouponValidationResult>({
          valid: false,
          error: 'קופון זה תקף רק ללקוחות חדשים',
        });
      }
    }

    // Check applicable plans
    if (coupon.applicable_plans && coupon.applicable_plans.length > 0 && plan_name) {
      if (!coupon.applicable_plans.includes(plan_name)) {
        return NextResponse.json<CouponValidationResult>({
          valid: false,
          error: `קופון זה לא תקף לתוכנית ${plan_name}`,
        });
      }
    }

    // Generate message based on coupon type
    let message = '';
    switch (coupon.type) {
      case 'extra_trial_days':
        message = `מעולה! תקבל ${coupon.value} ימי ניסיון נוספים`;
        break;
      case 'free_months':
        message = `מעולה! תקבל ${coupon.value} חודשים חינם`;
        break;
      case 'first_payment_discount':
        if (coupon.value_type === 'percent') {
          message = `מעולה! ${coupon.value}% הנחה על התשלום הראשון`;
        } else {
          message = `מעולה! ₪${coupon.value} הנחה על התשלום הראשון`;
        }
        break;
      case 'recurring_discount':
        if (coupon.value_type === 'percent') {
          message = `מעולה! ${coupon.value}% הנחה קבועה`;
        } else {
          message = `מעולה! ₪${coupon.value} הנחה לחודש`;
        }
        break;
    }

    return NextResponse.json<CouponValidationResult>({
      valid: true,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        value_type: coupon.value_type,
        description: coupon.description,
        message,
      },
    });

  } catch (error) {
    console.error('[Coupon Validate] Error:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to validate coupon' },
      { status: 500 }
    );
  }
}

