import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { eventBus } from '@/lib/events/eventBus';
import { generateUniqueSlug } from '@/lib/utils/slug';
import { generateSlugFromHebrew } from '@/lib/utils/hebrewSlug';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/collections/:id - Get single collection
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
    const collectionId = parseInt(id);
    const storeId = user.store_id;

    if (isNaN(collectionId)) {
      return NextResponse.json({ error: 'Invalid collection ID' }, { status: 400 });
    }

    const collection = await queryOne<{
      id: number;
      title: string;
      handle: string;
      description: string | null;
      image_url: string | null;
      published_at: Date | null;
      published_scope: string;
      sort_order: string;
      parent_id: number | null;
      type: string;
      rules: any;
      is_published: boolean;
      created_at: Date;
      updated_at: Date;
    }>(
      'SELECT * FROM product_collections WHERE id = $1 AND store_id = $2',
      [collectionId, storeId]
    );

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    // Get products in this collection with full details (images, price, SKU)
    const productsRaw = await query<{
      id: number;
      title: string;
      handle: string;
      status: string;
      position: number;
    }>(
      `SELECT p.id, p.title, p.handle, p.status, pcm.position
       FROM products p
       INNER JOIN product_collection_map pcm ON p.id = pcm.product_id
       WHERE pcm.collection_id = $1
       ORDER BY pcm.position ASC, p.title ASC`,
      [collectionId]
    );

    // Get full product details (images, variants with price and SKU) for each product
    const products = await Promise.all(
      productsRaw.map(async (product) => {
        // Get images
        const images = await query<{ src: string; alt: string | null }>(
          'SELECT src, alt FROM product_images WHERE product_id = $1 ORDER BY position LIMIT 1',
          [product.id]
        );

        // Get first variant (for price and SKU)
        const variant = await queryOne<{ price: string; compare_at_price: string | null; sku: string | null }>(
          'SELECT price, compare_at_price, sku FROM product_variants WHERE product_id = $1 ORDER BY position LIMIT 1',
          [product.id]
        );

        return {
          id: product.id,
          title: product.title,
          handle: product.handle,
          status: product.status,
          position: product.position,
          images: images.map(img => ({ url: img.src, image_url: img.src, src: img.src, alt: img.alt })),
          price: variant?.price ? parseFloat(variant.price) : 0,
          compare_at_price: variant?.compare_at_price ? parseFloat(variant.compare_at_price) : null,
          sku: variant?.sku || null,
          variants: variant ? [{
            id: 0,
            price: variant.price,
            compare_at_price: variant.compare_at_price,
            sku: variant.sku,
          }] : [],
        };
      })
    );

    return NextResponse.json({
      collection: {
        ...collection,
        products,
        products_count: products.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching collection:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch collection' },
      { status: 500 }
    );
  }
}

// PUT /api/collections/:id - Update collection
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
    const collectionId = parseInt(id);
    const storeId = user.store_id;

    if (isNaN(collectionId)) {
      return NextResponse.json({ error: 'Invalid collection ID' }, { status: 400 });
    }

    const body = await request.json();
    const { title, handle, description, image_url, published_at, published_scope, sort_order, parent_id, type, rules, is_published, productIds } = body;

    // Verify collection exists and belongs to store
    const existing = await queryOne<{ id: number; store_id: number; type: string; title: string }>(
      'SELECT id, store_id, type, title FROM product_collections WHERE id = $1',
      [collectionId]
    );

    if (!existing || existing.store_id !== storeId) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    // Get existing handle for comparison
    const existingCollection = await queryOne<{ handle: string }>(
      'SELECT handle FROM product_collections WHERE id = $1',
      [collectionId]
    );

    // Generate handle from title if not provided and title is being updated
    let finalHandle = handle;
    if (!finalHandle && title !== undefined) {
      let baseHandle = generateSlugFromHebrew(title);
      
      // Limit length
      if (baseHandle.length > 200) {
        baseHandle = baseHandle.substring(0, 200);
      }

      // Check uniqueness
      let counter = 1;
      finalHandle = baseHandle;
      
      while (true) {
        const handleExists = await queryOne<{ id: number }>(
          'SELECT id FROM product_collections WHERE store_id = $1 AND handle = $2 AND id != $3',
          [storeId, finalHandle, collectionId]
        );

        if (!handleExists) {
          break; // Handle is unique
        }

        // Add counter suffix if handle exists
        finalHandle = `${baseHandle}-${counter}`;
        counter++;
      }
    } else if (!finalHandle) {
      // If handle not provided and title not updated, use existing handle
      finalHandle = existingCollection?.handle || '';
    } else if (finalHandle && existingCollection && finalHandle !== existingCollection.handle) {
      // If handle is provided and changed, check uniqueness
      const handleExists = await queryOne<{ id: number }>(
        'SELECT id FROM product_collections WHERE store_id = $1 AND handle = $2 AND id != $3',
        [storeId, finalHandle, collectionId]
      );

      if (handleExists) {
        return NextResponse.json(
          { error: 'Collection with this handle already exists' },
          { status: 400 }
        );
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title.trim());
    }
    if (finalHandle !== undefined && finalHandle !== existingCollection?.handle) {
      updates.push(`handle = $${paramIndex++}`);
      values.push(finalHandle);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description || null);
    }
    if (image_url !== undefined) {
      updates.push(`image_url = $${paramIndex++}`);
      values.push(image_url || null);
    }
    if (published_at !== undefined) {
      updates.push(`published_at = $${paramIndex++}`);
      values.push(published_at ? new Date(published_at) : null);
    }
    if (published_scope !== undefined) {
      updates.push(`published_scope = $${paramIndex++}`);
      values.push(published_scope);
    }
    if (sort_order !== undefined) {
      updates.push(`sort_order = $${paramIndex++}`);
      values.push(sort_order);
    }
    if (parent_id !== undefined) {
      // בדיקה ש-parent_id שייך לאותו store
      if (parent_id !== null) {
        const parentExists = await queryOne<{ id: number }>(
          'SELECT id FROM product_collections WHERE id = $1 AND store_id = $2',
          [parent_id, storeId]
        );
        if (!parentExists) {
          return NextResponse.json({ error: 'Parent collection not found' }, { status: 400 });
        }
        // בדיקה שלא יוצרים מעגל (קטגוריה לא יכולה להיות הורה של עצמה או של אביה)
        if (parent_id === collectionId) {
          return NextResponse.json({ error: 'Collection cannot be its own parent' }, { status: 400 });
        }
      }
      updates.push(`parent_id = $${paramIndex++}`);
      values.push(parent_id);
    }
    if (type !== undefined) {
      if (!['MANUAL', 'AUTOMATIC'].includes(type)) {
        return NextResponse.json({ error: 'Invalid type. Must be MANUAL or AUTOMATIC' }, { status: 400 });
      }
      updates.push(`type = $${paramIndex++}`);
      values.push(type);
    }
    if (rules !== undefined) {
      updates.push(`rules = $${paramIndex++}`);
      values.push(rules ? JSON.stringify(rules) : null);
    }
    if (is_published !== undefined) {
      updates.push(`is_published = $${paramIndex++}`);
      values.push(is_published);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push(`updated_at = now()`);
    values.push(collectionId, storeId);

    const collection = await queryOne<{
      id: number;
      title: string;
      handle: string;
      description: string | null;
      image_url: string | null;
      published_at: Date | null;
      published_scope: string;
      sort_order: string;
      parent_id: number | null;
      type: string;
      rules: any;
      is_published: boolean;
      created_at: Date;
      updated_at: Date;
    }>(
      `UPDATE product_collections 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    // עדכון מוצרים - רק אם זה קטגוריה ידנית וסופקו productIds
    const finalType = type ?? existing.type;
    if (finalType === 'MANUAL' && productIds !== undefined) {
      // מחיקת כל הקשרים הקיימים
      await query(
        'DELETE FROM product_collection_map WHERE collection_id = $1',
        [collectionId]
      );

      // יצירת קשרים חדשים
      if (productIds.length > 0) {
        for (let i = 0; i < productIds.length; i++) {
          await query(
            'INSERT INTO product_collection_map (product_id, collection_id, position) VALUES ($1, $2, $3)',
            [parseInt(productIds[i]), collectionId, i]
          );
        }
      }
    }

    // Emit event
    await eventBus.emitEvent('collection.updated', {
      collection: collection,
      changes: body,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({
      collection,
      message: 'Collection updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating collection:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update collection' },
      { status: 500 }
    );
  }
}

// DELETE /api/collections/:id - Delete collection
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
    const collectionId = parseInt(id);
    const storeId = user.store_id;

    if (isNaN(collectionId)) {
      return NextResponse.json({ error: 'Invalid collection ID' }, { status: 400 });
    }

    // Verify collection exists and belongs to store
    const collection = await queryOne<{ id: number; store_id: number; title: string }>(
      'SELECT id, store_id, title FROM product_collections WHERE id = $1',
      [collectionId]
    );

    if (!collection || collection.store_id !== storeId) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    // Delete collection (CASCADE will handle product_collection_map)
    await query(
      'DELETE FROM product_collections WHERE id = $1',
      [collectionId]
    );

    // Emit event
    await eventBus.emitEvent('collection.deleted', {
      collection_id: collectionId,
      collection_title: collection.title,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({
      message: 'Collection deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting collection:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete collection' },
      { status: 500 }
    );
  }
}

