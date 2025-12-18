import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { StorePaymentIntegration, PaymentTransaction } from '@/types/payment';
import { Order } from '@/types/order';
import { getPaymentAdapter, registerAllPaymentAdapters } from '@/lib/payments';

// POST /api/payments/init - Initialize payment page
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, storeSlug, successUrl, errorUrl } = body;

    if (!orderId || !storeSlug) {
      return NextResponse.json(
        { error: 'orderId and storeSlug are required' },
        { status: 400 }
      );
    }

    // Get store by slug
    const store = await queryOne<{ id: number; name: string }>(
      'SELECT id, name FROM stores WHERE slug = $1',
      [storeSlug]
    );

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Get order
    const order = await queryOne<Order>(
      `SELECT id, order_name, total_price, email, phone, name 
       FROM orders 
       WHERE id = $1 AND store_id = $2`,
      [orderId, store.id]
    );

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get active payment integration
    const integration = await queryOne<StorePaymentIntegration>(
      `SELECT * FROM store_payment_integrations 
       WHERE store_id = $1 AND is_active = true AND is_default = true
       LIMIT 1`,
      [store.id]
    );

    if (!integration) {
      // Try to get any active integration
      const anyIntegration = await queryOne<StorePaymentIntegration>(
        `SELECT * FROM store_payment_integrations 
         WHERE store_id = $1 AND is_active = true
         LIMIT 1`,
        [store.id]
      );

      if (!anyIntegration) {
        return NextResponse.json(
          { error: 'No active payment integration found' },
          { status: 400 }
        );
      }
    }

    const activeIntegration = integration || (await queryOne<StorePaymentIntegration>(
      `SELECT * FROM store_payment_integrations 
       WHERE store_id = $1 AND is_active = true
       LIMIT 1`,
      [store.id]
    ));

    if (!activeIntegration) {
      return NextResponse.json(
        { error: 'No active payment integration found' },
        { status: 400 }
      );
    }

    // Register adapters and get the right one
    registerAllPaymentAdapters();
    const adapter = getPaymentAdapter(activeIntegration.provider, activeIntegration);

    // Build callback URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const callbackUrl = `${baseUrl}/api/payments/callback`;

    // Initialize payment
    const result = await adapter.initPayment({
      order: {
        id: order.id,
        order_name: order.order_name || `#${order.id}`,
        total_price: order.total_price,
        email: order.email,
        phone: order.phone,
        name: order.name,
      },
      storeId: store.id,
      storeSlug,
      integration: activeIntegration,
      successUrl: successUrl || `${baseUrl}/shops/${storeSlug}/checkout/success?orderId=${order.id}`,
      errorUrl: errorUrl || `${baseUrl}/shops/${storeSlug}/checkout?error=payment_failed`,
      callbackUrl,
      createToken: false,
      language: 'he',
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to initialize payment' },
        { status: 400 }
      );
    }

    // Create pending transaction record
    await queryOne<PaymentTransaction>(
      `INSERT INTO payment_transactions (
        store_id, order_id, integration_id, provider, external_transaction_id,
        amount, currency, transaction_type, status, user_key
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id`,
      [
        store.id,
        order.id,
        activeIntegration.id,
        activeIntegration.provider,
        result.transactionId,
        parseFloat(order.total_price),
        'ILS',
        'charge',
        'pending',
        order.id.toString(),
      ]
    );

    // Update order status to awaiting_payment
    await query(
      `UPDATE orders SET financial_status = 'awaiting_payment', updated_at = now() WHERE id = $1`,
      [order.id]
    );

    return NextResponse.json({
      success: true,
      paymentUrl: result.paymentUrl,
      transactionId: result.transactionId,
    });
  } catch (error: any) {
    console.error('Error initializing payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize payment' },
      { status: 500 }
    );
  }
}

