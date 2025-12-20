/**
 * Subscribe API
 * 
 * POST /api/billing/subscribe - Generate payment link for subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getPayPlusClient } from '@/lib/payplus';
import { getUserFromRequest } from '@/lib/auth';

interface SubscribeRequest {
  plan_name: 'lite' | 'pro';
  store_id?: number;
  coupon_code?: string;
}

interface CouponData {
  id: number;
  code: string;
  type: string;
  value: number;
  value_type: string;
  max_discount: number | null;
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body: SubscribeRequest = await request.json();
    const { plan_name, store_id, coupon_code } = body;
    
    if (!plan_name || !['lite', 'pro'].includes(plan_name)) {
      return NextResponse.json(
        { error: 'Invalid plan name' },
        { status: 400 }
      );
    }

    // Validate coupon if provided
    let coupon: CouponData | null = null;
    if (coupon_code) {
      coupon = await queryOne<CouponData>(`
        SELECT id, code, type, value, value_type, max_discount
        FROM qs_coupons
        WHERE code = $1 
          AND is_active = true
          AND (starts_at IS NULL OR starts_at <= now())
          AND (expires_at IS NULL OR expires_at > now())
          AND (max_uses IS NULL OR current_uses < max_uses)
      `, [coupon_code.toUpperCase()]);
      
      if (!coupon) {
        return NextResponse.json(
          { error: 'קופון לא תקין או פג תוקף' },
          { status: 400 }
        );
      }
      
      // Check if already used by this store
      const usedCoupon = await queryOne<{ id: number }>(
        'SELECT id FROM qs_coupon_usage WHERE coupon_id = $1 AND store_id = $2',
        [coupon.id, store_id || user.store_id]
      );
      
      if (usedCoupon) {
        return NextResponse.json(
          { error: 'כבר השתמשת בקופון זה' },
          { status: 400 }
        );
      }
    }
    
    // Get store (use provided or user's current store)
    let storeData: { id: number; name: string; slug: string; owner_email: string } | null;
    
    const targetStoreId = store_id || user.store_id;
    
    storeData = await queryOne(`
      SELECT s.id, s.name, s.slug, so.email as owner_email
      FROM stores s
      JOIN store_owners so ON s.owner_id = so.id
      WHERE s.id = $1 AND so.id = $2
    `, [targetStoreId, user.id]);
    
    if (!storeData) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }
    
    // Get plan details
    const plan = await queryOne<{
      id: number;
      name: string;
      display_name: string;
      price: number;
      vat_percentage: number;
      has_checkout: boolean;
    }>(`
      SELECT id, name, display_name, price, vat_percentage, has_checkout
      FROM qs_subscription_plans
      WHERE name = $1 AND is_active = true
    `, [plan_name]);
    
    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }
    
    // Calculate discount from coupon
    let discountAmount = 0;
    if (coupon && coupon.type === 'first_payment_discount') {
      if (coupon.value_type === 'percent') {
        discountAmount = Math.round(plan.price * (coupon.value / 100) * 100) / 100;
        if (coupon.max_discount && discountAmount > coupon.max_discount) {
          discountAmount = coupon.max_discount;
        }
      } else {
        discountAmount = Math.min(coupon.value, plan.price);
      }
    }
    
    // Calculate total with VAT (after discount)
    const priceAfterDiscount = plan.price - discountAmount;
    const vatAmount = Math.round(priceAfterDiscount * (plan.vat_percentage / 100) * 100) / 100;
    const totalAmount = Math.round((priceAfterDiscount + vatAmount) * 100) / 100;
    
    // Check if store already has active subscription
    const existingSubscription = await queryOne<{ id: number; status: string }>(`
      SELECT id, status
      FROM qs_store_subscriptions
      WHERE store_id = $1
    `, [storeData.id]);
    
    // Build callback URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://quickshop.co.il';
    const successUrl = `${baseUrl}/billing/success?store_id=${storeData.id}&plan=${plan_name}`;
    const failureUrl = `${baseUrl}/billing/failure?store_id=${storeData.id}&plan=${plan_name}`;
    const cancelUrl = `${baseUrl}/billing/cancel?store_id=${storeData.id}`;
    const callbackUrl = `${baseUrl}/api/billing/ipn`;
    
    // Generate payment link
    const payplus = getPayPlusClient();
    
    const result = await payplus.generatePaymentLink({
      amount: totalAmount,
      currency_code: 'ILS',
      create_token: true, // Important: save token for future charges
      customer: {
        customer_name: storeData.name,
        email: storeData.owner_email,
      },
      items: [{
        name: `מנוי ${plan.display_name}`,
        quantity: 1,
        price: totalAmount,
        vat_type: 0, // VAT included
      }],
      more_info: storeData.id.toString(), // Store ID for IPN
      more_info_2: plan_name, // Plan name for IPN
      more_info_3: existingSubscription?.id?.toString() || 'new', // Subscription ID or 'new'
      more_info_4: coupon?.code || '', // Coupon code for IPN
      refURL_success: successUrl,
      refURL_failure: failureUrl,
      refURL_cancel: cancelUrl,
      refURL_callback: callbackUrl,
      send_failure_callback: true,
      sendEmailApproval: true,
    });
    
    // Create or update subscription record with pending status
    if (existingSubscription) {
      await query(`
        UPDATE qs_store_subscriptions
        SET 
          plan_id = $1,
          status = CASE WHEN status = 'trial' THEN 'trial' ELSE status END,
          updated_at = now()
        WHERE id = $2
      `, [plan.id, existingSubscription.id]);
    } else {
      // Create new subscription with trial period
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7); // 7 days trial
      
      await query(`
        INSERT INTO qs_store_subscriptions (
          store_id, plan_id, status, trial_ends_at
        ) VALUES ($1, $2, 'trial', $3)
        ON CONFLICT (store_id) DO UPDATE SET
          plan_id = $2,
          trial_ends_at = CASE 
            WHEN qs_store_subscriptions.status = 'trial' THEN qs_store_subscriptions.trial_ends_at
            ELSE $3
          END,
          updated_at = now()
      `, [storeData.id, plan.id, trialEndsAt]);
    }
    
    return NextResponse.json({
      success: true,
      payment_url: result.data.payment_page_link,
      page_request_uid: result.data.page_request_uid,
      qr_code: result.data.qr_code_image,
      plan: {
        name: plan.name,
        display_name: plan.display_name,
        price: plan.price,
        discount_amount: discountAmount,
        vat_amount: vatAmount,
        total_amount: totalAmount,
      },
      coupon: coupon ? {
        code: coupon.code,
        type: coupon.type,
        discount: discountAmount,
      } : null,
    });
  } catch (error) {
    console.error('[Subscribe] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate payment link' },
      { status: 500 }
    );
  }
}

