import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Contact, ContactWithDetails, UpdateContactRequest } from '@/types/contact';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/contacts/:id - Get contact details
export async function GET(
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

    // Get category assignments
    const categoryAssignments = await query<{ id: number; category: any }>(
      `SELECT 
        cca.id,
        json_build_object(
          'id', cc.id,
          'store_id', cc.store_id,
          'type', cc.type,
          'name', cc.name,
          'color', cc.color,
          'created_at', cc.created_at,
          'updated_at', cc.updated_at
        ) as category
      FROM contact_category_assignments cca
      JOIN contact_categories cc ON cca.category_id = cc.id
      WHERE cca.contact_id = $1`,
      [contactId]
    );

    // ✅ בדיקה אם יש לקוח קיים עם אותו אימייל (אם אין customer_id קשור)
    let customerData = null;
    let finalCustomerId = contact.customer_id;

    if (!contact.customer_id && contact.email) {
      // בדיקה אם יש לקוח קיים עם אותו אימייל
      const existingCustomer = await queryOne<{ id: number }>(
        'SELECT id FROM customers WHERE store_id = $1 AND email = $2',
        [user.store_id, contact.email]
      );

      if (existingCustomer) {
        // ✅ קישור אוטומטי של איש הקשר ללקוח הקיים
        await query(
          'UPDATE contacts SET customer_id = $1 WHERE id = $2',
          [existingCustomer.id, contactId]
        );
        finalCustomerId = existingCustomer.id;
      }
    }

    // ✅ טעינת נתוני הלקוח אם יש customer_id
    if (finalCustomerId) {
      const customerStats = await queryOne<{ total_spent: string; orders_count: number }>(
        `SELECT 
          COALESCE(SUM(o.total_price::numeric), 0) as total_spent,
          COUNT(DISTINCT o.id) as orders_count
        FROM orders o
        WHERE o.customer_id = $1`,
        [finalCustomerId]
      );

      if (customerStats) {
        customerData = {
          id: finalCustomerId,
          total_spent: customerStats.total_spent,
          orders_count: customerStats.orders_count,
        };
      }
    }

    const contactWithDetails: ContactWithDetails = {
      ...contact,
      customer_id: finalCustomerId || contact.customer_id, // ✅ עדכון customer_id אם נמצא לקוח קיים
      category_assignments: categoryAssignments.map((ca: any) => ({
        id: ca.id,
        category: ca.category,
      })),
      customer: customerData || undefined, // ✅ הוספת נתוני הלקוח
    };

    return NextResponse.json({ contact: contactWithDetails });
  } catch (error: any) {
    console.error('Error fetching contact:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch contact' },
      { status: 500 }
    );
  }
}

// PUT /api/contacts/:id - Update contact
export async function PUT(
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

    const body: UpdateContactRequest = await request.json();

    // Get existing contact
    const existingContact = await queryOne<Contact>(
      'SELECT * FROM contacts WHERE id = $1 AND store_id = $2',
      [contactId, user.store_id]
    );

    if (!existingContact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (body.email !== undefined) {
      updates.push(`email = $${paramIndex}`);
      values.push(body.email);
      paramIndex++;
    }

    if (body.first_name !== undefined) {
      updates.push(`first_name = $${paramIndex}`);
      values.push(body.first_name);
      paramIndex++;
    }

    if (body.last_name !== undefined) {
      updates.push(`last_name = $${paramIndex}`);
      values.push(body.last_name);
      paramIndex++;
    }

    if (body.phone !== undefined) {
      updates.push(`phone = $${paramIndex}`);
      values.push(body.phone);
      paramIndex++;
    }

    if (body.company !== undefined) {
      updates.push(`company = $${paramIndex}`);
      values.push(body.company);
      paramIndex++;
    }

    if (body.notes !== undefined) {
      updates.push(`notes = $${paramIndex}`);
      values.push(body.notes);
      paramIndex++;
    }

    if (body.tags !== undefined) {
      updates.push(`tags = $${paramIndex}`);
      values.push(body.tags);
      paramIndex++;
    }

    if (body.email_marketing_consent !== undefined) {
      updates.push(`email_marketing_consent = $${paramIndex}`);
      values.push(body.email_marketing_consent);
      paramIndex++;
      
      if (body.email_marketing_consent && !existingContact.email_marketing_consent) {
        updates.push(`email_marketing_consent_at = now()`);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push(`updated_at = now()`);
    values.push(contactId, user.store_id);

    const sql = `
      UPDATE contacts 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1}
      RETURNING *
    `;

    const updatedContact = await queryOne<Contact>(sql, values);

    if (!updatedContact) {
      return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
    }

    // Update category assignments if provided
    if (body.category_types !== undefined) {
      // Remove existing assignments
      await query(
        'DELETE FROM contact_category_assignments WHERE contact_id = $1',
        [contactId]
      );

      // Add new assignments
      if (body.category_types.length > 0) {
        const categories = await query<{ id: number }>(
          'SELECT id FROM contact_categories WHERE store_id = $1 AND type = ANY($2::text[])',
          [user.store_id, body.category_types]
        );

        for (const category of categories) {
          await query(
            'INSERT INTO contact_category_assignments (contact_id, category_id) VALUES ($1, $2)',
            [contactId, category.id]
          );
        }
      }
    }

    // Emit event
    await eventBus.emitEvent('contact.updated', {
      contact: {
        id: updatedContact.id,
        email: updatedContact.email,
      },
    }, {
      store_id: user.store_id,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ contact: updatedContact });
  } catch (error: any) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update contact' },
      { status: 500 }
    );
  }
}

// DELETE /api/contacts/:id - Delete contact
export async function DELETE(
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

    // Get contact before deletion for event
    const contact = await queryOne<Contact>(
      'SELECT * FROM contacts WHERE id = $1 AND store_id = $2',
      [contactId, user.store_id]
    );

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Delete contact (CASCADE will delete category assignments)
    await query('DELETE FROM contacts WHERE id = $1', [contactId]);

    // Emit event
    await eventBus.emitEvent('contact.deleted', {
      contact: {
        id: contact.id,
        email: contact.email,
      },
    }, {
      store_id: user.store_id,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ success: true, message: 'Contact deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete contact' },
      { status: 500 }
    );
  }
}

