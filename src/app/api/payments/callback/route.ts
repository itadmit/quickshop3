import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getStorePaymentGateway } from '@/lib/payments';
import { PaymentTransaction } from '@/types/payment';
import { eventBus } from '@/lib/events/eventBus';

/**
 * GET /api/payments/callback
 * 
 * Handle callback from payment provider after customer completes payment.
 * Validates the payment and updates order status.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryParams: Record<string, string> = {};
    
    // Convert searchParams to object
    searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
    
    console.log('[Payment Callback] Received:', queryParams);
    
    // Find the pending transaction by user_key (ParamX)
    const userKey = queryParams.ParamX || queryParams.paramX || queryParams.UserKey || queryParams.userKey;
    
    let transaction: PaymentTransaction | null = null;
    
    if (userKey) {
      transaction = await queryOne<PaymentTransaction>(
        `SELECT * FROM payment_transactions 
         WHERE user_key = $1 AND status = 'pending'
         ORDER BY created_at DESC LIMIT 1`,
        [userKey]
      );
    }
    
    if (!transaction) {
      console.error('[Payment Callback] Transaction not found for userKey:', userKey);
      // Redirect to error page
      return NextResponse.redirect(new URL('/checkout/error?reason=transaction_not_found', request.url));
    }
    
    // Get the order
    const order = await queryOne<any>(
      `SELECT o.*, s.slug as store_slug FROM orders o 
       JOIN stores s ON o.store_id = s.id 
       WHERE o.id = $1`,
      [transaction.order_id]
    );
    
    if (!order) {
      console.error('[Payment Callback] Order not found:', transaction.order_id);
      return NextResponse.redirect(new URL('/checkout/error?reason=order_not_found', request.url));
    }
    
    // Get payment gateway
    const gateway = await getStorePaymentGateway(transaction.store_id);
    if (!gateway) {
      console.error('[Payment Callback] Gateway not found for store:', transaction.store_id);
      return NextResponse.redirect(new URL(`/shops/${order.store_slug}/checkout/error?reason=gateway_not_found`, request.url));
    }
    
    // Validate callback with payment provider
    const validationResult = await gateway.validateCallback({
      queryParams,
    });
    
    console.log('[Payment Callback] Validation result:', validationResult);
    
    if (!validationResult.success) {
      // Validation request failed
      await updateTransactionStatus(transaction.id, 'failed', validationResult);
      return NextResponse.redirect(
        new URL(`/shops/${order.store_slug}/checkout/error?reason=validation_failed`, request.url)
      );
    }
    
    if (!validationResult.paymentSuccess) {
      // Payment was declined
      await updateTransactionStatus(transaction.id, 'failed', validationResult);
      
      await query(
        `UPDATE orders SET financial_status = 'failed', updated_at = now() WHERE id = $1`,
        [order.id]
      );
      
      return NextResponse.redirect(
        new URL(`/shops/${order.store_slug}/checkout/error?reason=payment_declined&error=${encodeURIComponent(validationResult.error || '')}`, request.url)
      );
    }
    
    // Payment succeeded!
    await updateTransactionStatus(transaction.id, 'completed', validationResult);
    
    // Update order
    await query(
      `UPDATE orders SET 
        financial_status = 'paid',
        updated_at = now()
       WHERE id = $1`,
      [order.id]
    );
    
    // Emit order paid event
    await eventBus.emitEvent('order.paid', {
      order_id: order.id,
      order_number: order.order_number,
      total: order.total_price,
      transaction_id: validationResult.externalTransactionId,
    }, {
      store_id: order.store_id,
      source: 'payment_callback',
    });
    
    // Redirect to success page
    return NextResponse.redirect(
      new URL(`/shops/${order.store_slug}/checkout/success?order_id=${order.id}`, request.url)
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
