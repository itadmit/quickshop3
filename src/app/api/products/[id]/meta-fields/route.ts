import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/products/:id/meta-fields - Get all meta fields for a product
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
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
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

    // Get meta fields
    const metaFields = await query(
      'SELECT * FROM product_meta_fields WHERE product_id = $1 ORDER BY namespace, key',
      [productId]
    );

    return NextResponse.json({ meta_fields: metaFields });
  } catch (error: any) {
    console.error('Error fetching meta fields:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch meta fields' },
      { status: 500 }
    );
  }
}

// POST /api/products/:id/meta-fields - Create or update meta field
export async function POST(
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
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const body = await request.json();
    const { namespace, key, value, value_type = 'string' } = body;

    if (!namespace || !key) {
      return NextResponse.json({ error: 'namespace and key are required' }, { status: 400 });
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

    // Check if meta field already exists
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM product_meta_fields WHERE product_id = $1 AND namespace = $2 AND key = $3',
      [productId, namespace, key]
    );

    let metaField;
    if (existing) {
      // Update existing
      metaField = await queryOne<{ id: number; namespace: string; key: string; value: string; value_type: string }>(
        `UPDATE product_meta_fields 
         SET value = $1, value_type = $2, updated_at = now()
         WHERE id = $3
         RETURNING id, namespace, key, value, value_type`,
        [value || null, value_type, existing.id]
      );
    } else {
      // Create new
      metaField = await queryOne<{ id: number; namespace: string; key: string; value: string; value_type: string }>(
        `INSERT INTO product_meta_fields (product_id, namespace, key, value, value_type, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, now(), now())
         RETURNING id, namespace, key, value, value_type`,
        [productId, namespace, key, value || null, value_type]
      );
    }

    if (!metaField) {
      throw new Error('Failed to save meta field');
    }

    // Emit event
    await eventBus.emitEvent('product.meta_field.updated', {
      product_id: productId,
      meta_field: {
        id: metaField.id,
        namespace: metaField.namespace,
        key: metaField.key,
        value: metaField.value,
        value_type: metaField.value_type,
      },
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ meta_field: metaField }, { status: existing ? 200 : 201 });
  } catch (error: any) {
    console.error('Error saving meta field:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save meta field' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/:id/meta-fields - Delete meta field
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
    
    // Get meta field ID from query string or body
    const url = new URL(request.url);
    const metaFieldIdParam = url.searchParams.get('meta_field_id') || (await request.json()).meta_field_id;
    const metaFieldId = metaFieldIdParam ? parseInt(metaFieldIdParam) : NaN;

    if (isNaN(productId) || isNaN(metaFieldId)) {
      return NextResponse.json({ error: 'Invalid product or meta field ID' }, { status: 400 });
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

    // Get meta field before deletion for event
    const metaField = await queryOne<{ id: number; namespace: string; key: string }>(
      'SELECT id, namespace, key FROM product_meta_fields WHERE id = $1 AND product_id = $2',
      [metaFieldId, productId]
    );

    if (!metaField) {
      return NextResponse.json({ error: 'Meta field not found' }, { status: 404 });
    }

    // Delete meta field
    await query(
      'DELETE FROM product_meta_fields WHERE id = $1',
      [metaFieldId]
    );

    // Emit event
    await eventBus.emitEvent('product.meta_field.deleted', {
      product_id: productId,
      meta_field_id: metaFieldId,
      namespace: metaField.namespace,
      key: metaField.key,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ 
      success: true,
      message: 'Meta field deleted successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting meta field:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete meta field' },
      { status: 500 }
    );
  }
}

