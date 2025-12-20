/**
 * Subscription Status API
 * 
 * GET /api/billing/status - Get current subscription status
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('store_id');
    
    // Get store
    const targetStoreId = storeId ? parseInt(storeId, 10) : user.store_id;
    
    const store = await queryOne<{
      id: number;
      name: string;
      slug: string;
      plan: string;
      is_active: boolean;
    }>(`
      SELECT s.id, s.name, s.slug, s.plan, s.is_active
      FROM stores s
      JOIN store_owners so ON s.owner_id = so.id
      WHERE s.id = $1 AND so.id = $2
      LIMIT 1
    `, [targetStoreId, user.id]);
    
    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }
    
    // Get subscription details
    const subscription = await queryOne<{
      id: number;
      plan_id: number;
      plan_name: string;
      plan_display_name: string;
      plan_price: number;
      plan_vat_percentage: number;
      plan_commission_percentage: number;
      plan_has_checkout: boolean;
      status: string;
      trial_ends_at: Date | null;
      current_period_start: Date | null;
      current_period_end: Date | null;
      next_payment_date: Date | null;
      last_payment_date: Date | null;
      last_payment_amount: number | null;
      last_payment_status: string | null;
      failed_payment_count: number;
      cancel_at_period_end: boolean;
      cancelled_at: Date | null;
      cancellation_reason: string | null;
    }>(`
      SELECT 
        sub.id,
        sub.plan_id,
        p.name as plan_name,
        p.display_name as plan_display_name,
        p.price as plan_price,
        p.vat_percentage as plan_vat_percentage,
        p.commission_percentage as plan_commission_percentage,
        p.has_checkout as plan_has_checkout,
        sub.status,
        sub.trial_ends_at,
        sub.current_period_start,
        sub.current_period_end,
        sub.next_payment_date,
        sub.last_payment_date,
        sub.last_payment_amount,
        sub.last_payment_status,
        sub.failed_payment_count,
        sub.cancel_at_period_end,
        sub.cancelled_at,
        sub.cancellation_reason
      FROM qs_store_subscriptions sub
      JOIN qs_subscription_plans p ON sub.plan_id = p.id
      WHERE sub.store_id = $1
    `, [store.id]);
    
    // Get payment method (last 4 digits)
    const paymentMethod = await queryOne<{
      four_digits: string;
      brand: string;
      expiry_month: string;
      expiry_year: string;
    }>(`
      SELECT four_digits, brand, expiry_month, expiry_year
      FROM qs_payment_tokens
      WHERE store_id = $1 AND is_primary = true AND is_active = true
      LIMIT 1
    `, [store.id]);
    
    // Get recent transactions
    const transactions = await query<{
      id: number;
      type: string;
      amount: number;
      total_amount: number;
      status: string;
      description: string;
      created_at: Date;
    }>(`
      SELECT id, type, amount, total_amount, status, description, created_at
      FROM qs_billing_transactions
      WHERE store_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [store.id]);
    
    // Calculate trial remaining days
    let trialRemainingDays = null;
    if (subscription?.status === 'trial' && subscription.trial_ends_at) {
      const now = new Date();
      const trialEnd = new Date(subscription.trial_ends_at);
      trialRemainingDays = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }
    
    // Determine if store is blocked
    const isBlocked = !store.is_active || 
      subscription?.status === 'blocked' || 
      subscription?.status === 'expired';
    
    return NextResponse.json({
      success: true,
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        plan: store.plan,
        is_active: store.is_active,
        is_blocked: isBlocked,
      },
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        plan: {
          id: subscription.plan_id,
          name: subscription.plan_name,
          display_name: subscription.plan_display_name,
          price: subscription.plan_price,
          vat_percentage: subscription.plan_vat_percentage,
          commission_percentage: subscription.plan_commission_percentage,
          has_checkout: subscription.plan_has_checkout,
        },
        trial: subscription.status === 'trial' ? {
          ends_at: subscription.trial_ends_at,
          remaining_days: trialRemainingDays,
        } : null,
        billing: {
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          next_payment_date: subscription.next_payment_date,
        },
        last_payment: subscription.last_payment_date ? {
          date: subscription.last_payment_date,
          amount: subscription.last_payment_amount,
          status: subscription.last_payment_status,
        } : null,
        cancellation: subscription.cancel_at_period_end || subscription.cancelled_at ? {
          at_period_end: subscription.cancel_at_period_end,
          cancelled_at: subscription.cancelled_at,
          reason: subscription.cancellation_reason,
          effective_date: subscription.current_period_end,
        } : null,
        failed_payments: subscription.failed_payment_count,
      } : null,
      payment_method: paymentMethod ? {
        last_four: paymentMethod.four_digits,
        brand: paymentMethod.brand,
        expiry: `${paymentMethod.expiry_month}/${paymentMethod.expiry_year}`,
      } : null,
      recent_transactions: transactions,
    });
    
  } catch (error) {
    console.error('[Billing Status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    );
  }
}

