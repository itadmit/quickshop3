import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/products/:id/meta-fields - Get meta fields for a product
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

    // Get meta fields
    const metaFields = await query(
      `SELECT id, namespace, key, value, value_type, created_at, updated_at
       FROM product_meta_fields
       WHERE product_id = $1
       ORDER BY namespace, key`,
      [productId]
    );

    return NextResponse.json({ meta_fields: metaFields });
  } catch (error: any) {
    console.error('Error fetching product meta fields:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product meta fields' },
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
    const storeId = user.store_id;

    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const body = await request.json();
    const { namespace, key, value, value_type = 'string' } = body;

    if (!namespace || !key) {
      return NextResponse.json(
        { error: 'namespace and key are required' },
        { status: 400 }
      );
    }

    // Verify product belongs to store
    const product = await queryOne<{ id: number; store_id: number }>(
      'SELECT id, store_id FROM products WHERE id = $1',
      [productId]
    );

    if (!product || product.store_id !== storeId) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if meta field exists (UPSERT)
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM product_meta_fields WHERE product_id = $1 AND namespace = $2 AND key = $3',
      [productId, namespace, key]
    );

    let metaField;
    if (existing) {
      // Update existing
      metaField = await queryOne<{
        id: number;
        namespace: string;
        key: string;
        value: string | null;
        value_type: string;
        created_at: Date;
        updated_at: Date;
      }>(
        `UPDATE product_meta_fields
         SET value = $1, value_type = $2, updated_at = now()
         WHERE id = $3
         RETURNING *`,
        [value || null, value_type, existing.id]
      );
    } else {
      // Create new
      metaField = await queryOne<{
        id: number;
        namespace: string;
        key: string;
        value: string | null;
        value_type: string;
        created_at: Date;
        updated_at: Date;
      }>(
        `INSERT INTO product_meta_fields 
         (product_id, namespace, key, value, value_type, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, now(), now())
         RETURNING *`,
        [productId, namespace, key, value || null, value_type]
      );
    }

    // Emit event
    await eventBus.emitEvent('product.meta_field.updated', {
      product_id: productId,
      meta_field: metaField,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({
      meta_field: metaField,
      message: existing ? 'Meta field updated successfully' : 'Meta field created successfully',
    });
  } catch (error: any) {
    console.error('Error saving product meta field:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save product meta field' },
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
    const storeId = user.store_id;

    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    // Get namespace and key from query string or body
    const url = new URL(request.url);
    const namespace = url.searchParams.get('namespace');
    const key = url.searchParams.get('key');

    if (!namespace || !key) {
      return NextResponse.json(
        { error: 'namespace and key are required' },
        { status: 400 }
      );
    }

    // Verify product belongs to store
    const product = await queryOne<{ id: number; store_id: number }>(
      'SELECT id, store_id FROM products WHERE id = $1',
      [productId]
    );

    if (!product || product.store_id !== storeId) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Delete meta field
    await query(
      'DELETE FROM product_meta_fields WHERE product_id = $1 AND namespace = $2 AND key = $3',
      [productId, namespace, key]
    );

    // Emit event
    await eventBus.emitEvent('product.meta_field.deleted', {
      product_id: productId,
      namespace,
      key,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({
      message: 'Meta field deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting product meta field:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete product meta field' },
      { status: 500 }
    );
  }
}
