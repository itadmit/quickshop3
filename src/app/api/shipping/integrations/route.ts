import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { StoreShippingIntegration } from '@/types/payment';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/shipping/integrations - List all shipping integrations
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const integrations = await query<StoreShippingIntegration>(
      `SELECT id, store_id, provider, display_name, customer_number, username,
              is_sandbox, is_active, is_default, auto_ship_enabled, auto_ship_on_payment,
              default_shipment_type, default_cargo_type, settings, created_at, updated_at
       FROM store_shipping_integrations 
       WHERE store_id = $1 
       ORDER BY is_default DESC, created_at DESC`,
      [user.store_id]
    );

    return NextResponse.json({ integrations });
  } catch (error: any) {
    console.error('Error fetching shipping integrations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch shipping integrations' },
      { status: 500 }
    );
  }
}

// POST /api/shipping/integrations - Create shipping integration
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
      customer_number,
      username,
      password,
      api_key,
      is_sandbox = true,
      is_active = false,
      is_default = false,
      auto_ship_enabled = false,
      auto_ship_on_payment = false,
      default_shipment_type,
      default_cargo_type,
      settings = {},
    } = body;

    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
    }

    // If this is set as default, unset other defaults
    if (is_default) {
      await query(
        'UPDATE store_shipping_integrations SET is_default = false WHERE store_id = $1',
        [user.store_id]
      );
    }

    const integration = await queryOne<StoreShippingIntegration>(
      `INSERT INTO store_shipping_integrations (
        store_id, provider, display_name, customer_number, username,
        password_encrypted, api_key_encrypted, is_sandbox, is_active, is_default,
        auto_ship_enabled, auto_ship_on_payment, default_shipment_type, default_cargo_type, settings
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id, store_id, provider, display_name, customer_number, username,
                is_sandbox, is_active, is_default, auto_ship_enabled, auto_ship_on_payment,
                default_shipment_type, default_cargo_type, settings, created_at, updated_at`,
      [
        user.store_id,
        provider,
        display_name || null,
        customer_number || null,
        username || null,
        password || null,
        api_key || null,
        is_sandbox,
        is_active,
        is_default,
        auto_ship_enabled,
        auto_ship_on_payment,
        default_shipment_type || null,
        default_cargo_type || null,
        JSON.stringify(settings),
      ]
    );

    return NextResponse.json({ integration }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating shipping integration:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create shipping integration' },
      { status: 500 }
    );
  }
}

