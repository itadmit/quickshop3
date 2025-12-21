/**
 * Daily Billing Cron Job
 * 
 * POST /api/cron/billing - Process daily subscription and plugin renewals
 * 
 * This should be called daily by Upstash Cron
 * 
 * Handles:
 * 1. Block expired trials
 * 2. Charge store subscriptions (Lite/Pro)
 * 3. Charge plugin subscriptions
 * 4. Deactivate cancelled plugins that reached end date
 * 5. Handle cancelled store subscriptions
 * 
 * Header: Authorization: Bearer {CRON_SECRET}
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getPayPlusClient } from '@/lib/payplus';
import { chargeStorePlugins, deactivateExpiredSubscriptions } from '@/lib/plugins/billing';

// Verify cron secret
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;
  
  const token = authHeader.replace('Bearer ', '');
  return token === process.env.CRON_SECRET;
}

export async function POST(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  console.log('[Billing Cron] Starting daily billing run...');
  
  const results = {
    // Store subscriptions
    storeSubscriptions: {
      processed: 0,
      successful: 0,
      failed: 0,
    },
    // Plugin subscriptions
    pluginSubscriptions: {
      processed: 0,
      successful: 0,
      failed: 0,
      totalAmount: 0,
    },
    blocked: 0,
    expiredPlugins: 0,
    errors: [] as string[],
  };
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // =============================================
    // 1. Block expired trial accounts
    // =============================================
    const expiredTrials = await query<{ store_id: number; store_name: string }>(`
      UPDATE qs_store_subscriptions sub
      SET status = 'blocked', updated_at = now()
      FROM stores s
      WHERE sub.store_id = s.id
        AND sub.status = 'trial'
        AND sub.trial_ends_at < $1
      RETURNING sub.store_id, s.name as store_name
    `, [today]);
    
    for (const trial of expiredTrials) {
      console.log(`[Billing Cron] Blocked expired trial: ${trial.store_name} (${trial.store_id})`);
      
      // Deactivate store
      await query(`UPDATE stores SET is_active = false WHERE id = $1`, [trial.store_id]);
      results.blocked++;
    }
    
    // =============================================
    // 2. Charge store subscriptions (Lite/Pro)
    // =============================================
    const dueSubscriptions = await query<{
      subscription_id: number;
      store_id: number;
      store_name: string;
      owner_email: string;
      plan_name: string;
      plan_price: number;
      plan_vat_percentage: number;
      token_uid: string;
      customer_uid: string | null;
      failed_payment_count: number;
    }>(`
      SELECT 
        sub.id as subscription_id,
        sub.store_id,
        s.name as store_name,
        so.email as owner_email,
        p.name as plan_name,
        p.price as plan_price,
        p.vat_percentage as plan_vat_percentage,
        t.payplus_token_uid as token_uid,
        t.payplus_customer_uid as customer_uid,
        sub.failed_payment_count
      FROM qs_store_subscriptions sub
      JOIN stores s ON sub.store_id = s.id
      JOIN store_owners so ON s.owner_id = so.id
      JOIN qs_subscription_plans p ON sub.plan_id = p.id
      LEFT JOIN qs_payment_tokens t ON t.store_id = sub.store_id AND t.is_primary = true AND t.is_active = true
      WHERE sub.status = 'active'
        AND sub.next_payment_date <= $1
        AND sub.cancel_at_period_end = false
      ORDER BY sub.next_payment_date ASC
    `, [today]);
    
    console.log(`[Billing Cron] Found ${dueSubscriptions.length} store subscriptions due for payment`);
    
    const payplus = getPayPlusClient();
    
    for (const sub of dueSubscriptions) {
      results.storeSubscriptions.processed++;
      
      try {
        if (!sub.token_uid) {
          console.error(`[Billing Cron] No payment token for store ${sub.store_id}`);
          results.errors.push(`Store ${sub.store_id}: No payment token`);
          
          // Block after 3 failed attempts
          if (sub.failed_payment_count >= 2) {
            await blockStore(sub.store_id, 'No payment method');
            results.blocked++;
          } else {
            await incrementFailedCount(sub.store_id);
          }
          results.storeSubscriptions.failed++;
          continue;
        }
        
        // Calculate amount with VAT
        const vatAmount = Math.round(sub.plan_price * (sub.plan_vat_percentage / 100) * 100) / 100;
        const totalAmount = Math.round((sub.plan_price + vatAmount) * 100) / 100;
        
        console.log(`[Billing Cron] Charging store ${sub.store_id}: ₪${totalAmount}`);
        
        // Charge the customer
        const chargeResult = await payplus.chargeFromToken({
          amount: totalAmount,
          token: sub.token_uid,
          customer_uid: sub.customer_uid || undefined,
          more_info: sub.store_id.toString(),
          more_info_2: `renewal_${sub.plan_name}`,
          products: [{
            name: `מנוי ${sub.plan_name === 'lite' ? 'Lite' : 'Pro'} - חידוש חודשי`,
            quantity: 1,
            price: totalAmount,
          }],
          initial_invoice: true,
        });
        
        // Update subscription
        const nextPaymentDate = new Date();
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        
        const periodEnd = new Date(nextPaymentDate);
        
        await query(`
          UPDATE qs_store_subscriptions
          SET 
            current_period_start = $1,
            current_period_end = $2,
            next_payment_date = $3,
            last_payment_date = $1,
            last_payment_amount = $4,
            last_payment_status = 'success',
            failed_payment_count = 0,
            updated_at = now()
          WHERE store_id = $5
        `, [new Date(), periodEnd, nextPaymentDate, totalAmount, sub.store_id]);
        
        // Record transaction
        await query(`
          INSERT INTO qs_billing_transactions (
            store_id, subscription_id, type, amount, vat_amount, total_amount,
            status, payplus_transaction_uid, payplus_approval_num, payplus_voucher_num,
            description, processed_at
          ) VALUES ($1, $2, 'subscription', $3, $4, $5, 'success', $6, $7, $8, $9, now())
        `, [
          sub.store_id,
          sub.subscription_id,
          sub.plan_price,
          vatAmount,
          totalAmount,
          chargeResult.data.transaction_uid,
          chargeResult.data.approval_num,
          chargeResult.data.voucher_num,
          `חידוש מנוי ${sub.plan_name === 'lite' ? 'Lite' : 'Pro'}`,
        ]);
        
        // Update token last used
        await query(`
          UPDATE qs_payment_tokens
          SET last_used_at = now()
          WHERE store_id = $1 AND payplus_token_uid = $2
        `, [sub.store_id, sub.token_uid]);
        
        console.log(`[Billing Cron] Successfully charged store ${sub.store_id} for subscription`);
        results.storeSubscriptions.successful++;
        
        // =============================================
        // 3. Charge plugin subscriptions for this store
        // =============================================
        // Using the same token, charge all plugins due today
        const pluginResult = await chargeStorePlugins(
          sub.store_id,
          sub.token_uid,
          sub.customer_uid || undefined
        );
        
        results.pluginSubscriptions.processed += pluginResult.charged + pluginResult.failed;
        results.pluginSubscriptions.successful += pluginResult.charged;
        results.pluginSubscriptions.failed += pluginResult.failed;
        results.pluginSubscriptions.totalAmount += pluginResult.totalAmount;
        
        if (pluginResult.errors.length > 0) {
          results.errors.push(...pluginResult.errors.map(e => `Store ${sub.store_id} plugins: ${e}`));
        }
        
        if (pluginResult.charged > 0) {
          console.log(`[Billing Cron] Charged ${pluginResult.charged} plugins for store ${sub.store_id}: ₪${pluginResult.totalAmount}`);
        }
        
      } catch (error) {
        console.error(`[Billing Cron] Failed to charge store ${sub.store_id}:`, error);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Store ${sub.store_id}: ${errorMessage}`);
        
        // Record failed transaction
        await query(`
          INSERT INTO qs_billing_transactions (
            store_id, subscription_id, type, amount, total_amount,
            status, description, failure_reason
          ) VALUES ($1, $2, 'subscription', $3, $3, 'failed', $4, $5)
        `, [
          sub.store_id,
          sub.subscription_id,
          sub.plan_price,
          `חידוש מנוי - נכשל`,
          errorMessage,
        ]);
        
        // Increment failed count and potentially block
        if (sub.failed_payment_count >= 2) {
          await blockStore(sub.store_id, 'Payment failed 3 times');
          results.blocked++;
        } else {
          await incrementFailedCount(sub.store_id);
        }
        
        results.storeSubscriptions.failed++;
      }
    }
    
    // =============================================
    // 4. Deactivate cancelled plugins that reached end date
    // =============================================
    const deactivatedPlugins = await deactivateExpiredSubscriptions();
    results.expiredPlugins = deactivatedPlugins;
    
    if (deactivatedPlugins > 0) {
      console.log(`[Billing Cron] Deactivated ${deactivatedPlugins} expired plugin subscriptions`);
    }
    
    // =============================================
    // 5. Handle cancelled store subscriptions that reached their end date
    // =============================================
    const expiredCancelled = await query<{ store_id: number }>(`
      UPDATE qs_store_subscriptions
      SET status = 'expired', updated_at = now()
      WHERE status = 'cancelled'
        AND cancel_at_period_end = true
        AND current_period_end < $1
      RETURNING store_id
    `, [today]);
    
    for (const expired of expiredCancelled) {
      await query(`UPDATE stores SET is_active = false WHERE id = $1`, [expired.store_id]);
      results.blocked++;
    }
    
    console.log('[Billing Cron] Completed:', results);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
    
  } catch (error) {
    console.error('[Billing Cron] Fatal error:', error);
    return NextResponse.json(
      { error: 'Billing cron failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

// Helper functions
async function blockStore(storeId: number, reason: string) {
  await query(`
    UPDATE qs_store_subscriptions
    SET status = 'blocked', updated_at = now()
    WHERE store_id = $1
  `, [storeId]);
  
  await query(`
    UPDATE stores
    SET is_active = false, updated_at = now()
    WHERE id = $1
  `, [storeId]);
  
  console.log(`[Billing Cron] Blocked store ${storeId}: ${reason}`);
}

async function incrementFailedCount(storeId: number) {
  await query(`
    UPDATE qs_store_subscriptions
    SET 
      failed_payment_count = failed_payment_count + 1,
      last_payment_status = 'failed',
      updated_at = now()
    WHERE store_id = $1
  `, [storeId]);
}

// Also support GET for Vercel Cron
export async function GET(request: NextRequest) {
  return POST(request);
}
