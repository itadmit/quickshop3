import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Product } from '@/types/product';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';

// POST /api/products/bulk - Bulk operations on products
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, product_ids, data } = body;

    if (!action || !product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request. action and product_ids array are required.' },
        { status: 400 }
      );
    }

    const storeId = user.store_id;

    let results: any[] = [];

    switch (action) {
      case 'delete':
        // Delete products
        for (const productId of product_ids) {
          const product = await queryOne<Product>(
            'SELECT * FROM products WHERE id = $1 AND store_id = $2',
            [productId, storeId]
          );

          if (product) {
            await query('DELETE FROM products WHERE id = $1', [productId]);
            
            // Emit product.deleted event
            await eventBus.emitEvent('product.deleted', { product }, {
              store_id: storeId,
              source: 'api',
            });

            results.push({ id: productId, success: true });
          } else {
            results.push({ id: productId, success: false, error: 'Product not found' });
          }
        }
        break;

      case 'update_status':
        // Update status for multiple products
        const { status } = data;
        if (!status || !['draft', 'active', 'archived'].includes(status)) {
          return NextResponse.json(
            { error: 'Invalid status. Must be draft, active, or archived.' },
            { status: 400 }
          );
        }

        for (const productId of product_ids) {
          const oldProduct = await queryOne<Product>(
            'SELECT * FROM products WHERE id = $1 AND store_id = $2',
            [productId, storeId]
          );

          if (oldProduct) {
            const updatedProduct = await queryOne<Product>(
              `UPDATE products SET status = $1, updated_at = now() 
               WHERE id = $2 AND store_id = $3 RETURNING *`,
              [status, productId, storeId]
            );

            if (updatedProduct) {
              // Emit product.updated event
              await eventBus.emitEvent('product.updated', {
                product: updatedProduct,
                changes: { status: { old: oldProduct.status, new: status } },
              }, {
                store_id: storeId,
                source: 'api',
              });

              // Emit product.published event if status changed to 'active'
              if (oldProduct.status !== 'active' && status === 'active') {
                await eventBus.emitEvent('product.published', { product: updatedProduct }, {
                  store_id: storeId,
                  source: 'api',
                });
              }

              results.push({ id: productId, success: true });
            } else {
              results.push({ id: productId, success: false, error: 'Failed to update' });
            }
          } else {
            results.push({ id: productId, success: false, error: 'Product not found' });
          }
        }
        break;

      case 'add_to_collection':
        // Add products to collection
        const { collection_id } = data;
        if (!collection_id) {
          return NextResponse.json(
            { error: 'collection_id is required.' },
            { status: 400 }
          );
        }

        for (const productId of product_ids) {
          // Check if mapping already exists
          const existing = await queryOne(
            'SELECT id FROM product_collection_map WHERE product_id = $1 AND collection_id = $2',
            [productId, collection_id]
          );

          if (!existing) {
            await query(
              'INSERT INTO product_collection_map (product_id, collection_id) VALUES ($1, $2)',
              [productId, collection_id]
            );
            results.push({ id: productId, success: true });
          } else {
            results.push({ id: productId, success: true, message: 'Already in collection' });
          }
        }
        break;

      case 'remove_from_collection':
        // Remove products from collection
        const { collection_id: removeCollectionId } = data;
        if (!removeCollectionId) {
          return NextResponse.json(
            { error: 'Invalid collection_id' },
            { status: 400 }
          );
        }

        for (const productId of product_ids) {
          await query(
            'DELETE FROM product_collection_map WHERE product_id = $1 AND collection_id = $2',
            [productId, removeCollectionId]
          );
          results.push({ id: productId, success: true });
        }
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      results,
      total: results.length,
      succeeded: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    });
  } catch (error: any) {
    console.error('Error performing bulk operation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}

