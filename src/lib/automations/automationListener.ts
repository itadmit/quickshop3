import { eventBus } from '@/lib/events/eventBus';
import { runAutomationsForEvent } from './automations';

/**
 * Automation Listener
 * מאזין לכל האירועים במערכת ומריץ אוטומציות רלוונטיות
 */

// הרשמה לכל האירועים
eventBus.on('order.created', async (event) => {
  console.log(`[Automation] Triggered by order.created event for store ${event.store_id}`);
  await runAutomationsForEvent(event.store_id, 'order.created', event.payload);
});

eventBus.on('order.updated', async (event) => {
  console.log(`[Automation] Triggered by order.updated event for store ${event.store_id}`);
  await runAutomationsForEvent(event.store_id, 'order.updated', event.payload);
});

eventBus.on('order.paid', async (event) => {
  console.log(`[Automation] Triggered by order.paid event for store ${event.store_id}`);
  await runAutomationsForEvent(event.store_id, 'order.paid', event.payload);
});

eventBus.on('order.cancelled', async (event) => {
  console.log(`[Automation] Triggered by order.cancelled event for store ${event.store_id}`);
  await runAutomationsForEvent(event.store_id, 'order.cancelled', event.payload);
});

eventBus.on('order.fulfilled', async (event) => {
  console.log(`[Automation] Triggered by order.fulfilled event for store ${event.store_id}`);
  await runAutomationsForEvent(event.store_id, 'order.fulfilled', event.payload);
});

eventBus.on('order.refunded', async (event) => {
  console.log(`[Automation] Triggered by order.refunded event for store ${event.store_id}`);
  await runAutomationsForEvent(event.store_id, 'order.refunded', event.payload);
});

eventBus.on('order.abandoned', async (event) => {
  console.log(`[Automation] Triggered by order.abandoned event for store ${event.store_id}`);
  await runAutomationsForEvent(event.store_id, 'order.abandoned', event.payload);
});

eventBus.on('product.created', async (event) => {
  console.log(`[Automation] Triggered by product.created event for store ${event.store_id}`);
  await runAutomationsForEvent(event.store_id, 'product.created', event.payload);
});

eventBus.on('product.updated', async (event) => {
  console.log(`[Automation] Triggered by product.updated event for store ${event.store_id}`);
  await runAutomationsForEvent(event.store_id, 'product.updated', event.payload);
});

eventBus.on('product.deleted', async (event) => {
  console.log(`[Automation] Triggered by product.deleted event for store ${event.store_id}`);
  await runAutomationsForEvent(event.store_id, 'product.deleted', event.payload);
});

eventBus.on('product.published', async (event) => {
  console.log(`[Automation] Triggered by product.published event for store ${event.store_id}`);
  await runAutomationsForEvent(event.store_id, 'product.published', event.payload);
});

eventBus.on('variant.created', async (event) => {
  console.log(`[Automation] Triggered by variant.created event for store ${event.store_id}`);
  await runAutomationsForEvent(event.store_id, 'variant.created', event.payload);
});

eventBus.on('variant.updated', async (event) => {
  console.log(`[Automation] Triggered by variant.updated event for store ${event.store_id}`);
  await runAutomationsForEvent(event.store_id, 'variant.updated', event.payload);
});

eventBus.on('inventory.updated', async (event) => {
  console.log(`[Automation] Triggered by inventory.updated event for store ${event.store_id}`);
  await runAutomationsForEvent(event.store_id, 'inventory.updated', event.payload);
});

eventBus.on('customer.created', async (event) => {
  console.log(`[Automation] Triggered by customer.created event for store ${event.store_id}`);
  await runAutomationsForEvent(event.store_id, 'customer.created', event.payload);
});

eventBus.on('customer.updated', async (event) => {
  console.log(`[Automation] Triggered by customer.updated event for store ${event.store_id}`);
  await runAutomationsForEvent(event.store_id, 'customer.updated', event.payload);
});

eventBus.on('customer.deleted', async (event) => {
  console.log(`[Automation] Triggered by customer.deleted event for store ${event.store_id}`);
  await runAutomationsForEvent(event.store_id, 'customer.deleted', event.payload);
});

eventBus.on('transaction.created', async (event) => {
  console.log(`[Automation] Triggered by transaction.created event for store ${event.store_id}`);
  await runAutomationsForEvent(event.store_id, 'transaction.created', event.payload);
});

eventBus.on('transaction.succeeded', async (event) => {
  console.log(`[Automation] Triggered by transaction.succeeded event for store ${event.store_id}`);
  await runAutomationsForEvent(event.store_id, 'transaction.succeeded', event.payload);
});

eventBus.on('transaction.failed', async (event) => {
  console.log(`[Automation] Triggered by transaction.failed event for store ${event.store_id}`);
  await runAutomationsForEvent(event.store_id, 'transaction.failed', event.payload);
});

// Cart events
eventBus.on('cart.created', async (event) => {
  console.log(`[Automation] Triggered by cart.created event for store ${event.store_id}`);
  await runAutomationsForEvent(event.store_id, 'cart.created', event.payload);
});

eventBus.on('cart.abandoned', async (event) => {
  console.log(`[Automation] Triggered by cart.abandoned event for store ${event.store_id}`);
  await runAutomationsForEvent(event.store_id, 'cart.abandoned', event.payload);
});

// Discount Code events
eventBus.on('discount.created', async (event) => {
  console.log(`[Automation] Triggered by discount.created event for store ${event.store_id}`);
  await runAutomationsForEvent(event.store_id, 'discount.created', event.payload);
});

eventBus.on('discount.updated', async (event) => {
  console.log(`[Automation] Triggered by discount.updated event for store ${event.store_id}`);
  await runAutomationsForEvent(event.store_id, 'discount.updated', event.payload);
});

eventBus.on('discount.deleted', async (event) => {
  console.log(`[Automation] Triggered by discount.deleted event for store ${event.store_id}`);
  await runAutomationsForEvent(event.store_id, 'discount.deleted', event.payload);
});

// Automatic Discount events
eventBus.on('automatic_discount.created', async (event) => {
  console.log(`[Automation] Triggered by automatic_discount.created event for store ${event.store_id}`);
  await runAutomationsForEvent(event.store_id, 'automatic_discount.created', event.payload);
});

eventBus.on('automatic_discount.updated', async (event) => {
  console.log(`[Automation] Triggered by automatic_discount.updated event for store ${event.store_id}`);
  await runAutomationsForEvent(event.store_id, 'automatic_discount.updated', event.payload);
});

eventBus.on('automatic_discount.deleted', async (event) => {
  console.log(`[Automation] Triggered by automatic_discount.deleted event for store ${event.store_id}`);
  await runAutomationsForEvent(event.store_id, 'automatic_discount.deleted', event.payload);
});

console.log('[Automation] Automation listener initialized and listening to all events');

