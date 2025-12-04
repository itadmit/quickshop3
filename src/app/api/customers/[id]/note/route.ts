import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { CustomerNote, CreateCustomerNoteRequest } from '@/types/customer';
import { getUserFromRequest } from '@/lib/auth';

// POST /api/customers/:id/note - Create customer note
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customerId = parseInt(id);
    if (isNaN(customerId)) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
    }

    const body: CreateCustomerNoteRequest = await request.json();

    // Verify customer exists
    const customer = await queryOne(
      'SELECT id FROM customers WHERE id = $1 AND store_id = $2',
      [customerId, user.store_id]
    );

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Create note
    const noteResult = await queryOne<CustomerNote>(
      `INSERT INTO customer_notes (
        customer_id, store_id, note, staff_only, created_at
      ) VALUES ($1, $2, $3, $4, now())
      RETURNING *`,
      [
        customerId,
        user.store_id,
        body.note,
        body.staff_only !== undefined ? body.staff_only : true,
      ]
    );

    if (!noteResult) {
      throw new Error('Failed to create note');
    }

    return NextResponse.json({ note: noteResult }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating customer note:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create note' },
      { status: 500 }
    );
  }
}

