/**
 * Contact Sync Listener - מסנכרן לקוחות לאנשי קשר אוטומטית
 * 
 * Listens to:
 * - order.created: מסנכרן את הלקוח לאנשי קשר כשנוצרת הזמנה
 * - customer.created: מסנכרן את הלקוח לאנשי קשר כשנוצר לקוח
 * - customer.updated: מסנכרן את הלקוח לאנשי קשר כשמתעדכן לקוח
 */

import { eventBus } from '../eventBus';
import { queryOne } from '@/lib/db';
import { syncCustomerToContact } from '@/lib/contacts/sync-customer-to-contact';

// מאזין ל-order.created ומסנכרן את הלקוח לאנשי קשר
eventBus.on('order.created', async (event) => {
  try {
    const { order } = event.payload;
    
    if (!order || !order.customer_id) {
      return;
    }

    const storeId = event.store_id;
    const customerId = order.customer_id;

    // טעינת פרטי הלקוח
    const customer = await queryOne<{
      id: number;
      email: string | null;
      first_name: string | null;
      last_name: string | null;
      phone: string | null;
      accepts_marketing: boolean;
      tags: string | null;
      note: string | null;
    }>(
      `SELECT id, email, first_name, last_name, phone, accepts_marketing, tags, note
       FROM customers 
       WHERE id = $1 AND store_id = $2`,
      [customerId, storeId]
    );

    if (!customer || !customer.email) {
      return;
    }

    // סנכרון הלקוח לאנשי קשר
    await syncCustomerToContact(storeId, customerId, {
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone: customer.phone,
      accepts_marketing: customer.accepts_marketing,
      tags: customer.tags,
      note: customer.note,
    });
  } catch (error: any) {
    console.error('Error syncing customer to contact in order.created listener:', error);
    // Don't throw - this is a sync operation, shouldn't break order creation
  }
});

// מאזין ל-customer.created ומסנכרן את הלקוח לאנשי קשר
eventBus.on('customer.created', async (event) => {
  try {
    const { customer } = event.payload;
    
    if (!customer || !customer.id || !customer.email) {
      return;
    }

    const storeId = event.store_id;
    const customerId = customer.id;

    // טעינת פרטי הלקוח המלאים
    const fullCustomer = await queryOne<{
      id: number;
      email: string | null;
      first_name: string | null;
      last_name: string | null;
      phone: string | null;
      accepts_marketing: boolean;
      tags: string | null;
      note: string | null;
    }>(
      `SELECT id, email, first_name, last_name, phone, accepts_marketing, tags, note
       FROM customers 
       WHERE id = $1 AND store_id = $2`,
      [customerId, storeId]
    );

    if (!fullCustomer || !fullCustomer.email) {
      return;
    }

    // סנכרון הלקוח לאנשי קשר
    await syncCustomerToContact(storeId, customerId, {
      email: fullCustomer.email,
      first_name: fullCustomer.first_name,
      last_name: fullCustomer.last_name,
      phone: fullCustomer.phone,
      accepts_marketing: fullCustomer.accepts_marketing,
      tags: fullCustomer.tags,
      note: fullCustomer.note,
    });
  } catch (error: any) {
    console.error('Error syncing customer to contact in customer.created listener:', error);
    // Don't throw - this is a sync operation, shouldn't break customer creation
  }
});

// מאזין ל-customer.updated ומסנכרן את הלקוח לאנשי קשר
eventBus.on('customer.updated', async (event) => {
  try {
    const { customer } = event.payload;
    
    if (!customer || !customer.id || !customer.email) {
      return;
    }

    const storeId = event.store_id;
    const customerId = customer.id;

    // טעינת פרטי הלקוח המלאים
    const fullCustomer = await queryOne<{
      id: number;
      email: string | null;
      first_name: string | null;
      last_name: string | null;
      phone: string | null;
      accepts_marketing: boolean;
      tags: string | null;
      note: string | null;
    }>(
      `SELECT id, email, first_name, last_name, phone, accepts_marketing, tags, note
       FROM customers 
       WHERE id = $1 AND store_id = $2`,
      [customerId, storeId]
    );

    if (!fullCustomer || !fullCustomer.email) {
      return;
    }

    // סנכרון הלקוח לאנשי קשר
    await syncCustomerToContact(storeId, customerId, {
      email: fullCustomer.email,
      first_name: fullCustomer.first_name,
      last_name: fullCustomer.last_name,
      phone: fullCustomer.phone,
      accepts_marketing: fullCustomer.accepts_marketing,
      tags: fullCustomer.tags,
      note: fullCustomer.note,
    });
  } catch (error: any) {
    console.error('Error syncing customer to contact in customer.updated listener:', error);
    // Don't throw - this is a sync operation, shouldn't break customer update
  }
});

