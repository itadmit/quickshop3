import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/meta-field-definitions/[id] - Get single meta field definition
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
    const definitionId = parseInt(id);
    const storeId = user.store_id;

    if (isNaN(definitionId)) {
      return NextResponse.json({ error: 'Invalid definition ID' }, { status: 400 });
    }

    const definition = await queryOne<{
      id: number;
      store_id: number;
      namespace: string;
      key: string;
      label: string;
      description: string | null;
      value_type: string;
      required: boolean;
      validations: any;
      scope: string;
      category_ids: number[];
      show_in_storefront: boolean;
      position: number;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT id, store_id, namespace, key, label, description, value_type,
              required, validations, scope, category_ids, show_in_storefront,
              position, created_at, updated_at
       FROM meta_field_definitions
       WHERE id = $1 AND store_id = $2`,
      [definitionId, storeId]
    );

    if (!definition) {
      return NextResponse.json(
        { error: 'Meta field definition not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(definition);
  } catch (error: any) {
    console.error('Error fetching meta field definition:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch meta field definition' },
      { status: 500 }
    );
  }
}

// PUT /api/meta-field-definitions/[id] - Update meta field definition
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const definitionId = parseInt(id);
    const storeId = user.store_id;

    if (isNaN(definitionId)) {
      return NextResponse.json({ error: 'Invalid definition ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      label,
      description,
      required,
      validations,
      scope,
      category_ids,
      show_in_storefront,
      position,
    } = body;

    // Check if definition exists
    const existing = await queryOne<{ id: number; scope: string }>(
      'SELECT id, scope FROM meta_field_definitions WHERE id = $1 AND store_id = $2',
      [definitionId, storeId]
    );

    if (!existing) {
      return NextResponse.json(
        { error: 'Meta field definition not found' },
        { status: 404 }
      );
    }

    // Validate scope if provided
    if (scope && scope !== 'GLOBAL' && scope !== 'CATEGORY') {
      return NextResponse.json(
        { error: 'scope must be GLOBAL or CATEGORY' },
        { status: 400 }
      );
    }

    // Validate category_ids if scope is CATEGORY
    const finalScope = scope || existing.scope;
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

    if (label !== undefined) {
      updates.push(`label = $${paramIndex++}`);
      params.push(label);
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(description || null);
    }

    if (required !== undefined) {
      updates.push(`required = $${paramIndex++}`);
      params.push(required);
    }

    if (validations !== undefined) {
      updates.push(`validations = $${paramIndex++}`);
      params.push(JSON.stringify(validations));
    }

    if (scope !== undefined) {
      updates.push(`scope = $${paramIndex++}`);
      params.push(scope);
    }

    if (category_ids !== undefined) {
      updates.push(`category_ids = $${paramIndex++}`);
      params.push(category_ids);
    }

    if (show_in_storefront !== undefined) {
      updates.push(`show_in_storefront = $${paramIndex++}`);
      params.push(show_in_storefront);
    }

    if (position !== undefined) {
      updates.push(`position = $${paramIndex++}`);
      params.push(position);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    updates.push(`updated_at = now()`);
    params.push(definitionId, storeId);

    const definition = await queryOne<{
      id: number;
      store_id: number;
      namespace: string;
      key: string;
      label: string;
      description: string | null;
      value_type: string;
      required: boolean;
      validations: any;
      scope: string;
      category_ids: number[];
      show_in_storefront: boolean;
      position: number;
      created_at: Date;
      updated_at: Date;
    }>(
      `UPDATE meta_field_definitions
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1}
       RETURNING *`,
      params
    );

    return NextResponse.json(definition);
  } catch (error: any) {
    console.error('Error updating meta field definition:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update meta field definition' },
      { status: 500 }
    );
  }
}

// DELETE /api/meta-field-definitions/[id] - Delete meta field definition
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
    const definitionId = parseInt(id);
    const storeId = user.store_id;

    if (isNaN(definitionId)) {
      return NextResponse.json({ error: 'Invalid definition ID' }, { status: 400 });
    }

    // Check if definition exists
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM meta_field_definitions WHERE id = $1 AND store_id = $2',
      [definitionId, storeId]
    );

    if (!existing) {
      return NextResponse.json(
        { error: 'Meta field definition not found' },
        { status: 404 }
      );
    }

    // Count how many products use this definition
    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM product_meta_fields pmf
       INNER JOIN meta_field_definitions mfd ON 
         pmf.namespace = mfd.namespace AND pmf.key = mfd.key
       WHERE mfd.id = $1`,
      [definitionId]
    );

    const valuesCount = parseInt(countResult?.count || '0');

    // Delete definition (product_meta_fields will remain, but definition is removed)
    await query(
      'DELETE FROM meta_field_definitions WHERE id = $1 AND store_id = $2',
      [definitionId, storeId]
    );

    return NextResponse.json({
      message: 'Meta field definition deleted successfully',
      deletedValues: valuesCount,
    });
  } catch (error: any) {
    console.error('Error deleting meta field definition:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete meta field definition' },
      { status: 500 }
    );
  }
}

