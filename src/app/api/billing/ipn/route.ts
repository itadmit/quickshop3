/**
 * PayPlus IPN (Instant Payment Notification) Handler
 * 
 * POST /api/billing/ipn - Receive payment notifications from PayPlus
 * 
 * This endpoint handles:
 * - Successful subscription payments
 * - Failed payments
 * - Token creation for future charges
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { IPNPayload } from '@/lib/payplus';

export async function POST(request: NextRequest) {
  let logId: number | null = null;
  
  try {
    const payload: IPNPayload = await request.json();
    
    console.log('[IPN] Received:', JSON.stringify(payload, null, 2));
    
    // Log the IPN request
    const logResult = await queryOne<{ id: number }>(`
      INSERT INTO qs_payplus_ipn_log (
        source, payplus_transaction_uid, request_body, status
      ) VALUES ($1, $2, $3, 'received')
      RETURNING id
    `, ['subscription', payload.transaction_uid, JSON.stringify(payload)]);
    
    logId = logResult?.id || null;
    
    // Extract store ID and plan from more_info fields
    const storeId = payload.more_info ? parseInt(payload.more_info, 10) : null;
    const planName = payload.more_info_2 || null;
    const subscriptionIdStr = payload.more_info_3;
    
    if (!storeId) {
      console.error('[IPN] Missing store_id in more_info');
      await updateIpnLog(logId, 'ignored', 'Missing store_id');
      return NextResponse.json({ status: 'ignored', reason: 'missing_store_id' });
    }
    
    // Check payment status
    const isSuccess = payload.status === 'approved' || payload.status_code === '000';
    
    if (!isSuccess) {
      console.log('[IPN] Payment failed:', payload.status, payload.status_code);
      
      // Update subscription status to reflect failed payment
      await query(`
        UPDATE qs_store_subscriptions
        SET 
          last_payment_status = 'failed',
          failed_payment_count = failed_payment_count + 1,
          updated_at = now()
        WHERE store_id = $1
      `, [storeId]);
      
      // Log the failed transaction
      await query(`
        INSERT INTO qs_billing_transactions (
          store_id, type, amount, vat_amount, total_amount,
          status, payplus_transaction_uid, description, failure_reason
        ) VALUES ($1, 'subscription', $2, 0, $2, 'failed', $3, $4, $5)
      `, [
        storeId,
        payload.amount,
        payload.transaction_uid,
        `תשלום נכשל - ${planName}`,
        payload.status || 'Unknown error',
      ]);
      
      await updateIpnLog(logId, 'processed', null);
      return NextResponse.json({ status: 'processed', payment_status: 'failed' });
    }
    
    // Payment successful!
    console.log('[IPN] Payment successful for store:', storeId);
    
    // Get plan details
    const plan = await queryOne<{
      id: number;
      price: number;
      vat_percentage: number;
      commission_percentage: number;
      has_checkout: boolean;
    }>(`
      SELECT id, price, vat_percentage, commission_percentage, has_checkout
      FROM qs_subscription_plans
      WHERE name = $1
    `, [planName]);
    
    if (!plan) {
      console.error('[IPN] Plan not found:', planName);
      await updateIpnLog(logId, 'failed', 'Plan not found');
      return NextResponse.json({ status: 'error', reason: 'plan_not_found' }, { status: 400 });
    }
    
    // Calculate next payment date (1 month from now)
    const nextPaymentDate = new Date();
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    
    const now = new Date();
    const periodEnd = new Date(nextPaymentDate);
    
    // Update or create subscription
    await query(`
      INSERT INTO qs_store_subscriptions (
        store_id, plan_id, status,
        current_period_start, current_period_end, next_payment_date,
        payplus_customer_uid,
        last_payment_date, last_payment_amount, last_payment_status,
        failed_payment_count, cancel_at_period_end
      ) VALUES (
        $1, $2, 'active',
        $3, $4, $5,
        $6,
        $3, $7, 'success',
        0, false
      )
      ON CONFLICT (store_id) DO UPDATE SET
        plan_id = $2,
        status = 'active',
        current_period_start = $3,
        current_period_end = $4,
        next_payment_date = $5,
        payplus_customer_uid = COALESCE($6, qs_store_subscriptions.payplus_customer_uid),
        last_payment_date = $3,
        last_payment_amount = $7,
        last_payment_status = 'success',
        failed_payment_count = 0,
        cancel_at_period_end = false,
        trial_ends_at = NULL,
        updated_at = now()
    `, [
      storeId,
      plan.id,
      now,
      periodEnd,
      nextPaymentDate,
      payload.customer_uid || null,
      payload.amount,
    ]);
    
    // Save payment token if provided
    if (payload.token) {
      console.log('[IPN] Saving payment token');
      
      // Deactivate old tokens
      await query(`
        UPDATE qs_payment_tokens
        SET is_primary = false, updated_at = now()
        WHERE store_id = $1
      `, [storeId]);
      
      // Insert new token
      await query(`
        INSERT INTO qs_payment_tokens (
          store_id, payplus_token_uid, payplus_customer_uid,
          four_digits, expiry_month, expiry_year, brand,
          is_primary, is_active, last_used_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, true, now())
        ON CONFLICT (store_id, payplus_token_uid) DO UPDATE SET
          payplus_customer_uid = COALESCE($3, qs_payment_tokens.payplus_customer_uid),
          four_digits = COALESCE($4, qs_payment_tokens.four_digits),
          expiry_month = COALESCE($5, qs_payment_tokens.expiry_month),
          expiry_year = COALESCE($6, qs_payment_tokens.expiry_year),
          brand = COALESCE($7, qs_payment_tokens.brand),
          is_primary = true,
          is_active = true,
          last_used_at = now(),
          updated_at = now()
      `, [
        storeId,
        payload.token,
        payload.customer_uid,
        payload.four_digits,
        payload.expiry_month,
        payload.expiry_year,
        payload.brand_name,
      ]);
    }
    
    // Record the successful transaction
    await query(`
      INSERT INTO qs_billing_transactions (
        store_id, type, amount, vat_amount, total_amount,
        status, payplus_transaction_uid, payplus_approval_num, payplus_voucher_num,
        description, processed_at
      ) VALUES ($1, 'subscription', $2, $3, $4, 'success', $5, $6, $7, $8, now())
    `, [
      storeId,
      plan.price,
      payload.amount - plan.price, // VAT amount
      payload.amount,
      payload.transaction_uid,
      payload.approval_number,
      payload.voucher_number,
      `מנוי ${planName === 'lite' ? 'Lite' : 'Pro'} - תשלום חודשי`,
    ]);
    
    // If downgrading from Pro to Lite, handle product deletion
    if (planName === 'lite' && !plan.has_checkout) {
      // Mark that products should be reviewed (don't delete immediately)
      await query(`
        UPDATE stores
        SET plan = 'lite', updated_at = now()
        WHERE id = $1
      `, [storeId]);
      
      // TODO: Notify user that checkout is disabled and products will be catalog-only
    } else {
      await query(`
        UPDATE stores
        SET plan = 'pro', updated_at = now()
        WHERE id = $1
      `, [storeId]);
    }
    
    await updateIpnLog(logId, 'processed', null);
    
    return NextResponse.json({
      status: 'success',
      store_id: storeId,
      plan: planName,
      next_payment: nextPaymentDate.toISOString(),
    });
    
  } catch (error) {
    console.error('[IPN] Error:', error);
    
    if (logId) {
      await updateIpnLog(logId, 'failed', error instanceof Error ? error.message : 'Unknown error');
    }
    
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to update IPN log
async function updateIpnLog(logId: number | null, status: string, errorMessage: string | null) {
  if (!logId) return;
  
  try {
    await query(`
      UPDATE qs_payplus_ipn_log
      SET status = $1, error_message = $2, processed_at = now()
      WHERE id = $3
    `, [status, errorMessage, logId]);
  } catch (e) {
    console.error('[IPN] Failed to update log:', e);
  }
}

// Add unique constraint for token (needs to be in schema)
// This is handled in the ON CONFLICT clause above

