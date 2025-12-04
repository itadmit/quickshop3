import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { PaymentProvider, CreatePaymentProviderRequest } from '@/types/payment';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/payments/providers - List all payment providers
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const providers = await query<PaymentProvider>(
      'SELECT * FROM payment_providers WHERE store_id = $1 ORDER BY created_at DESC',
      [user.store_id]
    );

    return NextResponse.json({ providers });
  } catch (error: any) {
    console.error('Error fetching payment providers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payment providers' },
      { status: 500 }
    );
  }
}

// POST /api/payments/providers - Create payment provider
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreatePaymentProviderRequest = await request.json();
    const storeId = user.store_id;

    const provider = await queryOne<PaymentProvider>(
      `INSERT INTO payment_providers (
        store_id, provider_name, environment, api_public_key, api_secret_key,
        webhook_secret, is_active, settings, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
      RETURNING *`,
      [
        storeId,
        body.provider_name,
        body.environment || 'test',
        body.api_public_key || null,
        body.api_secret_key || null,
        body.webhook_secret || null,
        body.is_active !== undefined ? body.is_active : false,
        body.settings ? JSON.stringify(body.settings) : null,
      ]
    );

    if (!provider) {
      throw new Error('Failed to create payment provider');
    }

    // Emit event
    await eventBus.emitEvent('payment.provider.created', {
      provider: {
        id: provider.id,
        provider_name: provider.provider_name,
        environment: provider.environment,
      },
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ provider }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating payment provider:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment provider' },
      { status: 500 }
    );
  }
}

