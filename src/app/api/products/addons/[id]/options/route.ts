import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// POST /api/products/addons/:id/options - Create addon option
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

    const addonId = parseInt(id);
    if (isNaN(addonId)) {
      return NextResponse.json({ error: 'Invalid addon ID' }, { status: 400 });
    }

    const body = await request.json();
    const { label, value, price_modifier, position } = body;

    if (!label || !label.trim()) {
      return NextResponse.json({ error: 'Option label is required' }, { status: 400 });
    }

    const storeId = user.store_id;

    // Verify addon belongs to store
    const addon = await queryOne<{ id: number; store_id: number }>(
      'SELECT id, store_id FROM product_addons WHERE id = $1',
      [addonId]
    );

    if (!addon || addon.store_id !== storeId) {
      return NextResponse.json({ error: 'Addon not found' }, { status: 404 });
    }

    // Get max position if not provided
    let finalPosition = position;
    if (finalPosition === undefined || finalPosition === null) {
      const maxPos = await queryOne<{ max_position: number }>(
        'SELECT COALESCE(MAX(position), 0) as max_position FROM product_addon_options WHERE addon_id = $1',
        [addonId]
      );
      finalPosition = (maxPos?.max_position || 0) + 1;
    }

    // Create option
    const option = await queryOne<{
      id: number;
      label: string;
      value: string | null;
      price_modifier: number;
      position: number;
    }>(
      `INSERT INTO product_addon_options (addon_id, label, value, price_modifier, position, created_at)
       VALUES ($1, $2, $3, $4, $5, now())
       RETURNING id, label, value, price_modifier, position`,
      [
        addonId,
        label.trim(),
        value || null,
        price_modifier || 0,
        finalPosition,
      ]
    );

    if (!option) {
      throw new Error('Failed to create option');
    }

    // Emit event
    await eventBus.emitEvent('product.addon.option.created', {
      addon_id: addonId,
      option: {
        id: option.id,
        label: option.label,
      },
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ option }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating addon option:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create addon option' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/addons/:id/options - Delete addon option
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
    
    // Get option ID from query string or body
    const url = new URL(request.url);
    const optionIdParam = url.searchParams.get('option_id') || (await request.json()).option_id;
    const optionId = optionIdParam ? parseInt(optionIdParam) : NaN;

    if (isNaN(addonId) || isNaN(optionId)) {
      return NextResponse.json({ error: 'Invalid addon or option ID' }, { status: 400 });
    }

    const storeId = user.store_id;

    // Verify addon belongs to store
    const addon = await queryOne<{ id: number; store_id: number }>(
      'SELECT id, store_id FROM product_addons WHERE id = $1',
      [addonId]
    );

    if (!addon || addon.store_id !== storeId) {
      return NextResponse.json({ error: 'Addon not found' }, { status: 404 });
    }

    // Verify option belongs to addon
    const option = await queryOne<{ id: number; addon_id: number }>(
      'SELECT id, addon_id FROM product_addon_options WHERE id = $1',
      [optionId]
    );

    if (!option || option.addon_id !== addonId) {
      return NextResponse.json({ error: 'Option not found' }, { status: 404 });
    }

    // Delete option
    await query(
      'DELETE FROM product_addon_options WHERE id = $1',
      [optionId]
    );

    // Emit event
    await eventBus.emitEvent('product.addon.option.deleted', {
      addon_id: addonId,
      option_id: optionId,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ 
      success: true,
      message: 'Option deleted successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting addon option:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete addon option' },
      { status: 500 }
    );
  }
}

