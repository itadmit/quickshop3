'use server';

import { queryOne, query } from '@/lib/db';
import { eventBus } from '@/lib/events/eventBus';
import { sendWelcomeEmail } from '@/lib/customer-email';
import { sendOrderReceiptEmail } from '@/lib/order-email';
import { syncCustomerToContact } from '@/lib/contacts/sync-customer-to-contact';
import crypto from 'crypto';

interface CreateOrderInput {
  storeId: number; // חייב להיות מועבר מהקומפוננטה
  lineItems: Array<{
    variant_id: number;
    product_id: number;
    quantity: number;
    price: number;
    image?: string;
    properties?: Array<{ name: string; value: string }>;
  }>;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    notes?: string;
  };
  total: number;
  deliveryMethod?: 'shipping' | 'pickup';
  paymentMethod?: 'credit_card' | 'bank_transfer' | 'cash' | 'store_credit';
  storeCreditAmount?: number; // סכום קרדיט לשימוש
  customFields?: Record<string, any>;
  discountCodes?: string[]; // קודי קופונים שהוחלו על ההזמנה
}

export async function createOrder(input: CreateOrderInput) {
  const { storeId } = input;
  
  // בדיקת תקינות storeId
  if (!storeId || typeof storeId !== 'number' || storeId <= 0) {
    throw new Error('Invalid storeId');
  }

  // Create customer or get existing
  let customer = await queryOne<{ id: number; first_name: string | null; last_name: string | null; phone: string | null; accepts_marketing: boolean; tags: string | null; note: string | null }>(
    'SELECT id, first_name, last_name, phone, accepts_marketing, tags, note FROM customers WHERE store_id = $1 AND email = $2',
    [storeId, input.customer.email]
  );

  let isNewCustomer = false;
  if (!customer) {
    const newCustomer = await queryOne<{ id: number; first_name: string | null; last_name: string | null; phone: string | null; accepts_marketing: boolean; tags: string | null; note: string | null }>(
      `INSERT INTO customers (store_id, first_name, last_name, email, phone, accepts_marketing, state)
       VALUES ($1, $2, $3, $4, $5, false, 'enabled')
       RETURNING id, first_name, last_name, phone, accepts_marketing, tags, note`,
      [
        storeId,
        input.customer.firstName,
        input.customer.lastName,
        input.customer.email,
        input.customer.phone,
      ]
    );
    customer = newCustomer;
    isNewCustomer = true;
    
    // Sync customer to contact (async, don't block order creation)
    if (customer) {
      syncCustomerToContact(storeId, customer.id, {
        email: input.customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
        phone: customer.phone,
        accepts_marketing: customer.accepts_marketing,
        tags: customer.tags,
        note: customer.note,
      }).catch((error) => {
        console.warn('Failed to sync customer to contact:', error);
      });
    }
    
    // Send welcome email to new customer (async, don't block order creation)
    sendWelcomeEmail(storeId, {
      email: input.customer.email,
      firstName: input.customer.firstName,
      lastName: input.customer.lastName,
    }).catch((error) => {
      console.warn('Failed to send welcome email:', error);
    });
  }

  if (!customer) {
    throw new Error('Failed to create customer');
  }

  // Handle store credit payment
  let finalTotal = input.total;
  if (input.paymentMethod === 'store_credit' && input.storeCreditAmount && input.storeCreditAmount > 0) {
    // Get store credit
    const storeCredit = await queryOne<{ id: number; balance: string }>(
      `SELECT id, balance FROM store_credits WHERE store_id = $1 AND customer_id = $2`,
      [storeId, customer.id]
    );

    if (!storeCredit) {
      throw new Error('אין קרדיט בחנות זמין');
    }

    const creditBalance = parseFloat(storeCredit.balance);
    const creditToUse = Math.min(input.storeCreditAmount, creditBalance, input.total);

    if (creditToUse <= 0) {
      throw new Error('סכום קרדיט לא תקין');
    }

    // Update store credit balance
    const newBalance = creditBalance - creditToUse;
    await queryOne(
      `UPDATE store_credits SET balance = $1, updated_at = now() WHERE id = $2`,
      [newBalance, storeCredit.id]
    );

    // Create transaction record
    await queryOne(
      `INSERT INTO store_credit_transactions (store_credit_id, order_id, amount, transaction_type, description)
       VALUES ($1, NULL, $2, 'used', $3)
       RETURNING id`,
      [
        storeCredit.id,
        creditToUse,
        `תשלום עבור הזמנה`,
      ]
    );

    // Update final total
    finalTotal = Math.max(0, input.total - creditToUse);
  }

  // Get next order number - מתחיל מ-1000
  const lastOrder = await queryOne<{ order_number: number }>(
    'SELECT order_number FROM orders WHERE store_id = $1 ORDER BY order_number DESC LIMIT 1',
    [storeId]
  );
  // אם אין הזמנות קודמות או שהמספר הגבוה ביותר נמוך מ-1000, מתחיל מ-1000
  const orderNumber = lastOrder?.order_number && lastOrder.order_number >= 1000
    ? lastOrder.order_number + 1 
    : 1000;
  const orderName = `#${orderNumber.toString().padStart(4, '0')}`;

  // Generate secure handle for order (מוצפן)
  const orderHandle = crypto.randomBytes(16).toString('hex');

  // Create order with customer name
  const customerName = `${input.customer.firstName} ${input.customer.lastName}`;
  
  // Prepare address object
  const addressObject = {
    first_name: input.customer.firstName,
    last_name: input.customer.lastName,
    address1: input.customer.address,
    city: input.customer.city,
    zip: input.customer.postalCode,
    country: input.customer.country,
    phone: input.customer.phone,
  };
  
  // Prepare note_attributes with delivery and payment methods
  const noteAttributes: Record<string, any> = {
    ...(input.customFields || {}),
    delivery_method: input.deliveryMethod || 'shipping',
    payment_method: input.paymentMethod || 'credit_card',
  };
  
  // Set financial status based on payment method
  let financialStatus = 'pending';
  if (input.paymentMethod === 'store_credit' && finalTotal === 0) {
    // אם שולם במלואו עם קרדיט, הסטטוס הוא paid
    financialStatus = 'paid';
  } else if (input.paymentMethod === 'cash') {
    // מזומן - pending עד שההזמנה נמסרת
    financialStatus = 'pending';
  } else if (input.paymentMethod === 'bank_transfer') {
    // העברה בנקאית - pending עד שהכסף מתקבל
    financialStatus = 'pending';
  }

  // Parse and prepare discount codes
  let discountCodesArray: string[] = [];
  if (input.discountCodes && input.discountCodes.length > 0) {
    discountCodesArray = input.discountCodes.filter(code => code && code.trim().length > 0);
  }

  // Update usage count for each discount code BEFORE creating order
  if (discountCodesArray.length > 0) {
    for (const code of discountCodesArray) {
      await queryOne(
        `UPDATE discount_codes 
         SET usage_count = usage_count + 1, updated_at = now()
         WHERE store_id = $1 AND code = $2 AND is_active = true`,
        [storeId, code.toUpperCase()]
      );
    }
  }

  const order = await queryOne<{ id: number; order_number: number; order_handle: string }>(
    `INSERT INTO orders (
      store_id, customer_id, order_number, order_name, order_handle,
      financial_status, fulfillment_status,
      total_price, subtotal_price, currency,
      billing_address, shipping_address, email, phone, name, note, note_attributes, gateway, discount_codes
    )
    VALUES (
      $1, $2, $7, $8, $12,
      $14, 'unfulfilled',
      $3, $3, 'ILS',
      $4, $4, $5, $9, $10, $6, $11, $13, $15
    )
    RETURNING id, order_number, order_handle`,
    [
      storeId,
      customer.id,
      finalTotal, // Use finalTotal instead of input.total
      JSON.stringify(addressObject),
      input.customer.email,
      input.customer.notes || null,
      orderNumber,
      orderName,
      input.customer.phone,
      customerName,
      JSON.stringify(noteAttributes),
      orderHandle,
      input.paymentMethod || 'credit_card',
      financialStatus,
      discountCodesArray.length > 0 ? JSON.stringify(discountCodesArray) : null,
    ]
  );

  if (!order) {
    throw new Error('Failed to create order');
  }

  // Update store credit transaction with order_id if store credit was used
  if (input.paymentMethod === 'store_credit' && input.storeCreditAmount && input.storeCreditAmount > 0) {
    const storeCredit = await queryOne<{ id: number }>(
      `SELECT id FROM store_credits WHERE store_id = $1 AND customer_id = $2`,
      [storeId, customer.id]
    );

    if (storeCredit) {
      await queryOne(
        `UPDATE store_credit_transactions 
         SET order_id = $1 
         WHERE store_credit_id = $2 AND order_id IS NULL AND transaction_type = 'used'
         ORDER BY created_at DESC LIMIT 1`,
        [order.id, storeCredit.id]
      );
    }
  }

  // Create line items with properties and image
  for (const lineItem of input.lineItems) {
    // Combine properties with image if exists
    let propertiesToSave = lineItem.properties || [];
    if (lineItem.image) {
      // Add image to properties if not already there
      const hasImageProperty = propertiesToSave.some(p => p.name === '_image');
      if (!hasImageProperty) {
        propertiesToSave = [...propertiesToSave, { name: '_image', value: lineItem.image }];
      }
    }
    
    await queryOne(
      `INSERT INTO order_line_items (
        order_id, product_id, variant_id, title, variant_title,
        quantity, price, properties
      )
      VALUES ($1, $2, $3, 
        (SELECT title FROM products WHERE id = $2),
        (SELECT title FROM product_variants WHERE id = $3),
        $4, $5, $6
      )`,
      [
        order.id, 
        lineItem.product_id, 
        lineItem.variant_id, 
        lineItem.quantity, 
        lineItem.price,
        propertiesToSave.length > 0 
          ? JSON.stringify(propertiesToSave) 
          : null
      ]
    );
  }

  // Emit order.created event
  await eventBus.emit(
    'order.created',
    {
      order: {
        id: order.id,
        order_number: orderName,
        total_price: input.total,
        email: input.customer.email,
        line_items: input.lineItems,
      },
    },
    {
      store_id: storeId,
      source: 'storefront',
    }
  );

  // Send order confirmation email - רק אם לא credit_card או אם הסכום הוא 0
  // אם credit_card עם סכום > 0, האימייל יישלח מה-callback אחרי תשלום מוצלח
  const shouldSendEmailNow = input.paymentMethod !== 'credit_card' || input.total === 0;
  
  if (shouldSendEmailNow) {
    sendOrderReceiptEmail(order.id, storeId).catch((error) => {
      console.warn('Failed to send order receipt email:', error);
    });
  }

  return {
    ...order,
    handle: order.order_handle, // Return handle for URL
  };
}

