import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/meta-field-definitions - Get all meta field definitions for a store
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const namespace = searchParams.get('namespace');
    const scope = searchParams.get('scope');
    const storeId = user.store_id;

    let sql = `
      SELECT id, store_id, namespace, key, label, description, value_type,
             required, validations, scope, category_ids, show_in_storefront,
             position, created_at, updated_at
      FROM meta_field_definitions
      WHERE store_id = $1
    `;
    const params: any[] = [storeId];
    let paramIndex = 2;

    if (namespace) {
      sql += ` AND namespace = $${paramIndex}`;
      params.push(namespace);
      paramIndex++;
    }

    if (scope) {
      sql += ` AND scope = $${paramIndex}`;
      params.push(scope);
      paramIndex++;
    }

    sql += ` ORDER BY position ASC, created_at ASC`;

    const definitions = await query(sql, params);

    return NextResponse.json(definitions);
  } catch (error: any) {
    console.error('Error fetching meta field definitions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch meta field definitions' },
      { status: 500 }
    );
  }
}

// POST /api/meta-field-definitions - Create new meta field definition
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      namespace = 'custom',
      key,
      label,
      description,
      value_type = 'string',
      required = false,
      validations = {},
      scope = 'GLOBAL',
      category_ids = [],
      show_in_storefront = false,
      position = 0,
    } = body;

    const storeId = user.store_id;

    // Validation
    if (!key || !key.trim()) {
      return NextResponse.json(
        { error: 'key is required' },
        { status: 400 }
      );
    }

    if (!label || !label.trim()) {
      return NextResponse.json(
        { error: 'label is required' },
        { status: 400 }
      );
    }

    // Validate key format (lowercase alphanumeric with underscores)
    if (!/^[a-z0-9_]+$/.test(key)) {
      return NextResponse.json(
        { error: 'key must be lowercase alphanumeric with underscores only' },
        { status: 400 }
      );
    }

    // Validate namespace format
    if (!/^[a-z0-9_]+$/.test(namespace)) {
      return NextResponse.json(
        { error: 'namespace must be lowercase alphanumeric with underscores only' },
        { status: 400 }
      );
    }

    // Validate scope
    if (scope !== 'GLOBAL' && scope !== 'CATEGORY') {
      return NextResponse.json(
        { error: 'scope must be GLOBAL or CATEGORY' },
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

    // Check if key already exists in this namespace
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM meta_field_definitions WHERE store_id = $1 AND namespace = $2 AND key = $3',
      [storeId, namespace, key]
    );

    if (existing) {
      return NextResponse.json(
        { error: `Key '${key}' already exists in namespace '${namespace}'` },
        { status: 400 }
      );
    }

    // Create definition
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
      `INSERT INTO meta_field_definitions 
       (store_id, namespace, key, label, description, value_type, required, 
        validations, scope, category_ids, show_in_storefront, position, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now(), now())
       RETURNING *`,
      [
        storeId,
        namespace,
        key,
        label,
        description || null,
        value_type,
        required,
        JSON.stringify(validations),
        scope,
        category_ids,
        show_in_storefront,
        position,
      ]
    );

    return NextResponse.json(definition, { status: 201 });
  } catch (error: any) {
    console.error('Error creating meta field definition:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create meta field definition' },
      { status: 500 }
    );
  }
}

