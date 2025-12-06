import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { eventBus } from '@/lib/events/eventBus';
import { quickshopList } from '@/lib/utils/apiFormatter';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/products/:id/collections - Get collections for a product
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

    // Get collections for this product
    const collections = await query(
      `SELECT pc.*, pcm.position
       FROM product_collections pc
       INNER JOIN product_collection_map pcm ON pc.id = pcm.collection_id
       WHERE pcm.product_id = $1
       ORDER BY pcm.position ASC, pc.title ASC`,
      [productId]
    );

    return NextResponse.json(quickshopList('collections', collections));
  } catch (error: any) {
    console.error('Error fetching product collections:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product collections' },
      { status: 500 }
    );
  }
}

// POST /api/products/:id/collections - Add product to collection
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
    const { collection_id } = body;

    if (!collection_id) {
      return NextResponse.json({ error: 'collection_id is required' }, { status: 400 });
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

    // Verify collection belongs to store
    const collection = await queryOne<{ id: number; store_id: number }>(
      'SELECT id, store_id FROM product_collections WHERE id = $1',
      [collection_id]
    );

    if (!collection || collection.store_id !== storeId) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Check if mapping already exists
    const existing = await queryOne<{ product_id: number }>(
      'SELECT product_id FROM product_collection_map WHERE product_id = $1 AND collection_id = $2',
      [productId, collection_id]
    );

    if (existing) {
      return NextResponse.json({ 
        success: true, 
        message: 'Product already in collection' 
      });
    }

    // Get max position for this collection
    const maxPosition = await queryOne<{ max_position: number }>(
      'SELECT COALESCE(MAX(position), 0) as max_position FROM product_collection_map WHERE collection_id = $1',
      [collection_id]
    );

    // Add product to collection
    await query(
      `INSERT INTO product_collection_map (product_id, collection_id, position)
       VALUES ($1, $2, $3)`,
      [productId, collection_id, (maxPosition?.max_position || 0) + 1]
    );

    // Emit event
    await eventBus.emitEvent('product.collection.added', {
      product_id: productId,
      collection_id: collection_id,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ 
      success: true,
      message: 'Product added to collection successfully' 
    });
  } catch (error: any) {
    console.error('Error adding product to collection:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add product to collection' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/:id/collections - Remove product from collection
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
    
    // Get collection ID from query string or body
    const url = new URL(request.url);
    let collectionId: number | null = null;
    
    const collectionIdParam = url.searchParams.get('collection_id');
    if (collectionIdParam) {
      collectionId = parseInt(collectionIdParam);
    } else {
      try {
        const body = await request.json();
        collectionId = body.collection_id ? parseInt(body.collection_id) : null;
      } catch {
        // Body might be empty
      }
    }

    if (isNaN(productId) || !collectionId || isNaN(collectionId)) {
      return NextResponse.json({ error: 'Invalid product or collection ID' }, { status: 400 });
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

    // Remove product from collection
    await query(
      'DELETE FROM product_collection_map WHERE product_id = $1 AND collection_id = $2',
      [productId, collectionId]
    );

    // Emit event
    await eventBus.emitEvent('product.collection.removed', {
      product_id: productId,
      collection_id: collectionId,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ 
      success: true,
      message: 'Product removed from collection successfully' 
    });
  } catch (error: any) {
    console.error('Error removing product from collection:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove product from collection' },
      { status: 500 }
    );
  }
}
