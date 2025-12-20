/**
 * Commission Billing Cron Job
 * 
 * POST /api/cron/commissions - Calculate and charge commissions
 * 
 * Runs:
 * - 1st of each month: Calculate previous month's commissions for all stores
 * - 15th of each month: Charge stores with commissions over ₪5,000
 * 
 * Header: Authorization: Bearer {CRON_SECRET}
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getPayPlusClient } from '@/lib/payplus';

const COMMISSION_THRESHOLD = 5000; // ₪5,000 threshold for mid-month billing
const VAT_PERCENTAGE = 18;

// Verify cron secret
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;
  
  const token = authHeader.replace('Bearer ', '');
  return token === process.env.CRON_SECRET;
}

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const today = new Date();
  const dayOfMonth = today.getDate();
  
  console.log(`[Commissions Cron] Running on day ${dayOfMonth} of month`);
  
  const results = {
    calculated: 0,
    charged: 0,
    failed: 0,
    total_commission: 0,
    errors: [] as string[],
  };
  
  try {
    // Determine what to do based on day of month
    if (dayOfMonth === 1) {
      // First of month: Calculate and charge previous month's commissions
      await calculateMonthlyCommissions(results);
      await chargeCommissions(results, 'monthly');
    } else if (dayOfMonth === 15) {
      // 15th: Charge high-value commissions (over threshold)
      await chargeCommissions(results, 'mid_month');
    } else {
      // Other days: Just check for accumulated commissions (for manual runs)
      const { searchParams } = new URL(request.url);
      const forceCalculate = searchParams.get('calculate') === 'true';
      const forceCharge = searchParams.get('charge') === 'true';
      
      if (forceCalculate) {
        await calculateMonthlyCommissions(results);
      }
      if (forceCharge) {
        await chargeCommissions(results, 'monthly');
      }
    }
    
    console.log('[Commissions Cron] Completed:', results);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      day_of_month: dayOfMonth,
      results,
    });
    
  } catch (error) {
    console.error('[Commissions Cron] Fatal error:', error);
    return NextResponse.json(
      { error: 'Commission cron failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

/**
 * Calculate commissions for the previous month
 */
async function calculateMonthlyCommissions(results: { calculated: number; errors: string[] }) {
  // Get previous month date range
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of previous month
  
  console.log(`[Commissions] Calculating for period: ${periodStart.toISOString()} - ${periodEnd.toISOString()}`);
  
  // Find all Pro stores with commission rate
  const proStores = await query<{
    store_id: number;
    store_name: string;
    commission_rate: number;
  }>(`
    SELECT 
      s.id as store_id,
      s.name as store_name,
      p.commission_percentage as commission_rate
    FROM stores s
    JOIN qs_store_subscriptions sub ON sub.store_id = s.id
    JOIN qs_subscription_plans p ON sub.plan_id = p.id
    WHERE sub.status = 'active'
      AND p.commission_percentage > 0
  `);
  
  console.log(`[Commissions] Found ${proStores.length} Pro stores to process`);
  
  for (const store of proStores) {
    try {
      // Check if we already calculated for this period
      const existing = await queryOne<{ id: number }>(`
        SELECT id FROM qs_commission_charges
        WHERE store_id = $1
          AND period_start = $2
          AND period_end = $3
      `, [store.store_id, periodStart, periodEnd]);
      
      if (existing) {
        console.log(`[Commissions] Already calculated for store ${store.store_id}`);
        continue;
      }
      
      // Calculate total sales for the period
      const salesData = await queryOne<{
        total_orders: number;
        total_sales: number;
      }>(`
        SELECT 
          COUNT(*)::int as total_orders,
          COALESCE(SUM(total_price), 0)::numeric as total_sales
        FROM orders
        WHERE store_id = $1
          AND financial_status IN ('paid', 'partially_paid')
          AND created_at >= $2
          AND created_at <= $3
      `, [store.store_id, periodStart, periodEnd]);
      
      if (!salesData || salesData.total_sales === 0) {
        console.log(`[Commissions] No sales for store ${store.store_id}`);
        continue;
      }
      
      // Calculate commission
      const commissionAmount = Math.round(salesData.total_sales * store.commission_rate * 100) / 100;
      const vatAmount = Math.round(commissionAmount * (VAT_PERCENTAGE / 100) * 100) / 100;
      const totalAmount = Math.round((commissionAmount + vatAmount) * 100) / 100;
      
      console.log(`[Commissions] Store ${store.store_id}: Sales ₪${salesData.total_sales}, Commission ₪${totalAmount}`);
      
      // Create commission charge record
      await query(`
        INSERT INTO qs_commission_charges (
          store_id, period_start, period_end, charge_type,
          total_orders, total_sales, commission_rate,
          commission_amount, vat_amount, total_amount,
          status, calculated_at
        ) VALUES ($1, $2, $3, 'monthly', $4, $5, $6, $7, $8, $9, 'calculated', now())
      `, [
        store.store_id,
        periodStart,
        periodEnd,
        salesData.total_orders,
        salesData.total_sales,
        store.commission_rate,
        commissionAmount,
        vatAmount,
        totalAmount,
      ]);
      
      results.calculated++;
      
    } catch (error) {
      console.error(`[Commissions] Error calculating for store ${store.store_id}:`, error);
      results.errors.push(`Store ${store.store_id}: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }
}

/**
 * Charge calculated commissions
 */
async function chargeCommissions(
  results: { charged: number; failed: number; total_commission: number; errors: string[] },
  chargeType: 'monthly' | 'mid_month'
) {
  // Find charges to process
  let whereClause = `status = 'calculated'`;
  
  if (chargeType === 'mid_month') {
    // Only charge if over threshold
    whereClause += ` AND total_amount >= ${COMMISSION_THRESHOLD}`;
  }
  
  const pendingCharges = await query<{
    id: number;
    store_id: number;
    store_name: string;
    total_amount: number;
    commission_amount: number;
    vat_amount: number;
    total_sales: number;
    period_start: Date;
    period_end: Date;
    token_uid: string;
    customer_uid: string | null;
  }>(`
    SELECT 
      cc.id,
      cc.store_id,
      s.name as store_name,
      cc.total_amount,
      cc.commission_amount,
      cc.vat_amount,
      cc.total_sales,
      cc.period_start,
      cc.period_end,
      t.payplus_token_uid as token_uid,
      t.payplus_customer_uid as customer_uid
    FROM qs_commission_charges cc
    JOIN stores s ON cc.store_id = s.id
    LEFT JOIN qs_payment_tokens t ON t.store_id = cc.store_id AND t.is_primary = true AND t.is_active = true
    WHERE ${whereClause}
    ORDER BY cc.total_amount DESC
  `);
  
  console.log(`[Commissions] Found ${pendingCharges.length} charges to process`);
  
  if (pendingCharges.length === 0) return;
  
  const payplus = getPayPlusClient();
  
  for (const charge of pendingCharges) {
    try {
      if (!charge.token_uid) {
        console.error(`[Commissions] No payment token for store ${charge.store_id}`);
        results.errors.push(`Store ${charge.store_id}: No payment token`);
        results.failed++;
        continue;
      }
      
      console.log(`[Commissions] Charging store ${charge.store_id}: ₪${charge.total_amount}`);
      
      // Format period for description
      const periodStr = `${charge.period_start.toLocaleDateString('he-IL')} - ${charge.period_end.toLocaleDateString('he-IL')}`;
      
      // Charge the customer
      const chargeResult = await payplus.chargeFromToken({
        amount: charge.total_amount,
        token: charge.token_uid,
        customer_uid: charge.customer_uid || undefined,
        more_info: charge.store_id.toString(),
        more_info_2: `commission_${charge.id}`,
        products: [{
          name: `עמלת מכירות - ${periodStr}`,
          quantity: 1,
          price: charge.total_amount,
        }],
        initial_invoice: true,
      });
      
      // Update commission charge record
      await query(`
        UPDATE qs_commission_charges
        SET status = 'charged', charged_at = now(), updated_at = now()
        WHERE id = $1
      `, [charge.id]);
      
      // Create billing transaction
      await query(`
        INSERT INTO qs_billing_transactions (
          store_id, type, amount, vat_amount, total_amount,
          status, payplus_transaction_uid, payplus_approval_num, payplus_voucher_num,
          description, metadata, processed_at
        ) VALUES ($1, 'commission', $2, $3, $4, 'success', $5, $6, $7, $8, $9, now())
      `, [
        charge.store_id,
        charge.commission_amount,
        charge.vat_amount,
        charge.total_amount,
        chargeResult.data.transaction_uid,
        chargeResult.data.approval_num,
        chargeResult.data.voucher_num,
        `עמלת מכירות (${(charge.commission_amount / charge.total_sales * 100).toFixed(1)}%) - ${periodStr}`,
        JSON.stringify({
          commission_charge_id: charge.id,
          total_sales: charge.total_sales,
          period_start: charge.period_start,
          period_end: charge.period_end,
        }),
      ]);
      
      results.charged++;
      results.total_commission += charge.total_amount;
      
      console.log(`[Commissions] Successfully charged store ${charge.store_id}`);
      
    } catch (error) {
      console.error(`[Commissions] Failed to charge store ${charge.store_id}:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.errors.push(`Store ${charge.store_id}: ${errorMessage}`);
      
      // Mark as failed
      await query(`
        UPDATE qs_commission_charges
        SET status = 'failed', updated_at = now()
        WHERE id = $1
      `, [charge.id]);
      
      results.failed++;
    }
  }
}

// Also support GET for Vercel Cron
export async function GET(request: NextRequest) {
  return POST(request);
}

