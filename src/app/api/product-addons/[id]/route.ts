import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/product-addons/[id] - Get single product addon
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
    const addonId = parseInt(id);
    const storeId = user.store_id;

    if (isNaN(addonId)) {
      return NextResponse.json({ error: 'Invalid addon ID' }, { status: 400 });
    }

    const addon = await queryOne<{
      id: number;
      store_id: number;
      name: string;
      description: string | null;
      addon_type: string;
      is_required: boolean;
      scope: string;
      product_ids: number[];
      category_ids: number[];
      position: number;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT id, store_id, name, description, addon_type, is_required,
              scope, product_ids, category_ids, position, created_at, updated_at
       FROM product_addons
       WHERE id = $1 AND store_id = $2`,
      [addonId, storeId]
    );

    if (!addon) {
      return NextResponse.json(
        { error: 'Product addon not found' },
        { status: 404 }
      );
    }

    // Load options
    const options = await query(
      `SELECT id, addon_id, label, value, price, position
       FROM product_addon_options
       WHERE addon_id = $1
       ORDER BY position ASC`,
      [addonId]
    );

    return NextResponse.json({
      ...addon,
      values: options,
    });
  } catch (error: any) {
    console.error('Error fetching product addon:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product addon' },
      { status: 500 }
    );
  }
}

// PUT /api/product-addons/[id] - Update product addon
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
    const storeId = user.store_id;

    if (isNaN(addonId)) {
      return NextResponse.json({ error: 'Invalid addon ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      description,
      addon_type,
      is_required,
      scope,
      product_ids,
      category_ids,
      position,
      values,
    } = body;

    // Check if addon exists
    const existing = await queryOne<{ id: number; scope: string }>(
      'SELECT id, scope FROM product_addons WHERE id = $1 AND store_id = $2',
      [addonId, storeId]
    );

    if (!existing) {
      return NextResponse.json(
        { error: 'Product addon not found' },
        { status: 404 }
      );
    }

    // Validate scope if provided
    if (scope && scope !== 'GLOBAL' && scope !== 'PRODUCT' && scope !== 'CATEGORY') {
      return NextResponse.json(
        { error: 'scope must be GLOBAL, PRODUCT, or CATEGORY' },
        { status: 400 }
      );
    }

    // Validate product_ids if scope is PRODUCT
    const finalScope = scope || existing.scope;
    if (finalScope === 'PRODUCT' && product_ids !== undefined) {
      if (!Array.isArray(product_ids) || product_ids.length === 0) {
        return NextResponse.json(
          { error: 'product_ids is required when scope is PRODUCT' },
          { status: 400 }
        );
      }
    }

    // Validate category_ids if scope is CATEGORY
    if (finalScope === 'CATEGORY' && category_ids !== undefined) {
      if (!Array.isArray(category_ids) || category_ids.length === 0) {
        return NextResponse.json(
          { error: 'category_ids is required when scope is CATEGORY' },
          { status: 400 }
        );
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(name.trim());
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(description || null);
    }

    if (addon_type !== undefined) {
      updates.push(`addon_type = $${paramIndex++}`);
      params.push(addon_type);
    }

    if (is_required !== undefined) {
      updates.push(`is_required = $${paramIndex++}`);
      params.push(is_required);
    }

    if (scope !== undefined) {
      updates.push(`scope = $${paramIndex++}`);
      params.push(scope);
    }

    if (product_ids !== undefined) {
      updates.push(`product_ids = $${paramIndex++}`);
      params.push(product_ids);
    }

    if (category_ids !== undefined) {
      updates.push(`category_ids = $${paramIndex++}`);
      params.push(category_ids);
    }

    if (position !== undefined) {
      updates.push(`position = $${paramIndex++}`);
      params.push(position);
    }

    if (updates.length > 0) {
      updates.push(`updated_at = now()`);
      params.push(addonId, storeId);

      await query(
        `UPDATE product_addons
         SET ${updates.join(', ')}
         WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1}`,
        params
      );
    }

    // Update options if provided
    if (values !== undefined && Array.isArray(values)) {
      // Delete existing options
      await query('DELETE FROM product_addon_options WHERE addon_id = $1', [addonId]);

      // Insert new options
      for (let i = 0; i < values.length; i++) {
        const value = values[i];
        await query(
          `INSERT INTO product_addon_options (addon_id, label, value, price, position)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            addonId,
            value.label,
            value.value || value.label,
            value.price || 0,
            value.position !== undefined ? value.position : i,
          ]
        );
      }
    }

    // Load updated addon with options
    const addon = await queryOne<{
      id: number;
      store_id: number;
      name: string;
      description: string | null;
      addon_type: string;
      is_required: boolean;
      scope: string;
      product_ids: number[];
      category_ids: number[];
      position: number;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT id, store_id, name, description, addon_type, is_required,
              scope, product_ids, category_ids, position, created_at, updated_at
       FROM product_addons
       WHERE id = $1 AND store_id = $2`,
      [addonId, storeId]
    );

    const options = await query(
      `SELECT id, addon_id, label, value, price, position
       FROM product_addon_options
       WHERE addon_id = $1
       ORDER BY position ASC`,
      [addonId]
    );

    return NextResponse.json({
      ...addon,
      values: options,
    });
  } catch (error: any) {
    console.error('Error updating product addon:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update product addon' },
      { status: 500 }
    );
  }
}

// DELETE /api/product-addons/[id] - Delete product addon
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
    const storeId = user.store_id;

    if (isNaN(addonId)) {
      return NextResponse.json({ error: 'Invalid addon ID' }, { status: 400 });
    }

    // Check if addon exists
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM product_addons WHERE id = $1 AND store_id = $2',
      [addonId, storeId]
    );

    if (!existing) {
      return NextResponse.json(
        { error: 'Product addon not found' },
        { status: 404 }
      );
    }

    // Count how many products use this addon
    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM product_addon_map
       WHERE addon_id = $1`,
      [addonId]
    );

    const productsCount = parseInt(countResult?.count || '0');

    // Delete addon (options and mappings will be cascade deleted)
    await query(
      'DELETE FROM product_addons WHERE id = $1 AND store_id = $2',
      [addonId, storeId]
    );

    return NextResponse.json({
      message: 'Product addon deleted successfully',
      deletedProducts: productsCount,
    });
  } catch (error: any) {
    console.error('Error deleting product addon:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete product addon' },
      { status: 500 }
    );
  }
}

