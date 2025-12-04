import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { PaymentProvider, CreatePaymentProviderRequest } from '@/types/payment';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/payments/providers/:id - Get payment provider
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
    const providerId = parseInt(id);
    const provider = await queryOne<PaymentProvider>(
      'SELECT * FROM payment_providers WHERE id = $1 AND store_id = $2',
      [providerId, user.store_id]
    );

    if (!provider) {
      return NextResponse.json({ error: 'Payment provider not found' }, { status: 404 });
    }

    return NextResponse.json({ provider });
  } catch (error: any) {
    console.error('Error fetching payment provider:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payment provider' },
      { status: 500 }
    );
  }
}

// PUT /api/payments/providers/:id - Update payment provider
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
    const providerId = parseInt(id);
    const body: Partial<CreatePaymentProviderRequest> = await request.json();

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (body.provider_name !== undefined) {
      updates.push(`provider_name = $${paramIndex}`);
      values.push(body.provider_name);
      paramIndex++;
    }

    if (body.environment !== undefined) {
      updates.push(`environment = $${paramIndex}`);
      values.push(body.environment);
      paramIndex++;
    }

    if (body.api_public_key !== undefined) {
      updates.push(`api_public_key = $${paramIndex}`);
      values.push(body.api_public_key);
      paramIndex++;
    }

    if (body.api_secret_key !== undefined) {
      updates.push(`api_secret_key = $${paramIndex}`);
      values.push(body.api_secret_key);
      paramIndex++;
    }

    if (body.webhook_secret !== undefined) {
      updates.push(`webhook_secret = $${paramIndex}`);
      values.push(body.webhook_secret);
      paramIndex++;
    }

    if (body.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      values.push(body.is_active);
      paramIndex++;
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
    values.push(providerId, user.store_id);

    const sql = `
      UPDATE payment_providers 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1}
      RETURNING *
    `;

    const updatedProvider = await queryOne<PaymentProvider>(sql, values);

    if (!updatedProvider) {
      return NextResponse.json({ error: 'Failed to update payment provider' }, { status: 500 });
    }

    // Emit event
    await eventBus.emitEvent('payment.provider.updated', {
      provider: {
        id: updatedProvider.id,
        provider_name: updatedProvider.provider_name,
      },
      changes: body,
    }, {
      store_id: user.store_id,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ provider: updatedProvider });
  } catch (error: any) {
    console.error('Error updating payment provider:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update payment provider' },
      { status: 500 }
    );
  }
}

// DELETE /api/payments/providers/:id - Delete payment provider
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
    const providerId = parseInt(id);
    if (isNaN(providerId)) {
      return NextResponse.json({ error: 'Invalid provider ID' }, { status: 400 });
    }

    const provider = await queryOne<PaymentProvider>(
      'SELECT * FROM payment_providers WHERE id = $1 AND store_id = $2',
      [providerId, user.store_id]
    );

    if (!provider) {
      return NextResponse.json({ error: 'Payment provider not found' }, { status: 404 });
    }

    await query(
      'DELETE FROM payment_providers WHERE id = $1 AND store_id = $2',
      [providerId, user.store_id]
    );

    // Emit event
    await eventBus.emitEvent('payment.provider.deleted', {
      provider: {
        id: provider.id,
        provider_name: provider.provider_name,
      },
    }, {
      store_id: user.store_id,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting payment provider:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete payment provider' },
      { status: 500 }
    );
  }
}

