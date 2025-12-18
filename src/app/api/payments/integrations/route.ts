import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { StorePaymentIntegration } from '@/types/payment';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/payments/integrations - List all payment integrations
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const integrations = await query<StorePaymentIntegration>(
      `SELECT id, store_id, provider, display_name, terminal_number, username,
              is_sandbox, is_active, is_default, settings, created_at, updated_at
       FROM store_payment_integrations 
       WHERE store_id = $1 
       ORDER BY is_default DESC, created_at DESC`,
      [user.store_id]
    );

    // Don't return encrypted passwords
    return NextResponse.json({ integrations });
  } catch (error: any) {
    console.error('Error fetching payment integrations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payment integrations' },
      { status: 500 }
    );
  }
}

// POST /api/payments/integrations - Create payment integration
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      provider,
      display_name,
      terminal_number,
      username,
      password,
      api_key,
      is_sandbox = true,
      is_active = false,
      is_default = false,
      settings = {},
    } = body;

    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
    }

    // If this is set as default, unset other defaults
    if (is_default) {
      await query(
        'UPDATE store_payment_integrations SET is_default = false WHERE store_id = $1',
        [user.store_id]
      );
    }

    // TODO: Encrypt password and api_key before storing
    const integration = await queryOne<StorePaymentIntegration>(
      `INSERT INTO store_payment_integrations (
        store_id, provider, display_name, terminal_number, username,
        password_encrypted, api_key_encrypted, is_sandbox, is_active, is_default, settings
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, store_id, provider, display_name, terminal_number, username,
                is_sandbox, is_active, is_default, settings, created_at, updated_at`,
      [
        user.store_id,
        provider,
        display_name || null,
        terminal_number || null,
        username || null,
        password || null, // Should be encrypted
        api_key || null, // Should be encrypted
        is_sandbox,
        is_active,
        is_default,
        JSON.stringify(settings),
      ]
    );

    return NextResponse.json({ integration }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating payment integration:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment integration' },
      { status: 500 }
    );
  }
}

