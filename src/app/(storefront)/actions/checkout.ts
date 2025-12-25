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
    price: number; // מחיר אחרי הנחה
    original_price?: number; // מחיר מקורי לפני הנחה
    line_discount?: number; // הנחה על הפריט
    image?: string;
    properties?: Array<{ name: string; value: string }>;
  }>;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    houseNumber?: string;
    apartment?: string;
    floor?: string;
    city: string;
    postalCode: string;
    country: string;
    notes?: string;
    companyName?: string; // שם חברה (אופציונלי)
  };
  billingAddress?: { // כתובת חיוב נפרדת (אופציונלי)
    firstName: string;
    lastName: string;
    address: string;
    houseNumber?: string;
    apartment?: string;
    floor?: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  total: number;
  subtotal?: number; // סכום לפני הנחות ומשלוח
  shippingCost?: number; // עלות משלוח
  totalDiscount?: number; // סה"כ הנחות
  deliveryMethod?: 'shipping' | 'pickup';
  shippingMethodName?: string; // שם שיטת המשלוח (למשל "משלוח רגיל")
  paymentMethod?: 'credit_card' | 'bank_transfer' | 'cash' | 'store_credit';
  storeCreditAmount?: number; // סכום קרדיט לשימוש
  giftCardCode?: string; // קוד גיפט קארד שהוחל
  giftCardAmount?: number; // סכום גיפט קארד ששומש
  customFields?: Record<string, any>;
  discountCodes?: string[]; // קודי קופונים שהוחלו על ההזמנה
  newsletter?: boolean; // הסכמה לקבלת דיוור
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
  const acceptsMarketing = input.newsletter ?? false;
  
  if (!customer) {
    const newCustomer = await queryOne<{ id: number; first_name: string | null; last_name: string | null; phone: string | null; accepts_marketing: boolean; tags: string | null; note: string | null }>(
      `INSERT INTO customers (store_id, first_name, last_name, email, phone, accepts_marketing, state)
       VALUES ($1, $2, $3, $4, $5, $6, 'enabled')
       RETURNING id, first_name, last_name, phone, accepts_marketing, tags, note`,
      [
        storeId,
        input.customer.firstName,
        input.customer.lastName,
        input.customer.email,
        input.customer.phone,
        acceptsMarketing,
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
        accepts_marketing: acceptsMarketing,
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
  } else {
    // Update existing customer's marketing preference if they opted in
    if (acceptsMarketing && !customer.accepts_marketing) {
      await queryOne(
        `UPDATE customers SET accepts_marketing = true, updated_at = now() WHERE id = $1`,
        [customer.id]
      );
    }
  }

  if (!customer) {
    throw new Error('Failed to create customer');
  }

  // Handle store credit payment
  // ✅ מטפל בקרדיט גם אם paymentMethod הוא credit_card (לשימוש חלקי בקרדיט + אשראי)
  let finalTotal = input.total;
  let actualStoreCreditAmount = 0;
  
  // בדיקה אם יש קרדיט לשימוש (גם אם paymentMethod הוא credit_card)
  if (input.storeCreditAmount && input.storeCreditAmount > 0) {
    // Get store credit
    const storeCredit = await queryOne<{ id: number; balance: string }>(
      `SELECT id, balance FROM store_credits WHERE store_id = $1 AND customer_id = $2`,
      [storeId, customer.id]
    );

    if (storeCredit) {
      const creditBalance = parseFloat(storeCredit.balance);
      const creditToUse = Math.min(input.storeCreditAmount, creditBalance, input.total);

      if (creditToUse > 0) {
        // Update store credit balance
        const newBalance = creditBalance - creditToUse;
        await queryOne(
          `UPDATE store_credits SET balance = $1, updated_at = now() WHERE id = $2`,
          [newBalance, storeCredit.id]
        );

        // Create transaction record (amount should be negative for 'used' transactions)
        await queryOne(
          `INSERT INTO store_credit_transactions (store_credit_id, order_id, amount, transaction_type, description, created_at)
           VALUES ($1, NULL, $2, 'used', $3, now())
           RETURNING id`,
          [
            storeCredit.id,
            -Math.abs(creditToUse), // Make sure amount is negative for usage
            `תשלום עבור הזמנה`,
          ]
        );

        // Update final total
        actualStoreCreditAmount = creditToUse;
        finalTotal = Math.max(0, input.total - creditToUse);
      }
    } else if (input.paymentMethod === 'store_credit') {
      // רק אם paymentMethod הוא store_credit בלבד, נזרוק שגיאה
      throw new Error('אין קרדיט בחנות זמין');
    }
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
  
  // Prepare address object with full street address
  const fullAddress = [
    input.customer.address,
    input.customer.houseNumber ? `${input.customer.houseNumber}` : '',
  ].filter(Boolean).join(' ');
  
  const address2Parts = [
    input.customer.apartment ? `דירה ${input.customer.apartment}` : '',
    input.customer.floor ? `קומה ${input.customer.floor}` : '',
  ].filter(Boolean);
  
  const shippingAddressObject = {
    first_name: input.customer.firstName,
    last_name: input.customer.lastName,
    address1: fullAddress,
    address2: address2Parts.length > 0 ? address2Parts.join(', ') : undefined,
    city: input.customer.city,
    zip: input.customer.postalCode,
    country: input.customer.country,
    phone: input.customer.phone,
  };
  
  // Create billing address - use separate billing address if provided, otherwise use shipping address
  let billingAddressObject = shippingAddressObject;
  if (input.billingAddress) {
    const billingFullAddress = [
      input.billingAddress.address,
      input.billingAddress.houseNumber ? `מספר ${input.billingAddress.houseNumber}` : '',
    ].filter(Boolean).join(' ');
    
    const billingAddress2Parts = [
      input.billingAddress.apartment ? `דירה ${input.billingAddress.apartment}` : '',
      input.billingAddress.floor ? `קומה ${input.billingAddress.floor}` : '',
    ].filter(Boolean);
    
    billingAddressObject = {
      first_name: input.billingAddress.firstName,
      last_name: input.billingAddress.lastName,
      address1: billingFullAddress,
      address2: billingAddress2Parts.length > 0 ? billingAddress2Parts.join(', ') : undefined,
      city: input.billingAddress.city,
      zip: input.billingAddress.postalCode,
      country: input.billingAddress.country,
      phone: input.billingAddress.phone || input.customer.phone,
    };
  }
  
  // ✅ הסכום הסופי כבר מחושב למעלה (finalTotal)
  // finalTotal כבר כולל את כל ההנחות (גיפט קארד + קרדיט בחנות)
  const finalTotalAfterCredits = finalTotal;
  
  // קבע את שיטת התשלום בפועל - אם גיפט קארד או קרדיט מכסים הכל, זה שיטת התשלום
  let actualPaymentMethod = input.paymentMethod || 'credit_card';
  if (finalTotalAfterCredits === 0) {
    // אם הסכום הסופי הוא 0, בדוק מה מכסה את הכל
    if (input.giftCardCode && input.giftCardAmount && input.giftCardAmount > 0) {
      actualPaymentMethod = 'gift_card';
    } else if (actualStoreCreditAmount > 0) {
      actualPaymentMethod = 'store_credit';
    }
  } else if (actualStoreCreditAmount > 0 && input.paymentMethod === 'credit_card') {
    // ✅ אם יש קרדיט חלקי + תשלום אשראי, שיטת התשלום היא credit_card
    actualPaymentMethod = 'credit_card';
  }
  
  // Prepare note_attributes with delivery and payment methods
  const noteAttributes: Record<string, any> = {
    ...(input.customFields || {}),
    delivery_method: input.deliveryMethod || 'shipping',
    payment_method: actualPaymentMethod, // ✅ שימוש ב-actualPaymentMethod במקום input.paymentMethod
    shipping_method_name: input.shippingMethodName || (input.deliveryMethod === 'pickup' ? 'איסוף עצמי' : 'משלוח'),
    ...(input.customer.companyName ? { company_name: input.customer.companyName } : {}),
    ...(input.giftCardCode ? { gift_card_code: input.giftCardCode, gift_card_amount: input.giftCardAmount } : {}),
    ...(actualStoreCreditAmount > 0 ? { store_credit_amount: actualStoreCreditAmount } : {}),
  };
  
  let financialStatus = 'pending';
  if (finalTotalAfterCredits === 0) {
    // אם הסכום הסופי הוא 0 (גיפט קארד, קרדיט, או שניהם מכסים הכל) - הזמנה שולמה
    financialStatus = 'paid';
  } else if (input.paymentMethod === 'cash') {
    // מזומן - pending עד שההזמנה נמסרת ומשולמת
    financialStatus = 'pending';
  } else if (input.paymentMethod === 'bank_transfer') {
    // העברה בנקאית - pending עד שהכסף מתקבל
    financialStatus = 'pending';
  } else if (input.paymentMethod === 'credit_card' || (input.paymentMethod === 'store_credit' && finalTotalAfterCredits > 0)) {
    // ✅ כרטיס אשראי או קרדיט עם סכום נותר - pending עד שהתשלום מאושר בסליקה
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

  // Get default fulfillment status for the store
  // ✅ אם יש תשלום נותר (finalTotalAfterCredits > 0), הסטטוס צריך להיות pending
  // ✅ רק אם ההזמנה שולמה במלואה (finalTotalAfterCredits === 0), נשתמש בסטטוס ברירת מחדל
  let fulfillmentStatus = 'pending';
  
  if (financialStatus === 'paid') {
    // אם ההזמנה שולמה במלואה, נשתמש בסטטוס ברירת מחדל או paid
    const defaultStatus = await queryOne<{ name: string }>(
      `SELECT name FROM custom_order_statuses 
       WHERE store_id = $1 AND is_default = true 
       ORDER BY position ASC LIMIT 1`,
      [storeId]
    );
    // If no default status, try to get the first one by position
    const firstStatus = defaultStatus || await queryOne<{ name: string }>(
      `SELECT name FROM custom_order_statuses 
       WHERE store_id = $1 
       ORDER BY position ASC LIMIT 1`,
      [storeId]
    );
    fulfillmentStatus = firstStatus?.name || 'paid';
  } else {
    // אם יש תשלום נותר, הסטטוס הוא pending עד שהתשלום מאושר
    fulfillmentStatus = 'pending';
  }

  // חישוב ערכים לשמירה
  const subtotalPrice = input.subtotal || finalTotal;
  const shippingPrice = input.shippingCost || 0;
  const totalDiscounts = input.totalDiscount || 0;

  const order = await queryOne<{ id: number; order_number: number; order_handle: string }>(
    `INSERT INTO orders (
      store_id, customer_id, order_number, order_name, order_handle,
      financial_status, fulfillment_status,
      total_price, subtotal_price, total_shipping_price, total_discounts, currency,
      billing_address, shipping_address, email, phone, name, note, note_attributes, gateway, discount_codes
    )
    VALUES (
      $1, $2, $7, $8, $12,
      $15, $17,
      $3, $18, $19, $20, 'ILS',
      $4, $5, $6, $9, $10, $11, $13, $14, 
      COALESCE($16::jsonb, '[]'::jsonb)
    )
    RETURNING id, order_number, order_handle`,
    [
      storeId,                                    // $1 - store_id
      customer.id,                                // $2 - customer_id
      finalTotal,                                 // $3 - total_price
      JSON.stringify(billingAddressObject),       // $4 - billing_address
      JSON.stringify(shippingAddressObject),      // $5 - shipping_address
      input.customer.email,                       // $6 - email
      orderNumber,                                // $7 - order_number
      orderName,                                  // $8 - order_name
      input.customer.phone,                       // $9 - phone
      customerName,                               // $10 - name
      input.customer.notes || null,              // $11 - note
      orderHandle,                                // $12 - order_handle
      JSON.stringify(noteAttributes),             // $13 - note_attributes
      actualPaymentMethod,                        // $14 - gateway (שימוש ב-actualPaymentMethod)
      financialStatus,                            // $15 - financial_status
      discountCodesArray.length > 0 ? JSON.stringify(discountCodesArray) : '[]', // $16 - discount_codes (JSONB)
      fulfillmentStatus,                          // $17 - fulfillment_status
      subtotalPrice,                              // $18 - subtotal_price
      shippingPrice,                              // $19 - total_shipping_price
      totalDiscounts,                             // $20 - total_discounts
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
    
    // ✅ חישוב המחיר המקורי וההנחה
    const originalPrice = lineItem.original_price || lineItem.price;
    const lineDiscount = lineItem.line_discount || 0;
    const finalPrice = lineItem.price; // מחיר אחרי הנחה
    
    await queryOne(
      `INSERT INTO order_line_items (
        order_id, product_id, variant_id, title, variant_title,
        quantity, price, total_discount, properties
      )
      VALUES ($1, $2, $3, 
        (SELECT title FROM products WHERE id = $2),
        (SELECT title FROM product_variants WHERE id = $3),
        $4, $5, $6, $7
      )`,
      [
        order.id, 
        lineItem.product_id, 
        lineItem.variant_id, 
        lineItem.quantity, 
        finalPrice, // מחיר אחרי הנחה
        lineDiscount, // הנחה על הפריט
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

