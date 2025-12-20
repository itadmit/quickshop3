/**
 * Apply Coupon API
 * 
 * POST /api/billing/coupon/apply - Apply a coupon to a subscription
 * 
 * This is called after successful payment or during subscription creation
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

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
    const { code, subscription_id } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Coupon code is required' },
        { status: 400 }
      );
    }

    // Get coupon
    const coupon = await queryOne<{
      id: number;
      code: string;
      type: string;
      value: number;
      value_type: string;
      max_discount: number | null;
      is_active: boolean;
      current_uses: number;
    }>(`
      SELECT * FROM qs_coupons WHERE code = $1 AND is_active = true
    `, [code.toUpperCase()]);

    if (!coupon) {
      return NextResponse.json(
        { error: 'Coupon not found or inactive' },
        { status: 404 }
      );
    }

    // Check if already used
    const existingUsage = await queryOne<{ id: number }>(
      'SELECT id FROM qs_coupon_usage WHERE coupon_id = $1 AND store_id = $2',
      [coupon.id, user.store_id]
    );

    if (existingUsage) {
      return NextResponse.json(
        { error: 'Coupon already used' },
        { status: 409 }
      );
    }

    // Get subscription if provided
    let subscriptionId = subscription_id;
    if (!subscriptionId) {
      const sub = await queryOne<{ id: number }>(
        'SELECT id FROM qs_store_subscriptions WHERE store_id = $1',
        [user.store_id]
      );
      subscriptionId = sub?.id;
    }

    // Calculate savings (depends on plan price for percentage discounts)
    let savingsAmount = 0;
    if (coupon.type === 'first_payment_discount' || coupon.type === 'recurring_discount') {
      const subscription = await queryOne<{ plan_price: number }>(`
        SELECT p.price as plan_price 
        FROM qs_store_subscriptions s
        JOIN qs_subscription_plans p ON s.plan_id = p.id
        WHERE s.store_id = $1
      `, [user.store_id]);
      
      if (subscription) {
        if (coupon.value_type === 'percent') {
          savingsAmount = (subscription.plan_price * coupon.value) / 100;
          if (coupon.max_discount && savingsAmount > coupon.max_discount) {
            savingsAmount = coupon.max_discount;
          }
        } else {
          savingsAmount = coupon.value;
        }
      }
    }

    // Apply the coupon based on type
    switch (coupon.type) {
      case 'extra_trial_days':
        // Add days to trial_ends_at
        await query(`
          UPDATE qs_store_subscriptions
          SET trial_ends_at = COALESCE(trial_ends_at, now()) + INTERVAL '1 day' * $1,
              updated_at = now()
          WHERE store_id = $2
        `, [coupon.value, user.store_id]);
        break;

      case 'free_months':
        // Set free months - skip billing for these months
        // We'll store this in the subscription metadata or a separate field
        await query(`
          UPDATE qs_store_subscriptions
          SET next_payment_date = COALESCE(next_payment_date, now()) + INTERVAL '1 month' * $1,
              updated_at = now()
          WHERE store_id = $2
        `, [coupon.value, user.store_id]);
        break;

      case 'first_payment_discount':
        // This will be handled during payment - we just record it
        // The actual discount is applied in the subscribe flow
        break;

      case 'recurring_discount':
        // Store the recurring discount info
        // This would need additional fields in the subscription table
        break;
    }

    // Record coupon usage
    await query(`
      INSERT INTO qs_coupon_usage (
        coupon_id, store_id, subscription_id, 
        applied_value, savings_amount, ip_address
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      coupon.id,
      user.store_id,
      subscriptionId || null,
      coupon.value,
      savingsAmount,
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
    ]);

    // Increment coupon usage count
    await query(
      'UPDATE qs_coupons SET current_uses = current_uses + 1 WHERE id = $1',
      [coupon.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Coupon applied successfully',
      applied: {
        type: coupon.type,
        value: coupon.value,
        savings_amount: savingsAmount,
      },
    });

  } catch (error) {
    console.error('[Coupon Apply] Error:', error);
    return NextResponse.json(
      { error: 'Failed to apply coupon' },
      { status: 500 }
    );
  }
}

