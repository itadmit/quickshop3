import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Customer, CustomerWithDetails, CustomerAddress, CustomerNote, UpdateCustomerRequest } from '@/types/customer';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';
import { syncCustomerToContact } from '@/lib/contacts/sync-customer-to-contact';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/customers/:id - Get customer details
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
    const customerId = parseInt(id);
    if (isNaN(customerId)) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
    }

    // Get customer
    const customer = await queryOne<Customer>(
      'SELECT * FROM customers WHERE id = $1 AND store_id = $2',
      [customerId, user.store_id]
    );

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Get addresses, notes, orders count, and total spent
    const [addresses, notes, ordersData] = await Promise.all([
      query<CustomerAddress>(
        'SELECT * FROM customer_addresses WHERE customer_id = $1 ORDER BY default_address DESC, created_at DESC',
        [customerId]
      ),
      query<CustomerNote>(
        'SELECT * FROM customer_notes WHERE customer_id = $1 ORDER BY created_at DESC',
        [customerId]
      ),
      queryOne<{ orders_count: number; total_spent: string }>(
        `SELECT 
          COUNT(DISTINCT o.id) as orders_count,
          COALESCE(SUM(o.total_price::numeric), 0) as total_spent
        FROM orders o
        WHERE o.customer_id = $1`,
        [customerId]
      ),
    ]);

    const customerWithDetails: CustomerWithDetails = {
      ...customer,
      addresses,
      notes,
      orders_count: ordersData?.orders_count || 0,
      total_spent: ordersData?.total_spent || '0',
    };

    return NextResponse.json({ customer: customerWithDetails });
  } catch (error: any) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

// PUT /api/customers/:id - Update customer
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
    const customerId = parseInt(id);
    if (isNaN(customerId)) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
    }

    const body: UpdateCustomerRequest = await request.json();

    // Get existing customer
    const existingCustomer = await queryOne<Customer>(
      'SELECT * FROM customers WHERE id = $1 AND store_id = $2',
      [customerId, user.store_id]
    );

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
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

    if (body.phone !== undefined) {
      updates.push(`phone = $${paramIndex}`);
      values.push(body.phone);
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

    if (body.accepts_marketing !== undefined) {
      updates.push(`accepts_marketing = $${paramIndex}`);
      values.push(body.accepts_marketing);
      paramIndex++;
    }

    if (body.tags !== undefined) {
      updates.push(`tags = $${paramIndex}`);
      values.push(body.tags.join(','));
      paramIndex++;
    }

    if (body.note !== undefined) {
      updates.push(`note = $${paramIndex}`);
      values.push(body.note);
      paramIndex++;
    }

    if (body.state !== undefined) {
      updates.push(`state = $${paramIndex}`);
      values.push(body.state);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push(`updated_at = now()`);
    values.push(customerId, user.store_id);

    const sql = `
      UPDATE customers 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1}
      RETURNING *
    `;

    const updatedCustomer = await queryOne<Customer>(sql, values);

    if (!updatedCustomer) {
      return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
    }

    // Sync customer to contact (async, don't block API response)
    if (updatedCustomer.email) {
      syncCustomerToContact(user.store_id, updatedCustomer.id, {
        email: updatedCustomer.email,
        first_name: updatedCustomer.first_name,
        last_name: updatedCustomer.last_name,
        phone: updatedCustomer.phone,
        accepts_marketing: updatedCustomer.accepts_marketing,
        tags: updatedCustomer.tags,
        note: updatedCustomer.note,
      }).catch((error) => {
        console.warn('Failed to sync customer to contact:', error);
      });
    }

    // Emit customer.updated event
    await eventBus.emitEvent('customer.updated', {
      customer: {
        id: updatedCustomer.id,
        email: updatedCustomer.email,
        first_name: updatedCustomer.first_name,
        last_name: updatedCustomer.last_name,
      },
      changes: body,
    }, {
      store_id: user.store_id,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ customer: updatedCustomer });
  } catch (error: any) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update customer' },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/:id - Delete customer
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
    const customerId = parseInt(id);
    if (isNaN(customerId)) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
    }

    // Get customer before deletion for event
    const customer = await queryOne<Customer>(
      'SELECT * FROM customers WHERE id = $1 AND store_id = $2',
      [customerId, user.store_id]
    );

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Delete customer (CASCADE will delete related records)
    await query('DELETE FROM customers WHERE id = $1', [customerId]);

    // Emit customer.deleted event
    await eventBus.emitEvent('customer.deleted', {
      customer: {
        id: customer.id,
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
      },
    }, {
      store_id: user.store_id,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete customer' },
      { status: 500 }
    );
  }
}

