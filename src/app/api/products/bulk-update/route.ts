import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { eventBus } from '@/lib/events/eventBus';
import { generateUniqueSlug } from '@/lib/utils/slug';

// POST /api/products/bulk-update - Bulk update products and variants
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { updates } = body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'updates array is required' },
        { status: 400 }
      );
    }

    const storeId = user.store_id;
    const results: any[] = [];

    for (const update of updates) {
      try {
        if (update.type === 'product') {
          // Update product
          const productId = parseInt(update.productId || update.id);
          
          // Verify product belongs to store
          const existingProduct = await queryOne(
            'SELECT * FROM products WHERE id = $1 AND store_id = $2',
            [productId, storeId]
          );

          if (!existingProduct) {
            results.push({
              type: 'product',
              id: productId,
              success: false,
              error: 'Product not found',
            });
            continue;
          }

          const changes: any = {};
          const updateFields: string[] = [];
          const updateValues: any[] = [];
          let paramIndex = 1;

          // Handle title change (requires handle regeneration)
          if (update.changes.name !== undefined && update.changes.name !== existingProduct.title) {
            updateFields.push(`title = $${paramIndex++}`);
            updateValues.push(update.changes.name);
            changes.title = { old: existingProduct.title, new: update.changes.name };
          }

          // Handle status change
          if (update.changes.isHidden !== undefined) {
            const newStatus = update.changes.isHidden ? 'draft' : 'active';
            if (newStatus !== existingProduct.status) {
              updateFields.push(`status = $${paramIndex++}`);
              updateValues.push(newStatus);
              changes.status = { old: existingProduct.status, new: newStatus };
            }
          }

          // Handle vendor
          if (update.changes.vendor !== undefined && update.changes.vendor !== existingProduct.vendor) {
            updateFields.push(`vendor = $${paramIndex++}`);
            updateValues.push(update.changes.vendor || null);
            changes.vendor = { old: existingProduct.vendor, new: update.changes.vendor };
          }

          // Handle category (collection)
          if (update.changes.categories !== undefined) {
            // Remove existing collection mappings
            await query(
              'DELETE FROM product_collection_map WHERE product_id = $1',
              [productId]
            );

            // Add new collection mappings
            if (update.changes.categories && update.changes.categories.length > 0) {
              for (const collectionId of update.changes.categories) {
                await query(
                  'INSERT INTO product_collection_map (product_id, collection_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                  [productId, parseInt(collectionId)]
                );
              }
            }
          }

          // Handle price and inventory for products without variants
          // Find or create a default variant
          if (update.changes.price !== undefined || update.changes.inventoryQty !== undefined) {
            console.log('Processing price/inventory for product:', {
              productId,
              price: update.changes.price,
              inventoryQty: update.changes.inventoryQty,
            });

            // Find the first variant for this product
            let variant = await queryOne<{ id: number; price: string; inventory_quantity: number | null }>(
              'SELECT id, price, inventory_quantity FROM product_variants WHERE product_id = $1 ORDER BY position LIMIT 1',
              [productId]
            );

            if (!variant) {
              // Create a default variant
              console.log('Creating default variant for product:', productId);
              variant = await queryOne<{ id: number; price: string; inventory_quantity: number | null }>(
                `INSERT INTO product_variants (product_id, title, price, position, created_at, updated_at)
                 VALUES ($1, 'Default Title', $2, 1, now(), now())
                 RETURNING id, price, inventory_quantity`,
                [productId, update.changes.price || 0]
              );
            }

            if (variant) {
              // Update variant price if changed
              if (update.changes.price !== undefined) {
                console.log('Updating variant price:', { variantId: variant.id, price: update.changes.price });
                await query(
                  'UPDATE product_variants SET price = $1, updated_at = now() WHERE id = $2',
                  [update.changes.price, variant.id]
                );
                changes.price = { old: variant.price, new: update.changes.price };
              }

              // Update variant inventory if changed
              if (update.changes.inventoryQty !== undefined) {
                console.log('Updating variant inventory:', { variantId: variant.id, inventoryQty: update.changes.inventoryQty });
                
                // עדכון המלאי ישירות ב-product_variants
                await query(
                  'UPDATE product_variants SET inventory_quantity = $1, updated_at = now() WHERE id = $2',
                  [update.changes.inventoryQty, variant.id]
                );
                
                const oldQty = variant.inventory_quantity || 0;
                changes.inventoryQty = { old: oldQty, new: update.changes.inventoryQty };

                // Emit inventory update event
                await eventBus.emitEvent('inventory.updated', {
                  variantId: variant.id,
                  productId,
                  available: update.changes.inventoryQty,
                }, {
                  store_id: storeId,
                  source: 'api',
                });
              }
            }
          }

          // Update product if there are field changes
          if (updateFields.length > 0) {
            updateFields.push(`updated_at = now()`);
            updateValues.push(productId, storeId);

            const sql = `UPDATE products SET ${updateFields.join(', ')} WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1} RETURNING *`;
            const updatedProduct = await queryOne(sql, updateValues);

            if (updatedProduct) {
              // Regenerate handle if title changed
              if (changes.title) {
                const newHandle = await generateUniqueSlug(
                  update.changes.name,
                  'products',
                  storeId,
                  productId
                );
                await query(
                  'UPDATE products SET handle = $1 WHERE id = $2',
                  [newHandle, productId]
                );
              }

              // Emit event
              await eventBus.emitEvent('product.updated', {
                product: updatedProduct,
                changes,
              }, {
                store_id: storeId,
                source: 'api',
              });

              results.push({
                type: 'product',
                id: productId,
                success: true,
              });
            } else {
              results.push({
                type: 'product',
                id: productId,
                success: false,
                error: 'Failed to update',
              });
            }
          } else if (Object.keys(changes).length > 0) {
            // Price/inventory changes were made (no product field changes)
            console.log('Product price/inventory changes applied:', { productId, changes });
            results.push({
              type: 'product',
              id: productId,
              success: true,
              message: 'Price/inventory updated',
            });
          } else {
            results.push({
              type: 'product',
              id: productId,
              success: true,
              message: 'No changes',
            });
          }
        } else if (update.type === 'variant') {
          // Update variant
          const variantId = parseInt(update.variantId);
          const productId = parseInt(update.productId);

          // Verify variant belongs to store and get current inventory
          const existingVariant = await queryOne<{
            id: number;
            title: string;
            sku: string | null;
            price: string;
            compare_at_price: string | null;
          }>(
            `SELECT v.* FROM product_variants v
             INNER JOIN products p ON p.id = v.product_id
             WHERE v.id = $1 AND p.store_id = $2`,
            [variantId, storeId]
          );

          if (!existingVariant) {
            results.push({
              type: 'variant',
              id: variantId,
              success: false,
              error: 'Variant not found',
            });
            continue;
          }

          // Get current inventory
          const currentInventory = await queryOne<{ available: number }>(
            'SELECT available FROM variant_inventory WHERE variant_id = $1 LIMIT 1',
            [variantId]
          );
          const currentInventoryQty = currentInventory?.available || 0;

          const updateFields: string[] = [];
          const updateValues: any[] = [];
          let paramIndex = 1;

          if (update.changes.name !== undefined && update.changes.name !== existingVariant.title) {
            updateFields.push(`title = $${paramIndex++}`);
            updateValues.push(update.changes.name);
          }

          if (update.changes.sku !== undefined && update.changes.sku !== existingVariant.sku) {
            updateFields.push(`sku = $${paramIndex++}`);
            updateValues.push(update.changes.sku || null);
          }

          if (update.changes.price !== undefined) {
            updateFields.push(`price = $${paramIndex++}`);
            updateValues.push(update.changes.price.toString());
          }

          if (update.changes.comparePrice !== undefined) {
            updateFields.push(`compare_at_price = $${paramIndex++}`);
            updateValues.push(update.changes.comparePrice !== null && update.changes.comparePrice !== undefined ? update.changes.comparePrice.toString() : null);
          }

          // Update variant fields
          if (updateFields.length > 0) {
            updateFields.push(`updated_at = now()`);
            updateValues.push(variantId);

            const sql = `UPDATE product_variants SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
            const updatedVariant = await queryOne(sql, updateValues);

            if (!updatedVariant) {
              results.push({
                type: 'variant',
                id: variantId,
                success: false,
                error: 'Failed to update variant',
              });
              continue;
            }
          }

          // Handle inventory update separately (in variant_inventory table)
          if (update.changes.inventoryQty !== undefined) {
            // Get current inventory
            const currentInventory = await queryOne<{ id: number; available: number }>(
              'SELECT id, available FROM variant_inventory WHERE variant_id = $1 LIMIT 1',
              [variantId]
            );

            if (currentInventory) {
              // Update existing inventory
              await query(
                `UPDATE variant_inventory SET available = $1, updated_at = now() WHERE variant_id = $2`,
                [update.changes.inventoryQty, variantId]
              );
            } else {
              // Create new inventory record
              await query(
                `INSERT INTO variant_inventory (variant_id, available, committed, created_at, updated_at)
                 VALUES ($1, $2, 0, now(), now())`,
                [variantId, update.changes.inventoryQty]
              );
            }

            // Emit inventory.updated event
            await eventBus.emitEvent('inventory.updated', {
              variant_id: variantId,
              quantity: update.changes.inventoryQty,
            }, {
              store_id: storeId,
              source: 'api',
            });
          }

          results.push({
            type: 'variant',
            id: variantId,
            success: true,
          });
        }
      } catch (error: any) {
        results.push({
          type: update.type,
          id: update.id || update.productId || update.variantId,
          success: false,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      total: results.length,
      succeeded: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    });
  } catch (error: any) {
    console.error('Error bulk updating products:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to bulk update products' },
      { status: 500 }
    );
  }
}

