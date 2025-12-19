import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getStorePaymentGateway } from '@/lib/payments';
import { PaymentTransaction } from '@/types/payment';
import { getUserFromRequest } from '@/lib/auth';
import { eventBus } from '@/lib/events/eventBus';

interface RefundRequest {
  orderId: number;
  transactionId?: number;
  amount?: number;
  reason?: string;
}

/**
 * POST /api/payments/refund
 * 
 * Refund a payment (full or partial).
 * Called from order management in dashboard.
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body: RefundRequest = await request.json();
    const { orderId, transactionId, amount, reason } = body;
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing orderId' },
        { status: 400 }
      );
    }
    
    // Get order and verify ownership
    const order = await queryOne<any>(
      'SELECT * FROM orders WHERE id = $1 AND store_id = $2',
      [orderId, user.store_id]
    );
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Get the original transaction
    let transaction: PaymentTransaction | null = null;
    
    if (transactionId) {
      transaction = await queryOne<PaymentTransaction>(
        `SELECT * FROM payment_transactions 
         WHERE id = $1 AND order_id = $2 AND store_id = $3 
         AND transaction_type = 'charge' AND status = 'completed'`,
        [transactionId, orderId, user.store_id]
      );
    } else {
      // Get the latest successful charge transaction for this order
      transaction = await queryOne<PaymentTransaction>(
        `SELECT * FROM payment_transactions 
         WHERE order_id = $1 AND store_id = $2 
         AND transaction_type = 'charge' AND status = 'completed'
         ORDER BY created_at DESC LIMIT 1`,
        [orderId, user.store_id]
      );
    }
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'No successful payment transaction found for this order' },
        { status: 400 }
      );
    }
    
    if (!transaction.external_transaction_id) {
      return NextResponse.json(
        { error: 'Transaction does not have an external ID for refund' },
        { status: 400 }
      );
    }
    
    // Validate refund amount
    const refundAmount = amount || Number(transaction.amount);
    if (refundAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid refund amount' },
        { status: 400 }
      );
    }
    
    if (refundAmount > Number(transaction.amount)) {
      return NextResponse.json(
        { error: 'Refund amount cannot exceed original transaction amount' },
        { status: 400 }
      );
    }
    
    // Get payment gateway
    const gateway = await getStorePaymentGateway(user.store_id);
    if (!gateway) {
      return NextResponse.json(
        { error: 'No payment gateway configured' },
        { status: 400 }
      );
    }
    
    // Process refund
    const refundResult = await gateway.refund({
      transactionId: String(transaction.id),
      externalTransactionId: transaction.external_transaction_id,
      amount: refundAmount,
      reason: reason,
    });
    
    if (!refundResult.success) {
      console.error('[Refund] Failed:', refundResult.error);
      return NextResponse.json(
        { error: refundResult.error || 'Refund failed' },
        { status: 500 }
      );
    }
    
    // Create refund transaction record
    const refundTransaction = await queryOne<PaymentTransaction>(
      `INSERT INTO payment_transactions (
        store_id, order_id, provider, external_transaction_id,
        amount, currency, transaction_type, status,
        original_transaction_id, refund_amount, refund_reason,
        raw_response, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now(), now())
      RETURNING *`,
      [
        user.store_id,
        orderId,
        gateway.provider,
        refundResult.refundId || transaction.external_transaction_id,
        refundAmount,
        transaction.currency || 'ILS',
        'refund',
        'completed',
        transaction.id,
        refundAmount,
        reason || null,
        refundResult.rawResponse ? JSON.stringify(refundResult.rawResponse) : null,
      ]
    );
    
    // Update original transaction status if full refund
    const isFullRefund = refundAmount >= Number(transaction.amount);
    if (isFullRefund) {
      await query(
        `UPDATE payment_transactions SET status = 'refunded', updated_at = now() WHERE id = $1`,
        [transaction.id]
      );
    }
    
    // Update order financial status
    const newFinancialStatus = isFullRefund ? 'refunded' : 'partially_refunded';
    await query(
      `UPDATE orders SET financial_status = $1, updated_at = now() WHERE id = $2`,
      [newFinancialStatus, orderId]
    );
    
    // Emit refund event
    await eventBus.emitEvent('order.refunded', {
      order_id: orderId,
      order_number: order.order_number,
      refund_amount: refundAmount,
      is_full_refund: isFullRefund,
      reason: reason,
      refund_transaction_id: refundTransaction?.id,
    }, {
      store_id: user.store_id,
      source: 'dashboard',
      user_id: user.id,
    });
    
    return NextResponse.json({
      success: true,
      refundId: refundTransaction?.id,
      amount: refundAmount,
      isFullRefund,
      newFinancialStatus,
    });
    
  } catch (error: any) {
    console.error('[Refund] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
