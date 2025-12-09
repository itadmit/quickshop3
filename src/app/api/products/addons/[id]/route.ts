import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/products/addons/:id - Get addon details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const addonId = parseInt(id);
    if (isNaN(addonId)) {
      return NextResponse.json({ error: 'Invalid addon ID' }, { status: 400 });
    }

    const storeId = user.store_id;

    const addon = await queryOne<{
      id: number;
      name: string;
      addon_type: string;
      settings: any;
    }>(
      'SELECT * FROM product_addons WHERE id = $1 AND store_id = $2',
      [addonId, storeId]
    );

    if (!addon) {
      return NextResponse.json({ error: 'Addon not found' }, { status: 404 });
    }

    // Get options
    const options = await query(
      'SELECT * FROM product_addon_options WHERE addon_id = $1 ORDER BY position',
      [addonId]
    );

    const parsedAddon = {
      ...addon,
      options,
      settings: typeof addon.settings === 'string' ? JSON.parse(addon.settings) : addon.settings,
    };

    return NextResponse.json({ addon: parsedAddon });
  } catch (error: any) {
    console.error('Error fetching addon:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch addon' },
      { status: 500 }
    );
  }
}

// PUT /api/products/addons/:id - Update addon
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
    const addonId = parseInt(id);
    if (isNaN(addonId)) {
      return NextResponse.json({ error: 'Invalid addon ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, addon_type, is_required, price_modifier, settings } = body;

    const storeId = user.store_id;

    // Get old addon for comparison
    const oldAddon = await queryOne<{ id: number; store_id: number }>(
      'SELECT id, store_id FROM product_addons WHERE id = $1',
      [addonId]
    );

    if (!oldAddon || oldAddon.store_id !== storeId) {
      return NextResponse.json({ error: 'Addon not found' }, { status: 404 });
    }

    // Build dynamic update query - only update fields that were explicitly sent
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if ('name' in body) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(name ? name.trim() : null);
    }
    if ('description' in body) {
      updateFields.push(`description = $${paramIndex++}`);
      values.push(description || null);
    }
    if ('addon_type' in body) {
      updateFields.push(`addon_type = $${paramIndex++}`);
      values.push(addon_type || null);
    }
    if ('is_required' in body) {
      updateFields.push(`is_required = $${paramIndex++}`);
      values.push(is_required);
    }
    if ('price_modifier' in body) {
      updateFields.push(`price_modifier = $${paramIndex++}`);
      values.push(price_modifier ?? null);
    }
    if ('settings' in body) {
      updateFields.push(`settings = $${paramIndex++}`);
      values.push(settings ? JSON.stringify(settings) : null);
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updateFields.push('updated_at = now()');
    values.push(addonId, storeId);

    // Update addon
    const addon = await queryOne<{
      id: number;
      name: string;
      addon_type: string;
      settings: any;
    }>(
      `UPDATE product_addons 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1}
       RETURNING id, name, addon_type, settings`,
      values
    );

    if (!addon) {
      throw new Error('Failed to update addon');
    }

    // Get options
    const options = await query(
      'SELECT * FROM product_addon_options WHERE addon_id = $1 ORDER BY position',
      [addonId]
    );

    const parsedAddon = {
      ...addon,
      options,
      settings: typeof addon.settings === 'string' ? JSON.parse(addon.settings) : addon.settings,
    };

    // Emit event
    await eventBus.emitEvent('product.addon.updated', {
      addon: {
        id: parsedAddon.id,
        name: parsedAddon.name,
        addon_type: parsedAddon.addon_type,
      },
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ addon: parsedAddon });
  } catch (error: any) {
    console.error('Error updating addon:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update addon' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/addons/:id - Delete addon
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
    const addonId = parseInt(id);
    if (isNaN(addonId)) {
      return NextResponse.json({ error: 'Invalid addon ID' }, { status: 400 });
    }

    const storeId = user.store_id;

    // Get addon before deletion for event
    const addon = await queryOne<{ id: number; name: string }>(
      'SELECT id, name FROM product_addons WHERE id = $1 AND store_id = $2',
      [addonId, storeId]
    );

    if (!addon) {
      return NextResponse.json({ error: 'Addon not found' }, { status: 404 });
    }

    // Delete addon (CASCADE will delete options and mappings)
    await query(
      'DELETE FROM product_addons WHERE id = $1',
      [addonId]
    );

    // Emit event
    await eventBus.emitEvent('product.addon.deleted', {
      addon_id: addonId,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ 
      success: true,
      message: 'Addon deleted successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting addon:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete addon' },
      { status: 500 }
    );
  }
}

