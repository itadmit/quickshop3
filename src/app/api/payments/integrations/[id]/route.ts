import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { StorePaymentIntegration } from '@/types/payment';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/payments/integrations/:id - Get payment integration
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
    const integrationId = parseInt(id);
    
    const integration = await queryOne<StorePaymentIntegration>(
      `SELECT 
        id, store_id, provider, display_name, terminal_number, username,
        is_sandbox, is_active, is_default, settings, created_at, updated_at
      FROM store_payment_integrations 
      WHERE id = $1 AND store_id = $2`,
      [integrationId, user.store_id]
    );

    if (!integration) {
      return NextResponse.json({ error: 'Payment integration not found' }, { status: 404 });
    }

    return NextResponse.json({ integration });
  } catch (error: any) {
    console.error('Error fetching payment integration:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payment integration' },
      { status: 500 }
    );
  }
}

// PUT /api/payments/integrations/:id - Update payment integration
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
    const integrationId = parseInt(id);
    const body = await request.json();

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Update fields
    if (body.display_name !== undefined) {
      updates.push(`display_name = $${paramIndex}`);
      values.push(body.display_name);
      paramIndex++;
    }

    if (body.terminal_number !== undefined) {
      updates.push(`terminal_number = $${paramIndex}`);
      values.push(body.terminal_number);
      paramIndex++;
    }

    if (body.username !== undefined) {
      updates.push(`username = $${paramIndex}`);
      values.push(body.username);
      paramIndex++;
    }

    if (body.password !== undefined) {
      // TODO: Encrypt password before storing
      updates.push(`password_encrypted = $${paramIndex}`);
      values.push(body.password);
      paramIndex++;
    }

    if (body.api_key !== undefined) {
      // TODO: Encrypt api_key before storing
      updates.push(`api_key_encrypted = $${paramIndex}`);
      values.push(body.api_key);
      paramIndex++;
    }

    if (body.is_sandbox !== undefined) {
      updates.push(`is_sandbox = $${paramIndex}`);
      values.push(body.is_sandbox);
      paramIndex++;
    }

    if (body.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      values.push(body.is_active);
      paramIndex++;
    }

    if (body.is_default !== undefined) {
      updates.push(`is_default = $${paramIndex}`);
      values.push(body.is_default);
      paramIndex++;

      // If setting as default, unset other defaults
      if (body.is_default) {
        await query(
          'UPDATE store_payment_integrations SET is_default = false WHERE store_id = $1 AND id != $2',
          [user.store_id, integrationId]
        );
      }
    }

    if (body.settings !== undefined) {
      updates.push(`settings = $${paramIndex}`);
      values.push(JSON.stringify(body.settings));
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push(`updated_at = now()`);
    values.push(integrationId, user.store_id);

    const sql = `
      UPDATE store_payment_integrations 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1}
      RETURNING id, store_id, provider, display_name, terminal_number, username,
                is_sandbox, is_active, is_default, settings, created_at, updated_at
    `;

    const updatedIntegration = await queryOne<StorePaymentIntegration>(sql, values);

    if (!updatedIntegration) {
      return NextResponse.json({ error: 'Failed to update payment integration' }, { status: 500 });
    }

    return NextResponse.json({ integration: updatedIntegration });
  } catch (error: any) {
    console.error('Error updating payment integration:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update payment integration' },
      { status: 500 }
    );
  }
}

// DELETE /api/payments/integrations/:id - Delete payment integration
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
    const integrationId = parseInt(id);
    if (isNaN(integrationId)) {
      return NextResponse.json({ error: 'Invalid integration ID' }, { status: 400 });
    }

    const integration = await queryOne<StorePaymentIntegration>(
      'SELECT * FROM store_payment_integrations WHERE id = $1 AND store_id = $2',
      [integrationId, user.store_id]
    );

    if (!integration) {
      return NextResponse.json({ error: 'Payment integration not found' }, { status: 404 });
    }

    await query(
      'DELETE FROM store_payment_integrations WHERE id = $1 AND store_id = $2',
      [integrationId, user.store_id]
    );

    // If we deleted the default, set another one as default
    if (integration.is_default) {
      await query(
        `UPDATE store_payment_integrations 
         SET is_default = true 
         WHERE store_id = $1 
         ORDER BY created_at ASC 
         LIMIT 1`,
        [user.store_id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting payment integration:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete payment integration' },
      { status: 500 }
    );
  }
}
