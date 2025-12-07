/**
 * Script to sync existing customers to contacts
 * This ensures all customers are also contacts with the CUSTOMER category
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function syncCustomersToContacts() {
  try {
    console.log('🔄 Starting sync of customers to contacts...\n');

    // Get all stores
    const storesResult = await pool.query('SELECT id FROM stores');
    const stores = storesResult.rows;

    if (stores.length === 0) {
      console.log('⚠️  No stores found');
      return;
    }

    let totalSynced = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const store of stores) {
      const storeId = store.id;
      console.log(`📦 Processing store ${storeId}...`);

      // Ensure CUSTOMER category exists
      const categoryResult = await pool.query(
        `SELECT id FROM contact_categories 
         WHERE store_id = $1 AND type = 'CUSTOMER'`,
        [storeId]
      );

      if (categoryResult.rows.length === 0) {
        // Create CUSTOMER category
        await pool.query(
          `INSERT INTO contact_categories (store_id, type, name, color, created_at, updated_at)
           VALUES ($1, 'CUSTOMER', 'לקוחות', '#10b981', now(), now())
           ON CONFLICT (store_id, type) DO NOTHING`,
          [storeId]
        );
        console.log('   ✓ Created CUSTOMER category');
      }

      const categoryId = categoryResult.rows[0]?.id || (await pool.query(
        `SELECT id FROM contact_categories 
         WHERE store_id = $1 AND type = 'CUSTOMER'`,
        [storeId]
      )).rows[0].id;

      // Get all customers for this store
      const customersResult = await pool.query(
        `SELECT id, store_id, email, first_name, last_name, phone, 
                accepts_marketing, tags, note
         FROM customers 
         WHERE store_id = $1`,
        [storeId]
      );

      const customers = customersResult.rows;
      console.log(`   Found ${customers.length} customers`);

      for (const customer of customers) {
        try {
          // Check if contact already exists
          const existingContact = await pool.query(
            'SELECT id FROM contacts WHERE store_id = $1 AND email = $2',
            [storeId, customer.email]
          );

          let contactId: number;

          if (existingContact.rows.length > 0) {
            // Update existing contact
            const updatedContact = await pool.query(
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
               RETURNING id`,
              [
                customer.id,
                customer.first_name,
                customer.last_name,
                customer.phone,
                customer.accepts_marketing,
                customer.tags ? customer.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : null,
                customer.note,
                existingContact.rows[0].id,
              ]
            );
            contactId = updatedContact.rows[0].id;
            totalSkipped++;
          } else {
            // Create new contact
            const newContact = await pool.query(
              `INSERT INTO contacts (
                store_id, customer_id, email, first_name, last_name, phone,
                email_marketing_consent, email_marketing_consent_at, tags, notes, source, created_at, updated_at
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, 
                CASE WHEN $7 = true THEN now() ELSE NULL END,
                $8, $9, 'customer', now(), now()
              ) RETURNING id`,
              [
                storeId,
                customer.id,
                customer.email,
                customer.first_name,
                customer.last_name,
                customer.phone,
                customer.accepts_marketing || false,
                customer.tags ? customer.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : null,
                customer.note,
              ]
            );
            contactId = newContact.rows[0].id;
            totalSynced++;
          }

          // Ensure CUSTOMER category assignment exists
          await pool.query(
            `INSERT INTO contact_category_assignments (contact_id, category_id)
             VALUES ($1, $2)
             ON CONFLICT (contact_id, category_id) DO NOTHING`,
            [contactId, categoryId]
          );
        } catch (error: any) {
          console.error(`   ❌ Error syncing customer ${customer.id} (${customer.email}):`, error.message);
          totalErrors++;
        }
      }

      console.log(`   ✓ Store ${storeId} completed\n`);
    }

    console.log('\n✅ Sync completed!');
    console.log(`   • ${totalSynced} new contacts created`);
    console.log(`   • ${totalSkipped} existing contacts updated`);
    console.log(`   • ${totalErrors} errors`);

  } catch (error: any) {
    console.error('\n❌ Error syncing customers to contacts:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

syncCustomersToContacts();

