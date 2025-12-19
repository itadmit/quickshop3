import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { StorePaymentIntegration, PaymentProviderType } from '@/types/payment';
import { getUserFromRequest } from '@/lib/auth';
import { getAvailableProviders, getAllProviders, getProviderConfig } from '@/lib/payments/providers';

// GET /api/payments/integrations - List all payment integrations
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const integrations = await query<StorePaymentIntegration>(
      `SELECT 
        id, store_id, provider, display_name, terminal_number, username,
        is_sandbox, is_active, is_default, settings, created_at, updated_at
      FROM store_payment_integrations 
      WHERE store_id = $1 
      ORDER BY is_default DESC, created_at DESC`,
      [user.store_id]
    );

    // Return with provider info from config
    const integrationsWithMeta = integrations.map(integration => {
      const providerConfig = getProviderConfig(integration.provider as PaymentProviderType);
      return {
        ...integration,
        provider_config: providerConfig,
      };
    });

    // Get all providers with their full config
    const allProviders = getAllProviders();

    return NextResponse.json({ 
      integrations: integrationsWithMeta,
      providers: allProviders,
    });
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
    const storeId = user.store_id;

    // Validate provider exists in config
    const providerConfig = getProviderConfig(body.provider as PaymentProviderType);
    if (!providerConfig) {
      return NextResponse.json(
        { error: 'ספק תשלום לא נתמך' },
        { status: 400 }
      );
    }

    // Check if provider is coming soon
    if (providerConfig.isComingSoon) {
      return NextResponse.json(
        { error: 'ספק תשלום זה עדיין לא זמין' },
        { status: 400 }
      );
    }

    // Check if provider already exists for this store
    const existing = await queryOne<StorePaymentIntegration>(
      'SELECT id FROM store_payment_integrations WHERE store_id = $1 AND provider = $2',
      [storeId, body.provider]
    );

    if (existing) {
      return NextResponse.json(
        { error: 'ספק תשלום זה כבר מוגדר לחנות' },
        { status: 400 }
      );
    }

    // If this is the first integration, make it default
    const existingCount = await queryOne<{ count: number }>(
      'SELECT COUNT(*)::int as count FROM store_payment_integrations WHERE store_id = $1',
      [storeId]
    );
    const isDefault = existingCount?.count === 0;

    // Build settings object from body (excluding known fields)
    const knownFields = ['provider', 'display_name', 'terminal_number', 'username', 'password', 'api_key', 'is_sandbox', 'is_active', 'settings'];
    const additionalSettings: Record<string, any> = {};
    for (const [key, value] of Object.entries(body)) {
      if (!knownFields.includes(key) && value !== undefined && value !== '') {
        additionalSettings[key] = value;
      }
    }

    // Merge with explicit settings
    const finalSettings = {
      ...(body.settings || {}),
      ...additionalSettings,
    };

    // TODO: Encrypt password and api_key before storing
    const integration = await queryOne<StorePaymentIntegration>(
      `INSERT INTO store_payment_integrations (
        store_id, provider, display_name, terminal_number, username,
        password_encrypted, api_key_encrypted, is_sandbox, is_active, 
        is_default, settings, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now(), now())
      RETURNING *`,
      [
        storeId,
        body.provider,
        body.display_name || null,
        body.terminal_number || null,
        body.username || null,
        body.password || null, // TODO: Encrypt
        body.api_key || null, // TODO: Encrypt
        body.is_sandbox !== false, // Default to sandbox
        body.is_active || false,
        isDefault,
        JSON.stringify(finalSettings),
      ]
    );

    if (!integration) {
      throw new Error('Failed to create payment integration');
    }

    return NextResponse.json({ 
      integration: {
        ...integration,
        password_encrypted: undefined, // Don't return sensitive data
        api_key_encrypted: undefined,
        provider_config: providerConfig,
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating payment integration:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment integration' },
      { status: 500 }
    );
  }
}
