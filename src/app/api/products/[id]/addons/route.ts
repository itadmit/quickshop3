import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/products/:id/addons - Get addons for a product
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
    const productId = parseInt(id);
    const storeId = user.store_id;

    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    // Verify product belongs to store
    const product = await queryOne<{ id: number; store_id: number }>(
      'SELECT id, store_id FROM products WHERE id = $1',
      [productId]
    );

    if (!product || product.store_id !== storeId) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get addons for this product
    const addons = await query(
      `SELECT pa.*, pao.id as option_id, pao.label, pao.value, pao.price as option_price
       FROM product_addons pa
       INNER JOIN product_addon_map pam ON pa.id = pam.addon_id
       LEFT JOIN product_addon_options pao ON pa.id = pao.addon_id
       WHERE pam.product_id = $1
       ORDER BY pa.id, pao.position`,
      [productId]
    );

    // Group by addon
    const groupedAddons: Record<number, any> = {};
    addons.forEach((row: any) => {
      if (!groupedAddons[row.id]) {
        groupedAddons[row.id] = {
          id: row.id,
          name: row.name,
          description: row.description,
          addon_type: row.addon_type,
          is_required: row.is_required,
          price_modifier: row.price_modifier,
          settings: row.settings,
          options: [],
        };
      }
      if (row.option_id) {
        groupedAddons[row.id].options.push({
          id: row.option_id,
          label: row.label,
          value: row.value,
          price: row.option_price,
        });
      }
    });

    return NextResponse.json({ addons: Object.values(groupedAddons) });
  } catch (error: any) {
    console.error('Error fetching product addons:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product addons' },
      { status: 500 }
    );
  }
}

// POST /api/products/:id/addons - Link product to addon
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

    const productId = parseInt(id);
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const body = await request.json();
    const { addon_id } = body;

    if (!addon_id) {
      return NextResponse.json({ error: 'addon_id is required' }, { status: 400 });
    }

    const storeId = user.store_id;

    // Verify product belongs to store
    const product = await queryOne<{ id: number; store_id: number }>(
      'SELECT id, store_id FROM products WHERE id = $1',
      [productId]
    );

    if (!product || product.store_id !== storeId) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Verify addon belongs to store
    const addon = await queryOne<{ id: number; store_id: number }>(
      'SELECT id, store_id FROM product_addons WHERE id = $1',
      [addon_id]
    );

    if (!addon || addon.store_id !== storeId) {
      return NextResponse.json({ error: 'Addon not found' }, { status: 404 });
    }

    // Check if mapping already exists
    const existing = await queryOne<{ product_id: number }>(
      'SELECT product_id FROM product_addon_map WHERE product_id = $1 AND addon_id = $2',
      [productId, addon_id]
    );

    if (existing) {
      return NextResponse.json({ 
        success: true, 
        message: 'Product already linked to this addon' 
      });
    }

    // Link product to addon
    await query(
      'INSERT INTO product_addon_map (product_id, addon_id) VALUES ($1, $2)',
      [productId, addon_id]
    );

    // Emit event
    await eventBus.emitEvent('product.addon.linked', {
      product_id: productId,
      addon_id: addon_id,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ 
      success: true,
      message: 'Addon linked to product successfully' 
    });
  } catch (error: any) {
    console.error('Error linking addon to product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to link addon to product' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/:id/addons - Unlink product from addon
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
    const productId = parseInt(id);
    
    // Get addon ID from query string or body
    const url = new URL(request.url);
    let addonId: number | null = null;
    
    const addonIdParam = url.searchParams.get('addon_id');
    if (addonIdParam) {
      addonId = parseInt(addonIdParam);
    } else {
      try {
        const body = await request.json();
        addonId = body.addon_id ? parseInt(body.addon_id) : null;
      } catch {
        // Body might be empty
      }
    }

    if (isNaN(productId) || !addonId || isNaN(addonId)) {
      return NextResponse.json({ error: 'Invalid product or addon ID' }, { status: 400 });
    }

    const storeId = user.store_id;

    // Verify product belongs to store
    const product = await queryOne<{ id: number; store_id: number }>(
      'SELECT id, store_id FROM products WHERE id = $1',
      [productId]
    );

    if (!product || product.store_id !== storeId) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Unlink product from addon
    await query(
      'DELETE FROM product_addon_map WHERE product_id = $1 AND addon_id = $2',
      [productId, addonId]
    );

    // Emit event
    await eventBus.emitEvent('product.addon.unlinked', {
      product_id: productId,
      addon_id: addonId,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ 
      success: true,
      message: 'Addon unlinked from product successfully' 
    });
  } catch (error: any) {
    console.error('Error unlinking addon from product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to unlink addon from product' },
      { status: 500 }
    );
  }
}
