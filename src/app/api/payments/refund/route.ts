import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { StorePaymentIntegration, PaymentTransaction } from '@/types/payment';
import { getUserFromRequest } from '@/lib/auth';
import { getPaymentAdapter, registerAllPaymentAdapters } from '@/lib/payments';
import { eventBus } from '@/lib/events/eventBus';

// POST /api/payments/refund - Refund a transaction
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { transactionId, orderId, amount, reason } = body;

    if (!transactionId && !orderId) {
      return NextResponse.json(
        { error: 'transactionId or orderId is required' },
        { status: 400 }
      );
    }

    // Find the transaction
    let transaction: PaymentTransaction | null = null;
    
    if (transactionId) {
      transaction = await queryOne<PaymentTransaction>(
        `SELECT * FROM payment_transactions 
         WHERE id = $1 AND store_id = $2 AND status = 'completed'`,
        [transactionId, user.store_id]
      );
    } else if (orderId) {
      transaction = await queryOne<PaymentTransaction>(
        `SELECT * FROM payment_transactions 
         WHERE order_id = $1 AND store_id = $2 AND status = 'completed' AND transaction_type = 'charge'
         ORDER BY created_at DESC LIMIT 1`,
        [orderId, user.store_id]
      );
    }

    if (!transaction) {
      return NextResponse.json(
        { error: 'Completed transaction not found' },
        { status: 404 }
      );
    }

    // Get integration
    const integration = await queryOne<StorePaymentIntegration>(
      'SELECT * FROM store_payment_integrations WHERE id = $1',
      [transaction.integration_id]
    );

    if (!integration) {
      return NextResponse.json(
        { error: 'Payment integration not found' },
        { status: 404 }
      );
    }

    // Calculate refund amount
    const refundAmount = amount || transaction.amount;

    // Get adapter and attempt refund
    registerAllPaymentAdapters();
    const adapter = getPaymentAdapter(integration.provider, integration);

    const result = await adapter.refundTransaction(
      transaction.external_transaction_id || '',
      refundAmount
    );

    if (!result.success) {
      // Log failed attempt
      await queryOne(
        `INSERT INTO payment_transactions (
          store_id, order_id, integration_id, provider, 
          amount, currency, transaction_type, status,
          original_transaction_id, refund_amount, refund_reason,
          error_message
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id`,
        [
          user.store_id,
          transaction.order_id,
          integration.id,
          integration.provider,
          refundAmount,
          'ILS',
          'refund',
          'failed',
          transaction.id,
          refundAmount,
          reason || null,
          result.error,
        ]
      );

      return NextResponse.json(
        { error: result.error || 'Refund failed' },
        { status: 400 }
      );
    }

    // Create refund transaction record
    const refundTransaction = await queryOne<PaymentTransaction>(
      `INSERT INTO payment_transactions (
        store_id, order_id, integration_id, provider, external_transaction_id,
        amount, currency, transaction_type, status,
        original_transaction_id, refund_amount, refund_reason
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        user.store_id,
        transaction.order_id,
        integration.id,
        integration.provider,
        result.refundId || null,
        refundAmount,
        'ILS',
        'refund',
        'completed',
        transaction.id,
        refundAmount,
        reason || null,
      ]
    );

    // Update original transaction status
    await query(
      `UPDATE payment_transactions SET status = 'refunded', updated_at = now() WHERE id = $1`,
      [transaction.id]
    );

    // Update order status
    if (transaction.order_id) {
      await query(
        `UPDATE orders SET financial_status = 'refunded', updated_at = now() WHERE id = $1`,
        [transaction.order_id]
      );

      // Emit event
      await eventBus.emit('order.refunded', {
        order_id: transaction.order_id,
        transaction_id: transaction.id,
        refund_transaction_id: refundTransaction?.id,
        amount: refundAmount,
      }, {
        store_id: user.store_id,
        source: 'api',
        user_id: user.id,
      });
    }

    return NextResponse.json({
      success: true,
      refundId: refundTransaction?.id,
      amount: refundAmount,
    });
  } catch (error: any) {
    console.error('Error processing refund:', error);
    return NextResponse.json(
      { error: error.message || 'Refund failed' },
      { status: 500 }
    );
  }
}

