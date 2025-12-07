import { query, queryOne } from '@/lib/db';
import { Contact } from '@/types/contact';

/**
 * Creates or updates a contact when a customer is created/updated
 * This ensures all customers are also contacts with the CUSTOMER category
 */
export async function syncCustomerToContact(
  storeId: number,
  customerId: number,
  customerData: {
    email: string;
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    accepts_marketing?: boolean;
    tags?: string | null;
    note?: string | null;
  }
): Promise<Contact | null> {
  try {
    // Get or create CUSTOMER category
    const customerCategory = await queryOne<{ id: number }>(
      `SELECT id FROM contact_categories 
       WHERE store_id = $1 AND type = 'CUSTOMER'`,
      [storeId]
    );

    if (!customerCategory) {
      console.warn(`CUSTOMER category not found for store ${storeId}`);
      return null;
    }

    // Check if contact already exists
    const existingContact = await queryOne<Contact>(
      'SELECT * FROM contacts WHERE store_id = $1 AND email = $2',
      [storeId, customerData.email]
    );

    let contact: Contact | null;

    if (existingContact) {
      // Update existing contact
      contact = await queryOne<Contact>(
        `UPDATE contacts 
         SET customer_id = $1,
             first_name = COALESCE($2, first_name),
             last_name = COALESCE($3, last_name),
             phone = COALESCE($4, phone),
             email_marketing_consent = COALESCE($5, email_marketing_consent),
             email_marketing_consent_at = CASE WHEN $5 = true AND email_marketing_consent = false THEN now() ELSE email_marketing_consent_at END,
             tags = COALESCE($6, tags),
             notes = COALESCE($7, notes),
             updated_at = now()
         WHERE id = $8
         RETURNING *`,
        [
          customerId,
          customerData.first_name || null,
          customerData.last_name || null,
          customerData.phone || null,
          customerData.accepts_marketing !== undefined ? customerData.accepts_marketing : null,
          customerData.tags ? customerData.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
          customerData.note || null,
          existingContact.id,
        ]
      );
    } else {
      // Create new contact
      contact = await queryOne<Contact>(
        `INSERT INTO contacts (
          store_id, customer_id, email, first_name, last_name, phone,
          email_marketing_consent, email_marketing_consent_at, tags, notes, source, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, 
          CASE WHEN $7 = true THEN now() ELSE NULL END,
          $8, $9, 'customer', now(), now()
        ) RETURNING *`,
        [
          storeId,
          customerId,
          customerData.email,
          customerData.first_name || null,
          customerData.last_name || null,
          customerData.phone || null,
          customerData.accepts_marketing || false,
          customerData.tags ? customerData.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
          customerData.note || null,
        ]
      );
    }

    if (!contact) {
      console.warn('Failed to create or update contact');
      return null;
    }

    // Ensure CUSTOMER category assignment exists
    await query(
      `INSERT INTO contact_category_assignments (contact_id, category_id)
       VALUES ($1, $2)
       ON CONFLICT (contact_id, category_id) DO NOTHING`,
      [contact.id, customerCategory.id]
    );

    return contact;
  } catch (error: any) {
    console.error('Error syncing customer to contact:', error);
    // Don't throw - this is a sync operation, shouldn't break customer creation
    return null;
  }
}

