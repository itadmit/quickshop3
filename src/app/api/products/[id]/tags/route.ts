import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// POST /api/products/:id/tags - Add tag to product
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
    const { tag_id, tag_name } = body;

    const storeId = user.store_id;

    // Verify product belongs to store
    const product = await queryOne<{ id: number; store_id: number }>(
      'SELECT id, store_id FROM products WHERE id = $1',
      [productId]
    );

    if (!product || product.store_id !== storeId) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    let finalTagId = tag_id;

    // If tag_name provided but no tag_id, create or find tag
    if (tag_name && !tag_id) {
      const tagName = tag_name.trim();
      
      // Check if tag exists
      let tag = await queryOne<{ id: number }>(
        'SELECT id FROM product_tags WHERE store_id = $1 AND name = $2',
        [storeId, tagName]
      );

      if (!tag) {
        // Create new tag
        const newTag = await queryOne<{ id: number }>(
          `INSERT INTO product_tags (store_id, name, created_at)
           VALUES ($1, $2, now())
           RETURNING id`,
          [storeId, tagName]
        );
        tag = newTag;
      }

      finalTagId = tag?.id;
    }

    if (!finalTagId) {
      return NextResponse.json({ error: 'tag_id or tag_name is required' }, { status: 400 });
    }

    // Verify tag belongs to store
    const tag = await queryOne<{ id: number; store_id: number }>(
      'SELECT id, store_id FROM product_tags WHERE id = $1',
      [finalTagId]
    );

    if (!tag || tag.store_id !== storeId) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // Check if mapping already exists
    const existing = await queryOne<{ product_id: number }>(
      'SELECT product_id FROM product_tag_map WHERE product_id = $1 AND tag_id = $2',
      [productId, finalTagId]
    );

    if (existing) {
      return NextResponse.json({ 
        success: true, 
        message: 'Tag already added to product' 
      });
    }

    // Add tag to product
    await query(
      'INSERT INTO product_tag_map (product_id, tag_id) VALUES ($1, $2)',
      [productId, finalTagId]
    );

    // Emit event
    await eventBus.emitEvent('product.tag.added', {
      product_id: productId,
      tag_id: finalTagId,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ 
      success: true,
      message: 'Tag added to product successfully' 
    });
  } catch (error: any) {
    console.error('Error adding tag to product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add tag to product' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/:id/tags - Remove tag from product
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
    
    // Get tag ID from query string or body
    const url = new URL(request.url);
    const tagIdParam = url.searchParams.get('tag_id') || (await request.json()).tag_id;
    const tagId = tagIdParam ? parseInt(tagIdParam) : NaN;

    if (isNaN(productId) || isNaN(tagId)) {
      return NextResponse.json({ error: 'Invalid product or tag ID' }, { status: 400 });
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

    // Remove tag from product
    await query(
      'DELETE FROM product_tag_map WHERE product_id = $1 AND tag_id = $2',
      [productId, tagId]
    );

    // Emit event
    await eventBus.emitEvent('product.tag.removed', {
      product_id: productId,
      tag_id: tagId,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ 
      success: true,
      message: 'Tag removed from product successfully' 
    });
  } catch (error: any) {
    console.error('Error removing tag from product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove tag from product' },
      { status: 500 }
    );
  }
}

