'use server';

import { queryOne } from '@/lib/db';
import { eventBus } from '@/lib/events/eventBus';

interface CreateOrderInput {
  lineItems: Array<{
    variant_id: number;
    product_id: number;
    quantity: number;
    price: number;
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
  };
  total: number;
}

export async function createOrder(input: CreateOrderInput) {
  const storeId = 1; // TODO: Get from domain/subdomain

  // Create customer or get existing
  let customer = await queryOne<{ id: number }>(
    'SELECT id FROM customers WHERE store_id = $1 AND email = $2',
    [storeId, input.customer.email]
  );

  if (!customer) {
    const newCustomer = await queryOne<{ id: number }>(
      `INSERT INTO customers (store_id, first_name, last_name, email, phone, accepts_marketing, state)
       VALUES ($1, $2, $3, $4, $5, false, 'enabled')
       RETURNING id`,
      [
        storeId,
        input.customer.firstName,
        input.customer.lastName,
        input.customer.email,
        input.customer.phone,
      ]
    );
    customer = newCustomer;
  }

  if (!customer) {
    throw new Error('Failed to create customer');
  }

  // Get next order number
  const lastOrder = await queryOne<{ order_number: number }>(
    'SELECT order_number FROM orders WHERE store_id = $1 ORDER BY order_number DESC LIMIT 1',
    [storeId]
  );
  const orderNumber = (lastOrder?.order_number || 0) + 1;
  const orderName = `#${orderNumber.toString().padStart(4, '0')}`;

  // Create order
  const order = await queryOne<{ id: number; order_number: number }>(
    `INSERT INTO orders (
      store_id, customer_id, order_number, order_name,
      financial_status, fulfillment_status,
      total_price, subtotal_price, currency,
      billing_address, shipping_address, email
    )
    VALUES (
      $1, $2, $6, $7,
      'pending', 'unfulfilled',
      $3, $3, 'ILS',
      $4, $4, $5
    )
    RETURNING id, order_number`,
    [
      storeId,
      customer.id,
      input.total,
      JSON.stringify({
        first_name: input.customer.firstName,
        last_name: input.customer.lastName,
        address1: input.customer.address,
        city: input.customer.city,
        zip: input.customer.postalCode,
        country: input.customer.country,
      }),
      input.customer.email,
      orderNumber,
      orderName,
    ]
  );

  if (!order) {
    throw new Error('Failed to create order');
  }

  // Create line items
  for (const lineItem of input.lineItems) {
    await queryOne(
      `INSERT INTO order_line_items (
        order_id, product_id, variant_id, title, variant_title,
        quantity, price
      )
      VALUES ($1, $2, $3, 
        (SELECT title FROM products WHERE id = $2),
        (SELECT title FROM product_variants WHERE id = $3),
        $4, $5
      )`,
      [order.id, lineItem.product_id, lineItem.variant_id, lineItem.quantity, lineItem.price]
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

  return order;
}

