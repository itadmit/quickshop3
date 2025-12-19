import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getStorePaymentGateway } from '@/lib/payments';
import { PaymentTransaction } from '@/types/payment';
import { eventBus } from '@/lib/events/eventBus';
import { sendOrderReceiptEmail } from '@/lib/order-email';

/**
 * GET /api/payments/callback
 * 
 * Handle callback from payment provider after customer completes payment.
 * Validates the payment and updates order status.
 * 
 * Supports all payment providers through unified handling:
 * - PayPlus: orderId, more_info, transaction_uid, status
 * - Pelecard: ParamX, ConfirmationKey, ResultCode
 * - PayMe: processId, processToken
 * - Meshulam: transactionId, transactionToken
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryParams: Record<string, string> = {};
    
    // Convert searchParams to object
    searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
    
    console.log('[Payment Callback] Received:', JSON.stringify(queryParams, null, 2));
    
    // ========================================
    // STEP 1: Find order/transaction
    // ========================================
    
    // Try multiple methods to find the order:
    // 1. Direct orderId (PayPlus, our callback URL)
    // 2. more_info (PayPlus internal)
    // 3. ParamX/userKey (Pelecard)
    // 4. processId (PayMe/Meshulam)
    
    const orderId = queryParams.orderId || queryParams.more_info;
    const storeSlug = queryParams.storeSlug;
    const userKey = queryParams.ParamX || queryParams.paramX || queryParams.UserKey || queryParams.userKey;
    const processId = queryParams.processId;
    
    let order: any = null;
    let transaction: PaymentTransaction | null = null;
    
    // Method 1: Direct orderId
    if (orderId) {
      order = await queryOne<any>(
        `SELECT o.*, s.slug as store_slug FROM orders o 
         JOIN stores s ON o.store_id = s.id 
         WHERE o.id = $1`,
        [parseInt(orderId, 10)]
      );
      
      if (order) {
        transaction = await queryOne<PaymentTransaction>(
          `SELECT * FROM payment_transactions 
           WHERE order_id = $1 AND status = 'pending'
           ORDER BY created_at DESC LIMIT 1`,
          [order.id]
        );
      }
    }
    
    // Method 2: userKey (Pelecard)
    if (!order && userKey) {
      transaction = await queryOne<PaymentTransaction>(
        `SELECT * FROM payment_transactions 
         WHERE user_key = $1 AND status = 'pending'
         ORDER BY created_at DESC LIMIT 1`,
        [userKey]
      );
      
      if (transaction) {
        order = await queryOne<any>(
          `SELECT o.*, s.slug as store_slug FROM orders o 
           JOIN stores s ON o.store_id = s.id 
           WHERE o.id = $1`,
          [transaction.order_id]
        );
      }
    }
    
    // Method 3: processId (PayMe/Meshulam)
    if (!order && processId) {
      transaction = await queryOne<PaymentTransaction>(
        `SELECT * FROM payment_transactions 
         WHERE external_transaction_id = $1 AND status = 'pending'
         ORDER BY created_at DESC LIMIT 1`,
        [processId]
      );
      
      if (transaction) {
        order = await queryOne<any>(
          `SELECT o.*, s.slug as store_slug FROM orders o 
           JOIN stores s ON o.store_id = s.id 
           WHERE o.id = $1`,
          [transaction.order_id]
        );
      }
    }
    
    // Use storeSlug from params if order doesn't have it
    const finalStoreSlug = order?.store_slug || storeSlug || 'shop';
    
    if (!order) {
      console.error('[Payment Callback] Order not found. Params:', { orderId, userKey, processId });
      return NextResponse.redirect(new URL(`/shops/${finalStoreSlug}/checkout?error=order_not_found`, request.url));
    }
    
    // ========================================
    // STEP 2: Check if already processed
    // ========================================
    
    if (order.financial_status === 'paid') {
      console.log('[Payment Callback] Order already paid, redirecting to success');
      return NextResponse.redirect(
        new URL(`/shops/${order.store_slug}/checkout/success?orderId=${order.id}`, request.url)
      );
    }
    
    // ========================================
    // STEP 3: Get payment gateway
    // ========================================
    
    const gateway = await getStorePaymentGateway(order.store_id);
    if (!gateway) {
      console.error('[Payment Callback] Gateway not found for store:', order.store_id);
      return NextResponse.redirect(
        new URL(`/shops/${order.store_slug}/checkout?error=gateway_not_found`, request.url)
      );
    }
    
    // ========================================
    // STEP 4: Validate payment with gateway
    // ========================================
    
    const validationResult = await gateway.validateCallback({ queryParams });
    
    console.log('[Payment Callback] Validation result:', {
      success: validationResult.success,
      paymentSuccess: validationResult.paymentSuccess,
      error: validationResult.error,
    });
    
    // ========================================
    // STEP 5: Handle validation result
    // ========================================
    
    if (!validationResult.success) {
      // Validation request failed
      if (transaction) {
        await updateTransactionStatus(transaction.id, 'failed', validationResult);
      }
      return NextResponse.redirect(
        new URL(`/shops/${order.store_slug}/checkout?error=validation_failed&orderId=${order.id}`, request.url)
      );
    }
    
    if (!validationResult.paymentSuccess) {
      // Payment was declined
      if (transaction) {
        await updateTransactionStatus(transaction.id, 'failed', validationResult);
      }
      
      await query(
        `UPDATE orders SET financial_status = 'failed', updated_at = now() WHERE id = $1`,
        [order.id]
      );
      
      return NextResponse.redirect(
        new URL(`/shops/${order.store_slug}/checkout?error=payment_declined&message=${encodeURIComponent(validationResult.error || '')}`, request.url)
      );
    }
    
    // ========================================
    // STEP 6: Payment succeeded! Update records
    // ========================================
    
    if (transaction) {
      await updateTransactionStatus(transaction.id, 'completed', validationResult);
    }
    
    await query(
      `UPDATE orders SET 
        financial_status = 'paid',
        updated_at = now()
       WHERE id = $1`,
      [order.id]
    );
    
    console.log('[Payment Callback] Order updated to paid:', order.id);
    
    // ========================================
    // STEP 7: Emit events and send email
    // ========================================
    
    // Emit order paid event
    await eventBus.emitEvent('order.paid', {
      order: order,
      order_id: order.id,
      order_number: order.order_number,
      total: order.total_price,
      transaction_id: validationResult.externalTransactionId,
    }, {
      store_id: order.store_id,
      source: 'payment_callback',
    });
    
    // Send order receipt email
    sendOrderReceiptEmail(order.id, order.store_id).catch((error) => {
      console.warn('[Payment Callback] Failed to send order receipt email:', error);
    });
    
    // ========================================
    // STEP 8: Redirect to success page
    // ========================================
    
    return NextResponse.redirect(
      new URL(`/shops/${order.store_slug}/checkout/success?orderId=${order.id}`, request.url)
    );
    
  } catch (error: any) {
    console.error('[Payment Callback] Error:', error);
    return NextResponse.redirect(new URL('/checkout/error?reason=internal_error', request.url));
  }
}

/**
 * POST /api/payments/callback
 * 
 * Some providers send POST instead of GET
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const searchParams = request.nextUrl.searchParams;
    
    // Merge query params and body
    const queryParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
    
    // Create a new request with merged params
    const url = new URL(request.url);
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string') {
        url.searchParams.set(key, value);
      }
    }
    
    // Call GET handler
    const newRequest = new NextRequest(url, { method: 'GET' });
    return GET(newRequest);
    
  } catch (error) {
    // If body parsing fails, try GET handler
    return GET(request);
  }
}

async function updateTransactionStatus(
  transactionId: number,
  status: 'completed' | 'failed',
  result: any
) {
  await query(
    `UPDATE payment_transactions SET
      status = $1,
      external_transaction_id = COALESCE($2, external_transaction_id),
      approval_number = $3,
      card_last_four = $4,
      card_brand = $5,
      card_expiry = $6,
      token = $7,
      confirmation_key = $8,
      error_code = $9,
      error_message = $10,
      raw_response = $11,
      updated_at = now()
     WHERE id = $12`,
    [
      status,
      result.externalTransactionId || null,
      result.approvalNumber || null,
      result.cardLastFour || null,
      result.cardBrand || null,
      result.cardExpiry || null,
      result.token || null,
      result.confirmationKey || null,
      result.errorCode || null,
      result.error || null,
      result.rawResponse ? JSON.stringify(result.rawResponse) : null,
      transactionId,
    ]
  );
}
