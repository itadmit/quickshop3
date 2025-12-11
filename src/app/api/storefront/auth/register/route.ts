import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { syncCustomerToContact } from '@/lib/contacts/sync-customer-to-contact';
import { eventBus } from '@/lib/events/eventBus';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeSlug, first_name, last_name, email, phone, id_number, birth_date } = body;

    // Validation
    if (!storeSlug || !first_name || !last_name || !email || !phone) {
      return NextResponse.json(
        { error: 'כל השדות הנדרשים חייבים להיות מולאים' },
        { status: 400 }
      );
    }

    // Find store
    const store = await queryOne<{
      id: number;
      name: string;
      slug: string;
    }>(
      'SELECT id, name, slug FROM stores WHERE slug = $1 OR myshopify_domain = $1',
      [storeSlug]
    );

    if (!store) {
      return NextResponse.json(
        { error: 'החנות לא נמצאה' },
        { status: 404 }
      );
    }

    // Get store settings to check if ID number and birth date are required
    const storeSettings = await queryOne<{
      settings: any;
    }>(
      'SELECT settings FROM store_settings WHERE store_id = $1',
      [store.id]
    );

    const settings = storeSettings?.settings || {};
    
    // Validate conditional fields based on settings
    if (settings.show_id_number && !id_number) {
      return NextResponse.json(
        { error: 'מספר תעודת זהות הוא שדה חובה' },
        { status: 400 }
      );
    }

    if (settings.show_birth_date && !birth_date) {
      return NextResponse.json(
        { error: 'תאריך לידה הוא שדה חובה' },
        { status: 400 }
      );
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingCustomer = await queryOne<{
      id: number;
      email: string | null;
    }>(
      `SELECT id, email FROM customers 
       WHERE store_id = $1 
       AND LOWER(TRIM(email)) = LOWER(TRIM($2))`,
      [store.id, normalizedEmail]
    );

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'כתובת אימייל זו כבר רשומה במערכת. אנא התחבר או השתמש בכתובת אחרת' },
        { status: 409 }
      );
    }

    // Check if phone already exists
    const existingPhone = await queryOne<{
      id: number;
      phone: string | null;
    }>(
      `SELECT id, phone FROM customers 
       WHERE store_id = $1 
       AND phone = $2`,
      [store.id, phone]
    );

    if (existingPhone) {
      return NextResponse.json(
        { error: 'מספר טלפון זה כבר רשום במערכת. אנא התחבר או השתמש במספר אחר' },
        { status: 409 }
      );
    }

    // Create customer
    const customer = await queryOne<{
      id: number;
      email: string | null;
      phone: string | null;
      first_name: string | null;
      last_name: string | null;
      id_number: string | null;
      birth_date: Date | null;
    }>(
      `INSERT INTO customers (
        store_id, email, first_name, last_name, phone, 
        id_number, birth_date, state, verified_email, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'enabled', false, now(), now())
      RETURNING id, email, phone, first_name, last_name, id_number, birth_date`,
      [
        store.id,
        normalizedEmail,
        first_name.trim(),
        last_name.trim(),
        phone.replace(/\D/g, ''),
        id_number ? id_number.replace(/\D/g, '') : null,
        birth_date || null,
      ]
    );

    if (!customer) {
      throw new Error('Failed to create customer');
    }

    // Sync customer to contact and add as club member
    if (customer.email) {
      try {
        // Sync customer to contact (creates contact with CUSTOMER category)
        const contact = await syncCustomerToContact(store.id, customer.id, {
          email: customer.email,
          first_name: customer.first_name,
          last_name: customer.last_name,
          phone: customer.phone,
          accepts_marketing: false,
        });

        // Add CLUB_MEMBER category to the contact
        if (contact) {
          // Get or create CLUB_MEMBER category
          let clubMemberCategory = await queryOne<{ id: number }>(
            `SELECT id FROM contact_categories 
             WHERE store_id = $1 AND type = 'CLUB_MEMBER'`,
            [store.id]
          );

          if (!clubMemberCategory) {
            // Create CLUB_MEMBER category if it doesn't exist
            clubMemberCategory = await queryOne<{ id: number }>(
              `INSERT INTO contact_categories (store_id, type, name, color, created_at, updated_at)
               VALUES ($1, 'CLUB_MEMBER', 'חברי מועדון', '#3b82f6', now(), now())
               ON CONFLICT (store_id, type) DO UPDATE SET updated_at = now()
               RETURNING id`,
              [store.id]
            );
          }

          if (clubMemberCategory) {
            // Add CLUB_MEMBER category assignment
            await query(
              `INSERT INTO contact_category_assignments (contact_id, category_id)
               VALUES ($1, $2)
               ON CONFLICT (contact_id, category_id) DO NOTHING`,
              [contact.id, clubMemberCategory.id]
            );
          }
        }
      } catch (error: any) {
        console.error('Error syncing customer to contact:', error);
        // Don't fail registration if contact sync fails
      }
    }

    // Emit customer.created event
    try {
      await eventBus.emitEvent('customer.created', {
        customer: {
          id: customer.id,
          email: customer.email,
          first_name: customer.first_name,
          last_name: customer.last_name,
        },
      }, {
        store_id: store.id,
        source: 'api',
      });
    } catch (error: any) {
      console.error('Error emitting customer.created event:', error);
      // Don't fail registration if event emission fails
    }

    // Send OTP for immediate login (reuse send-otp logic)
    // We'll redirect to login page where they can request OTP

    return NextResponse.json({
      success: true,
      message: 'הרשמה הצליחה!',
      customer: {
        id: customer.id,
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה בהרשמה' },
      { status: 500 }
    );
  }
}



