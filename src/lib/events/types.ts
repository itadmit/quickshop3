// Event Topics - כל האירועים במערכת
export type EventTopic =
  // Orders
  | 'order.created'
  | 'order.updated'
  | 'order.paid'
  | 'order.cancelled'
  | 'order.fulfilled'
  | 'order.refunded'
  // Products
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'product.published'
  | 'variant.created'
  | 'variant.updated'
  | 'inventory.updated'
  // Customers
  | 'customer.created'
  | 'customer.updated'
  | 'customer.deleted'
  // Transactions
  | 'transaction.created'
  | 'transaction.succeeded'
  | 'transaction.failed'
  // Cart
  | 'cart.created'
  | 'cart.abandoned'
  // Discounts
  | 'discount.created'
  | 'discount.updated'
  | 'discount.deleted'
  | 'automatic_discount.created'
  | 'automatic_discount.updated'
  | 'automatic_discount.deleted';

// Event Payloads - Type-safe payloads לכל אירוע
export interface EventPayloads {
  'order.created': { order: any };
  'order.updated': { order: any; changes: Partial<any> };
  'order.paid': { order: any; transaction: any };
  'order.cancelled': { order: any; reason: string };
  'order.fulfilled': { order: any; fulfillment: any };
  'order.refunded': { order: any; refund: any };
  'product.created': { product: any };
  'product.updated': { product: any; changes: Partial<any> };
  'product.deleted': { product: any };
  'product.published': { product: any };
  'variant.created': { variant: any };
  'variant.updated': { variant: any; changes: Partial<any> };
  'inventory.updated': { variant_id: number; quantity: number; reason: string };
  'customer.created': { customer: any };
  'customer.updated': { customer: any; changes: Partial<any> };
  'customer.deleted': { customer: any };
  'transaction.created': { transaction: any };
  'transaction.succeeded': { transaction: any };
  'transaction.failed': { transaction: any; error: string };
  'cart.created': { cart: any };
  'cart.abandoned': { cart: any };
  'discount.created': { discount: any };
  'discount.updated': { discount: any; changes?: Partial<any> };
  'discount.deleted': { discount: any };
  'automatic_discount.created': { discount: any };
  'automatic_discount.updated': { discount: any; changes?: Partial<any> };
  'automatic_discount.deleted': { discount: any };
}

