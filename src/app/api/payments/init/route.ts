import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getStorePaymentGateway, PaymentInitParams } from '@/lib/payments';
import { PaymentTransaction } from '@/types/payment';

interface InitPaymentRequest {
  orderId: number;
  storeId?: number;
  storeSlug?: string;
  successUrl?: string;
  cancelUrl?: string;
  errorUrl?: string;
  callbackUrl?: string;
}

/**
 * POST /api/payments/init
 * 
 * Initialize a payment for an order.
 * Returns the payment URL to redirect the customer.
 */
export async function POST(request: NextRequest) {
  try {
    const body: InitPaymentRequest = await request.json();
    const { orderId, storeId, storeSlug, successUrl, cancelUrl, errorUrl, callbackUrl } = body;
    
    // Validate request
    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing orderId' },
        { status: 400 }
      );
    }
    
    // Get order details - support both storeId and storeSlug
    let order: any;
    
    if (storeId) {
      order = await queryOne<any>(
        `SELECT o.*, s.name as store_name, s.slug as store_slug, s.id as store_id
         FROM orders o 
         JOIN stores s ON o.store_id = s.id 
         WHERE o.id = $1 AND o.store_id = $2`,
        [orderId, storeId]
      );
    } else if (storeSlug) {
      order = await queryOne<any>(
        `SELECT o.*, s.name as store_name, s.slug as store_slug, s.id as store_id
         FROM orders o 
         JOIN stores s ON o.store_id = s.id 
         WHERE o.id = $1 AND s.slug = $2`,
        [orderId, storeSlug]
      );
    } else {
      // Try to get order without store verification
      order = await queryOne<any>(
        `SELECT o.*, s.name as store_name, s.slug as store_slug, s.id as store_id
         FROM orders o 
         JOIN stores s ON o.store_id = s.id 
         WHERE o.id = $1`,
        [orderId]
      );
    }
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Check if order is already paid
    if (order.financial_status === 'paid') {
      return NextResponse.json(
        { error: 'Order is already paid' },
        { status: 400 }
      );
    }
    
    // Get payment gateway
    const gateway = await getStorePaymentGateway(order.store_id);
    if (!gateway) {
      // No gateway configured - return gracefully so checkout can continue without payment
      return NextResponse.json(
        { success: false, error: 'No payment gateway configured', noGateway: true },
        { status: 200 }
      );
    }
    
    // Build URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://my-quickshop.com';
    const orderSlug = order.store_slug;
    
    // ⚠️ חשוב: כל הספקים צריכים לחזור דרך ה-callback שלנו
    // ה-callback יעבד את התשלום ויפנה לדף success
    const finalCallbackUrl = callbackUrl || `${baseUrl}/api/payments/callback`;
    
    // ל-success URL נשלח את ה-callback כדי לעבד לפני הצגת דף success
    const finalSuccessUrl = `${baseUrl}/api/payments/callback?orderId=${order.id}&storeSlug=${orderSlug}&type=success_redirect`;
    const finalCancelUrl = cancelUrl || errorUrl || `${baseUrl}/shops/${orderSlug}/checkout?error=payment_cancelled&orderId=${order.id}`;
    
    // Extract customer info
    const shippingAddress = typeof order.shipping_address === 'string' 
      ? JSON.parse(order.shipping_address) 
      : (order.shipping_address || {});
    const billingAddress = typeof order.billing_address === 'string'
      ? JSON.parse(order.billing_address)
      : (order.billing_address || {});
    
    // Build payment params
    const paymentParams: PaymentInitParams = {
      orderId: order.id,
      orderNumber: order.order_number ? `#${order.order_number}` : `#${order.id}`,
      amount: parseFloat(order.total_price),
      currency: order.currency || 'ILS',
      successUrl: finalSuccessUrl,
      cancelUrl: finalCancelUrl,
      callbackUrl: finalCallbackUrl,
      customer: {
        email: order.email || billingAddress.email || '',
        firstName: shippingAddress.first_name || billingAddress.first_name || order.customer_name?.split(' ')[0] || '',
        lastName: shippingAddress.last_name || billingAddress.last_name || order.customer_name?.split(' ').slice(1).join(' ') || '',
        phone: order.phone || shippingAddress.phone || billingAddress.phone || '',
      },
      options: {
        maxInstallments: 12,
        description: `הזמנה ${order.order_number ? `#${order.order_number}` : `#${order.id}`} - ${order.store_name}`,
        language: 'he',
      },
      metadata: {
        orderId: order.id,
        storeId: order.store_id,
      },
    };
    
    // Initialize payment
    const result = await gateway.initPayment(paymentParams);
    
    if (!result.success) {
      console.error('Payment init failed:', result.error);
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to initialize payment' },
        { status: 500 }
      );
    }
    
    // Create payment transaction record
    await queryOne<PaymentTransaction>(
      `INSERT INTO payment_transactions (
        store_id, order_id, provider, external_transaction_id,
        amount, currency, transaction_type, status,
        user_key, raw_request, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), now())
      RETURNING *`,
      [
        order.store_id,
        orderId,
        gateway.provider,
        result.externalTransactionId || null,
        order.total_price,
        order.currency || 'ILS',
        'charge',
        'pending',
        result.transactionId, // Our internal reference (ParamX)
        JSON.stringify(paymentParams),
      ]
    );
    
    // Update order status
    await query(
      `UPDATE orders SET 
        financial_status = 'pending',
        updated_at = now()
       WHERE id = $1`,
      [orderId]
    );
    
    return NextResponse.json({
      success: true,
      paymentUrl: result.paymentUrl,
      transactionId: result.transactionId,
    });
    
  } catch (error: any) {
    console.error('Error initializing payment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
