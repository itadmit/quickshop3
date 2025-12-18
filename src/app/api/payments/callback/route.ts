import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { StorePaymentIntegration, PaymentTransaction } from '@/types/payment';
import { PelecardAdapter } from '@/lib/payments/adapters/PelecardAdapter';
import { eventBus } from '@/lib/events/eventBus';

// POST /api/payments/callback - Handle payment callback from provider
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data: Record<string, any> = {};
    
    formData.forEach((value, key) => {
      data[key] = value;
    });

    console.log('[PaymentCallback] Received callback:', data);

    // Parse PeleCard callback
    const callbackData = PelecardAdapter.parseCallback(data);

    if (!callbackData.transactionId) {
      console.error('[PaymentCallback] No transaction ID in callback');
      return NextResponse.json({ error: 'Invalid callback data' }, { status: 400 });
    }

    // Find the pending transaction
    const transaction = await queryOne<PaymentTransaction & { store_id: number }>(
      `SELECT pt.*, pt.store_id 
       FROM payment_transactions pt
       WHERE pt.external_transaction_id = $1`,
      [callbackData.transactionId]
    );

    if (!transaction) {
      console.error('[PaymentCallback] Transaction not found:', callbackData.transactionId);
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Get integration for validation
    const integration = await queryOne<StorePaymentIntegration>(
      'SELECT * FROM store_payment_integrations WHERE id = $1',
      [transaction.integration_id]
    );

    if (!integration) {
      console.error('[PaymentCallback] Integration not found');
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    // Update transaction based on callback status
    const isSuccess = callbackData.isSuccess;
    const newStatus = isSuccess ? 'completed' : 'failed';

    await query(
      `UPDATE payment_transactions 
       SET status = $1, 
           confirmation_key = $2, 
           approval_number = $3, 
           token = $4,
           error_code = $5,
           raw_response = $6,
           updated_at = now()
       WHERE id = $7`,
      [
        newStatus,
        callbackData.confirmationKey || null,
        callbackData.approvalNumber || null,
        callbackData.token || null,
        isSuccess ? null : callbackData.statusCode,
        JSON.stringify(data),
        transaction.id,
      ]
    );

    // Update order status
    if (isSuccess && transaction.order_id) {
      await query(
        `UPDATE orders 
         SET financial_status = 'paid', updated_at = now() 
         WHERE id = $1`,
        [transaction.order_id]
      );

      // Emit order.paid event
      await eventBus.emit('order.paid', {
        order_id: transaction.order_id,
        transaction_id: transaction.id,
        amount: transaction.amount,
      }, {
        store_id: transaction.store_id,
        source: 'payment_callback',
      });
    } else if (transaction.order_id) {
      await query(
        `UPDATE orders 
         SET financial_status = 'payment_failed', updated_at = now() 
         WHERE id = $1`,
        [transaction.order_id]
      );
    }

    // Return success (required by PeleCard)
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[PaymentCallback] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Callback processing failed' },
      { status: 500 }
    );
  }
}

// GET - Some providers use GET for callbacks
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const data: Record<string, any> = {};
  
  searchParams.forEach((value, key) => {
    data[key] = value;
  });

  // Create a fake FormData-like object and call POST
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, String(value));
  });

  // Simulate POST request
  const postRequest = new NextRequest(request.url, {
    method: 'POST',
    body: formData,
  });

  return POST(postRequest);
}

