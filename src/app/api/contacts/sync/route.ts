import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { syncCustomerToContact } from '@/lib/contacts/sync-customer-to-contact';

// POST /api/contacts/sync - Sync all customers to contacts
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;

    // Ensure CUSTOMER category exists
    let customerCategory = await queryOne<{ id: number }>(
      `SELECT id FROM contact_categories 
       WHERE store_id = $1 AND type = 'CUSTOMER'`,
      [storeId]
    );

    if (!customerCategory) {
      // Create CUSTOMER category
      const newCategory = await queryOne<{ id: number }>(
        `INSERT INTO contact_categories (store_id, type, name, color, created_at, updated_at)
         VALUES ($1, 'CUSTOMER', 'לקוחות', '#10b981', now(), now())
         RETURNING id`,
        [storeId]
      );
      customerCategory = newCategory;
    }

    if (!customerCategory) {
      return NextResponse.json({ error: 'Failed to create CUSTOMER category' }, { status: 500 });
    }

    // Get all customers for this store
    const customers = await query<{
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
       WHERE store_id = $1 AND email IS NOT NULL`,
      [storeId]
    );

    let synced = 0;
    let updated = 0;
    let errors = 0;

    for (const customer of customers) {
      try {
        if (!customer.email) continue;

        // Check if contact already exists
        const existingContact = await queryOne<{ id: number }>(
          'SELECT id FROM contacts WHERE store_id = $1 AND email = $2',
          [storeId, customer.email]
        );

        const result = await syncCustomerToContact(storeId, customer.id, {
          email: customer.email,
          first_name: customer.first_name,
          last_name: customer.last_name,
          phone: customer.phone,
          accepts_marketing: customer.accepts_marketing,
          tags: customer.tags,
          note: customer.note,
        });

        if (result) {
          if (existingContact) {
            updated++;
          } else {
            synced++;
          }
        } else {
          errors++;
        }
      } catch (error: any) {
        console.error(`Error syncing customer ${customer.id}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      synced,
      updated,
      errors,
      total: customers.length,
    });
  } catch (error: any) {
    console.error('Error syncing customers to contacts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync customers to contacts' },
      { status: 500 }
    );
  }
}

