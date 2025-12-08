import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/product-addons - Get all product addons for a store (dashboard management)
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope');
    const storeId = user.store_id;

    let sql = `
      SELECT pa.id, pa.store_id, pa.name, pa.description, pa.addon_type, pa.is_required,
             pa.scope, pa.product_ids, pa.category_ids, pa.position, pa.created_at, pa.updated_at
      FROM product_addons pa
      WHERE pa.store_id = $1
    `;
    const params: any[] = [storeId];
    let paramIndex = 2;

    if (scope) {
      sql += ` AND pa.scope = $${paramIndex}`;
      params.push(scope);
      paramIndex++;
    }

    sql += ` ORDER BY pa.position ASC, pa.created_at ASC`;

    const addons = await query(sql, params);

    // Load options for each addon
    const addonsWithOptions = await Promise.all(
      addons.map(async (addon: any) => {
        const options = await query(
          `SELECT id, addon_id, label, value, price, position
           FROM product_addon_options
           WHERE addon_id = $1
           ORDER BY position ASC`,
          [addon.id]
        );
        return {
          ...addon,
          values: options,
        };
      })
    );

    return NextResponse.json(addonsWithOptions);
  } catch (error: any) {
    console.error('Error fetching product addons:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product addons' },
      { status: 500 }
    );
  }
}

// POST /api/product-addons - Create new product addon
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      addon_type,
      is_required = false,
      scope = 'GLOBAL',
      product_ids = [],
      category_ids = [],
      position = 0,
      values = [],
    } = body;

    const storeId = user.store_id;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    if (!addon_type) {
      return NextResponse.json(
        { error: 'addon_type is required' },
        { status: 400 }
      );
    }

    // Validate scope
    if (scope !== 'GLOBAL' && scope !== 'PRODUCT' && scope !== 'CATEGORY') {
      return NextResponse.json(
        { error: 'scope must be GLOBAL, PRODUCT, or CATEGORY' },
        { status: 400 }
      );
    }

    // Validate product_ids if scope is PRODUCT
    if (scope === 'PRODUCT' && (!Array.isArray(product_ids) || product_ids.length === 0)) {
      return NextResponse.json(
        { error: 'product_ids is required when scope is PRODUCT' },
        { status: 400 }
      );
    }

    // Validate category_ids if scope is CATEGORY
    if (scope === 'CATEGORY' && (!Array.isArray(category_ids) || category_ids.length === 0)) {
      return NextResponse.json(
        { error: 'category_ids is required when scope is CATEGORY' },
        { status: 400 }
      );
    }

    // Validate values for SINGLE_CHOICE and MULTIPLE_CHOICE
    if (
      (addon_type === 'SINGLE_CHOICE' || addon_type === 'MULTIPLE_CHOICE') &&
      (!Array.isArray(values) || values.length === 0)
    ) {
      return NextResponse.json(
        { error: 'values are required for SINGLE_CHOICE and MULTIPLE_CHOICE' },
        { status: 400 }
      );
    }

    // Create addon
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
      `INSERT INTO product_addons 
       (store_id, name, description, addon_type, is_required, scope, product_ids, category_ids, position, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())
       RETURNING *`,
      [
        storeId,
        name.trim(),
        description || null,
        addon_type,
        is_required,
        scope,
        product_ids,
        category_ids,
        position,
      ]
    );

    // Create options if provided
    if (Array.isArray(values) && values.length > 0) {
      for (let i = 0; i < values.length; i++) {
        const value = values[i];
        await query(
          `INSERT INTO product_addon_options (addon_id, label, value, price, position)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            addon.id,
            value.label,
            value.value || value.label,
            value.price || 0,
            value.position !== undefined ? value.position : i,
          ]
        );
      }
    }

    // Load options
    const options = await query(
      `SELECT id, addon_id, label, value, price, position
       FROM product_addon_options
       WHERE addon_id = $1
       ORDER BY position ASC`,
      [addon.id]
    );

    return NextResponse.json(
      {
        ...addon,
        values: options,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating product addon:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create product addon' },
      { status: 500 }
    );
  }
}

