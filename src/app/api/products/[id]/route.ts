import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Product, ProductWithDetails, ProductImage, ProductVariant, ProductOption } from '@/types/product';
import { eventBus } from '@/lib/events/eventBus';
import { generateUniqueSlug } from '@/lib/utils/slug';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/products/[id] - Get single product
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

    const product = await queryOne<Product>(
      'SELECT * FROM products WHERE id = $1 AND store_id = $2',
      [productId, user.store_id]
    );

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get related data
    const [images, variantsRaw, options] = await Promise.all([
      query<ProductImage>(
        'SELECT * FROM product_images WHERE product_id = $1 ORDER BY position',
        [productId]
      ),
      query<ProductVariant>(
        'SELECT * FROM product_variants WHERE product_id = $1 ORDER BY position',
        [productId]
      ),
      query<ProductOption>(
        `SELECT po.*, 
         (SELECT json_agg(json_build_object('id', pov.id, 'value', pov.value, 'position', pov.position))
          FROM product_option_values pov WHERE pov.option_id = po.id) as values
         FROM product_options po WHERE po.product_id = $1 ORDER BY po.position`,
        [productId]
      ),
    ]);

    // Get inventory for each variant
    const variants = await Promise.all(
      variantsRaw.map(async (variant) => {
        const inventory = await queryOne<{ available: number; committed: number }>(
          'SELECT available, committed FROM variant_inventory WHERE variant_id = $1 LIMIT 1',
          [variant.id]
        );
        return {
          ...variant,
          inventory_quantity: inventory?.available || 0,
        };
      })
    );

    // Get collections
    const collections = await query(
      `SELECT pc.* FROM product_collections pc
       INNER JOIN product_collection_map pcm ON pc.id = pcm.collection_id
       WHERE pcm.product_id = $1`,
      [productId]
    );

    // Get tags
    const tags = await query(
      `SELECT pt.* FROM product_tags pt
       INNER JOIN product_tag_map ptm ON pt.id = ptm.tag_id
       WHERE ptm.product_id = $1`,
      [productId]
    );

    const productWithDetails: ProductWithDetails = {
      ...product,
      images,
      variants,
      options,
      collections,
      tags,
    };

    return NextResponse.json({ product: productWithDetails });
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update product
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
    const productId = parseInt(id);
    const body = await request.json();

    // Get old product for comparison - verify it belongs to user's store
    const oldProduct = await queryOne<Product>(
      'SELECT * FROM products WHERE id = $1 AND store_id = $2',
      [productId, user.store_id]
    );

    if (!oldProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Generate unique slug if not provided or if title changed
    let handle = body.handle;
    if (!handle || (body.title && body.title !== oldProduct.title)) {
      handle = await generateUniqueSlug(body.title || oldProduct.title, 'products', oldProduct.store_id, productId);
    }

    const sql = `
      UPDATE products SET
        title = $1,
        handle = $2,
        body_html = $3,
        vendor = $4,
        product_type = $5,
        status = $6,
        published_at = $7,
        sell_when_sold_out = $8,
        sold_by_weight = $9,
        show_price_per_100ml = $10,
        price_per_100ml = $11,
        updated_at = now()
      WHERE id = $12 AND store_id = $13
      RETURNING *
    `;

    const product = await queryOne<Product>(sql, [
      body.title || oldProduct.title,
      handle,
      body.body_html !== undefined ? body.body_html : oldProduct.body_html,
      body.vendor !== undefined ? body.vendor : oldProduct.vendor,
      body.product_type !== undefined ? body.product_type : oldProduct.product_type,
      body.status || oldProduct.status,
      body.published_at !== undefined ? body.published_at : oldProduct.published_at,
      body.sell_when_sold_out !== undefined ? body.sell_when_sold_out : (oldProduct as any).sell_when_sold_out || false,
      body.sold_by_weight !== undefined ? body.sold_by_weight : (oldProduct as any).sold_by_weight || false,
      body.show_price_per_100ml !== undefined ? body.show_price_per_100ml : (oldProduct as any).show_price_per_100ml || false,
      body.price_per_100ml !== undefined ? body.price_per_100ml : (oldProduct as any).price_per_100ml || null,
      productId,
      user.store_id,
    ]);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Calculate changes
    const changes: Record<string, { old: any; new: any }> = {};
    if (oldProduct.title !== product.title) changes.title = { old: oldProduct.title, new: product.title };
    if (oldProduct.status !== product.status) changes.status = { old: oldProduct.status, new: product.status };
    if (oldProduct.body_html !== product.body_html) changes.body_html = { old: oldProduct.body_html, new: product.body_html };

    // Emit product.updated event
    await eventBus.emitEvent('product.updated', {
      product,
      changes,
    }, {
      store_id: product.store_id,
      source: 'api',
    });

    // Emit product.published event if status changed to 'active'
    if (oldProduct.status !== 'active' && product.status === 'active') {
      await eventBus.emitEvent('product.published', { product }, {
        store_id: product.store_id,
        source: 'api',
      });
    }

    // Handle images if provided
    if (body.images && Array.isArray(body.images)) {
      // Delete existing images
      await query('DELETE FROM product_images WHERE product_id = $1', [productId]);
      
      // Insert new images
      for (let i = 0; i < body.images.length; i++) {
        const image = body.images[i];
        await query(
          `INSERT INTO product_images (product_id, position, src, alt, created_at, updated_at)
           VALUES ($1, $2, $3, $4, now(), now())`,
          [productId, i + 1, image.src || image, image.alt || null]
        );
      }
    }

    // Handle default variant if no variants exist (for SKU, price, etc.)
    const hasVariants = body.variants && Array.isArray(body.variants) && body.variants.length > 0;
    if (!hasVariants) {
      // Check if default variant exists
      const existingVariant = await queryOne<{ id: number }>(
        'SELECT id FROM product_variants WHERE product_id = $1 ORDER BY position LIMIT 1',
        [productId]
      );

      if (existingVariant) {
        // Get old variant for comparison
        const oldVariant = await queryOne<ProductVariant>(
          'SELECT * FROM product_variants WHERE id = $1',
          [existingVariant.id]
        );

        // Update existing default variant
        const updatedVariant = await queryOne<ProductVariant>(
          `UPDATE product_variants SET
            price = $1,
            compare_at_price = $2,
            sku = $3,
            taxable = $4,
            updated_at = now()
           WHERE id = $5
           RETURNING *`,
          [
            body.price || '0.00',
            body.compare_at_price || null,
            body.sku || null,
            body.taxable !== false,
            existingVariant.id,
          ]
        );

        // Emit variant.updated event
        if (updatedVariant && oldVariant) {
          const changes: any = {};
          if (oldVariant.price !== updatedVariant.price) changes.price = { from: oldVariant.price, to: updatedVariant.price };
          if (oldVariant.compare_at_price !== updatedVariant.compare_at_price) changes.compare_at_price = { from: oldVariant.compare_at_price, to: updatedVariant.compare_at_price };
          if (oldVariant.sku !== updatedVariant.sku) changes.sku = { from: oldVariant.sku, to: updatedVariant.sku };
          if (oldVariant.taxable !== updatedVariant.taxable) changes.taxable = { from: oldVariant.taxable, to: updatedVariant.taxable };
          
          await eventBus.emitEvent('variant.updated', {
            variant: updatedVariant,
            changes,
          }, {
            store_id: user.store_id,
            source: 'api',
            user_id: user.id,
          });
        }

        // Update inventory
        if (body.track_inventory !== false && body.inventory_quantity !== undefined) {
          const existingInventory = await queryOne<{ id: number }>(
            'SELECT id FROM variant_inventory WHERE variant_id = $1 LIMIT 1',
            [existingVariant.id]
          );
          
          if (existingInventory) {
            await query(
              `UPDATE variant_inventory SET available = $1, updated_at = now() WHERE variant_id = $2`,
              [body.inventory_quantity || 0, existingVariant.id]
            );
          } else {
            await query(
              `INSERT INTO variant_inventory (variant_id, available, committed, created_at, updated_at)
               VALUES ($1, $2, $3, now(), now())`,
              [existingVariant.id, body.inventory_quantity || 0, 0]
            );
          }
        }
      } else {
        // Create new default variant
        await query(
          `INSERT INTO product_variants (
            product_id, title, price, compare_at_price, sku, taxable,
            position, inventory_policy, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())`,
          [
            productId,
            'Default Title',
            body.price || '0.00',
            body.compare_at_price || null,
            body.sku || null,
            body.taxable !== false,
            1,
            'deny',
          ]
        );

        // Handle inventory if enabled
        if (body.track_inventory !== false && body.inventory_quantity !== undefined) {
          const variant = await queryOne<{ id: number }>(
            'SELECT id FROM product_variants WHERE product_id = $1 ORDER BY position LIMIT 1',
            [productId]
          );
          if (variant) {
            const existingInventory = await queryOne<{ id: number }>(
              'SELECT id FROM variant_inventory WHERE variant_id = $1 LIMIT 1',
              [variant.id]
            );
            
            if (existingInventory) {
              await query(
                `UPDATE variant_inventory SET available = $1, updated_at = now() WHERE variant_id = $2`,
                [body.inventory_quantity || 0, variant.id]
              );
            } else {
              await query(
                `INSERT INTO variant_inventory (variant_id, available, committed, created_at, updated_at)
                 VALUES ($1, $2, $3, now(), now())`,
                [variant.id, body.inventory_quantity || 0, 0]
              );
            }
          }
        }
      }
    }

    // Handle collections if provided
    if (body.collections && Array.isArray(body.collections)) {
      // Get current collections
      const currentCollections = await query<{ collection_id: number }>(
        'SELECT collection_id FROM product_collection_map WHERE product_id = $1',
        [productId]
      );
      const currentIds = currentCollections.map(c => c.collection_id);
      const newIds = body.collections.filter((id: any) => typeof id === 'number');

      // Remove collections that are no longer selected
      const toRemove = currentIds.filter(id => !newIds.includes(id));
      for (const collectionId of toRemove) {
        await query(
          'DELETE FROM product_collection_map WHERE product_id = $1 AND collection_id = $2',
          [productId, collectionId]
        );
      }

      // Add new collections
      const toAdd = newIds.filter((id: number) => !currentIds.includes(id));
      for (const collectionId of toAdd) {
        // Check if mapping already exists
        const existing = await queryOne<{ product_id: number }>(
          'SELECT product_id FROM product_collection_map WHERE product_id = $1 AND collection_id = $2',
          [productId, collectionId]
        );

        if (!existing) {
          // Get max position for this collection
          const maxPosition = await queryOne<{ max_position: number }>(
            'SELECT COALESCE(MAX(position), 0) as max_position FROM product_collection_map WHERE collection_id = $1',
            [collectionId]
          );

          await query(
            `INSERT INTO product_collection_map (product_id, collection_id, position)
             VALUES ($1, $2, $3)`,
            [productId, collectionId, (maxPosition?.max_position || 0) + 1]
          );
        }
      }
    }

    // Handle tags if provided
    if (body.tags && Array.isArray(body.tags)) {
      // Get current tags
      const currentTags = await query<{ tag_id: number; name: string }>(
        `SELECT ptm.tag_id, pt.name
         FROM product_tag_map ptm
         INNER JOIN product_tags pt ON ptm.tag_id = pt.id
         WHERE ptm.product_id = $1`,
        [productId]
      );
      const currentTagNames = currentTags.map(t => t.name.toLowerCase());
      const newTagNames = body.tags.map((t: string) => t.trim().toLowerCase()).filter(Boolean);

      // Remove tags that are no longer selected
      const toRemove = currentTags.filter(t => !newTagNames.includes(t.name.toLowerCase()));
      for (const tag of toRemove) {
        await query(
          'DELETE FROM product_tag_map WHERE product_id = $1 AND tag_id = $2',
          [productId, tag.tag_id]
        );
      }

      // Add new tags
      const toAdd = newTagNames.filter((name: string) => !currentTagNames.includes(name));
      for (const tagName of toAdd) {
        // Find or create tag
        let tag = await queryOne<{ id: number }>(
          'SELECT id FROM product_tags WHERE store_id = $1 AND LOWER(name) = $2',
          [product.store_id, tagName]
        );

        if (!tag) {
          // Create new tag
          const newTag = await queryOne<{ id: number }>(
            `INSERT INTO product_tags (store_id, name, created_at)
             VALUES ($1, $2, now())
             RETURNING id`,
            [product.store_id, tagName]
          );
          tag = newTag;
        }

        if (tag) {
          await query(
            'INSERT INTO product_tag_map (product_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [productId, tag.id]
          );
        }
      }
    }

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete product
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

    // Get product before deletion for event - verify it belongs to user's store
    const product = await queryOne<Product>(
      'SELECT * FROM products WHERE id = $1 AND store_id = $2',
      [productId, user.store_id]
    );

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    await query('DELETE FROM products WHERE id = $1 AND store_id = $2', [productId, user.store_id]);

    // Emit product.deleted event
    await eventBus.emitEvent('product.deleted', { product }, {
      store_id: product.store_id,
      source: 'api',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}

