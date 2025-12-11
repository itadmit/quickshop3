import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Contact } from '@/types/contact';
import { getUserFromRequest } from '@/lib/auth';

// POST /api/contacts/:id/convert-to-customer - Convert contact to customer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const contactId = parseInt(id);
    if (isNaN(contactId)) {
      return NextResponse.json({ error: 'Invalid contact ID' }, { status: 400 });
    }

    // Get contact
    const contact = await queryOne<Contact>(
      'SELECT * FROM contacts WHERE id = $1 AND store_id = $2',
      [contactId, user.store_id]
    );

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    if (!contact.email) {
      return NextResponse.json({ error: 'Contact must have an email address' }, { status: 400 });
    }

    // Check if customer already exists
    const existingCustomer = await queryOne<{ id: number }>(
      'SELECT id FROM customers WHERE store_id = $1 AND email = $2',
      [user.store_id, contact.email]
    );

    if (existingCustomer) {
      // Update contact to link to existing customer
      await query(
        'UPDATE contacts SET customer_id = $1 WHERE id = $2',
        [existingCustomer.id, contactId]
      );

      return NextResponse.json({
        success: true,
        message: 'Contact linked to existing customer',
        customer_id: existingCustomer.id,
      });
    }

    // Create customer from contact
    const customer = await queryOne<{ id: number }>(
      `INSERT INTO customers (
        store_id, email, phone, first_name, last_name,
        accepts_marketing, tags, note, state, verified_email,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), now()
      ) RETURNING id`,
      [
        user.store_id,
        contact.email,
        contact.phone || null,
        contact.first_name || null,
        contact.last_name || null,
        contact.email_marketing_consent || false,
        contact.tags && contact.tags.length > 0 ? contact.tags.join(',') : null,
        contact.notes || null,
        'enabled',
        false,
      ]
    );

    if (!customer) {
      return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
    }

    // Update contact to link to customer
    await query(
      'UPDATE contacts SET customer_id = $1 WHERE id = $2',
      [customer.id, contactId]
    );

    // Sync customer to contact (to ensure CUSTOMER category is assigned)
    const { syncCustomerToContact } = await import('@/lib/contacts/sync-customer-to-contact');
    await syncCustomerToContact(user.store_id, customer.id, {
      email: contact.email,
      first_name: contact.first_name,
      last_name: contact.last_name,
      phone: contact.phone,
      accepts_marketing: contact.email_marketing_consent || false,
      tags: contact.tags && contact.tags.length > 0 ? contact.tags.join(',') : null,
      note: contact.notes || null,
    });

    return NextResponse.json({
      success: true,
      message: 'Contact converted to customer successfully',
      customer_id: customer.id,
    });
  } catch (error: any) {
    console.error('Error converting contact to customer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to convert contact to customer' },
      { status: 500 }
    );
  }
}

