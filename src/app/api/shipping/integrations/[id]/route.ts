import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { StoreShippingIntegration } from '@/types/payment';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/shipping/integrations/[id] - Get single shipping integration
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

    const integration = await queryOne<StoreShippingIntegration>(
      `SELECT id, store_id, provider, display_name, customer_number, username,
              is_sandbox, is_active, is_default, auto_ship_enabled, auto_ship_on_payment,
              default_shipment_type, default_cargo_type, settings, created_at, updated_at
       FROM store_shipping_integrations 
       WHERE id = $1 AND store_id = $2`,
      [id, user.store_id]
    );

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    return NextResponse.json({ integration });
  } catch (error: any) {
    console.error('Error fetching shipping integration:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch shipping integration' },
      { status: 500 }
    );
  }
}

// PUT /api/shipping/integrations/[id] - Update shipping integration
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
    const body = await request.json();

    // Verify ownership
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM store_shipping_integrations WHERE id = $1 AND store_id = $2',
      [id, user.store_id]
    );

    if (!existing) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    const {
      display_name,
      customer_number,
      username,
      password,
      api_key,
      is_sandbox,
      is_active,
      is_default,
      auto_ship_enabled,
      auto_ship_on_payment,
      default_shipment_type,
      default_cargo_type,
      settings,
    } = body;

    // If this is set as default, unset other defaults
    if (is_default) {
      await query(
        'UPDATE store_shipping_integrations SET is_default = false WHERE store_id = $1 AND id != $2',
        [user.store_id, id]
      );
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (display_name !== undefined) {
      updates.push(`display_name = $${paramIndex++}`);
      values.push(display_name);
    }
    if (customer_number !== undefined) {
      updates.push(`customer_number = $${paramIndex++}`);
      values.push(customer_number);
    }
    if (username !== undefined) {
      updates.push(`username = $${paramIndex++}`);
      values.push(username);
    }
    if (password !== undefined) {
      updates.push(`password_encrypted = $${paramIndex++}`);
      values.push(password);
    }
    if (api_key !== undefined) {
      updates.push(`api_key_encrypted = $${paramIndex++}`);
      values.push(api_key);
    }
    if (is_sandbox !== undefined) {
      updates.push(`is_sandbox = $${paramIndex++}`);
      values.push(is_sandbox);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }
    if (is_default !== undefined) {
      updates.push(`is_default = $${paramIndex++}`);
      values.push(is_default);
    }
    if (auto_ship_enabled !== undefined) {
      updates.push(`auto_ship_enabled = $${paramIndex++}`);
      values.push(auto_ship_enabled);
    }
    if (auto_ship_on_payment !== undefined) {
      updates.push(`auto_ship_on_payment = $${paramIndex++}`);
      values.push(auto_ship_on_payment);
    }
    if (default_shipment_type !== undefined) {
      updates.push(`default_shipment_type = $${paramIndex++}`);
      values.push(default_shipment_type);
    }
    if (default_cargo_type !== undefined) {
      updates.push(`default_cargo_type = $${paramIndex++}`);
      values.push(default_cargo_type);
    }
    if (settings !== undefined) {
      updates.push(`settings = $${paramIndex++}`);
      values.push(JSON.stringify(settings));
    }

    updates.push(`updated_at = now()`);
    values.push(id);

    const integration = await queryOne<StoreShippingIntegration>(
      `UPDATE store_shipping_integrations 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, store_id, provider, display_name, customer_number, username,
                 is_sandbox, is_active, is_default, auto_ship_enabled, auto_ship_on_payment,
                 default_shipment_type, default_cargo_type, settings, created_at, updated_at`,
      values
    );

    return NextResponse.json({ integration });
  } catch (error: any) {
    console.error('Error updating shipping integration:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update shipping integration' },
      { status: 500 }
    );
  }
}

// DELETE /api/shipping/integrations/[id] - Delete shipping integration
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

    const result = await queryOne<{ id: number }>(
      'DELETE FROM store_shipping_integrations WHERE id = $1 AND store_id = $2 RETURNING id',
      [id, user.store_id]
    );

    if (!result) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting shipping integration:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete shipping integration' },
      { status: 500 }
    );
  }
}

