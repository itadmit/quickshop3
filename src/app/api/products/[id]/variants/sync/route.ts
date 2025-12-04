import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { ProductVariant } from '@/types/product';
import { eventBus } from '@/lib/events/eventBus';

// POST /api/products/[id]/variants/sync - Sync product variants
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    const body = await request.json();
    const { variants } = body;

    // Verify product exists
    const product = await queryOne<{ store_id: number }>(
      'SELECT store_id FROM products WHERE id = $1',
      [productId]
    );

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get existing variants to track changes
    const existingVariants = await query<ProductVariant>(
      'SELECT * FROM product_variants WHERE product_id = $1',
      [productId]
    );

    // Delete all existing variants
    await query('DELETE FROM product_variants WHERE product_id = $1', [productId]);

    // Insert new variants
    const insertedVariants = [];
    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      
      const sql = `
        INSERT INTO product_variants (
          product_id, title, price, compare_at_price, sku, barcode,
          position, inventory_policy, inventory_management,
          weight, weight_unit, requires_shipping, taxable,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now(), now())
        RETURNING *
      `;

      const insertedVariant = await queryOne<ProductVariant>(sql, [
        productId,
        variant.title || variant.name || 'Default Title',
        variant.price || '0.00',
        variant.compare_at_price || null,
        variant.sku || null,
        variant.barcode || null,
        i + 1,
        variant.inventory_policy || 'deny',
        variant.inventory_management || null,
        variant.weight || null,
        variant.weight_unit || 'kg',
        variant.requires_shipping !== false,
        variant.taxable !== false,
      ]);

      if (insertedVariant) {
        insertedVariants.push(insertedVariant);

        // Handle inventory
        if (variant.inventory_quantity !== undefined) {
          const existingInventory = await queryOne<{ id: number }>(
            'SELECT id FROM variant_inventory WHERE variant_id = $1 LIMIT 1',
            [insertedVariant.id]
          );
          
          if (existingInventory) {
            await query(
              `UPDATE variant_inventory SET available = $1, updated_at = now() WHERE variant_id = $2`,
              [variant.inventory_quantity || 0, insertedVariant.id]
            );
          } else {
            await query(
              `INSERT INTO variant_inventory (variant_id, available, committed, created_at, updated_at)
               VALUES ($1, $2, $3, now(), now())`,
              [insertedVariant.id, variant.inventory_quantity || 0, 0]
            );
          }
        }

        // Emit variant.created event for new variants
        await eventBus.emitEvent('variant.created', { variant: insertedVariant }, {
          store_id: product.store_id,
          source: 'api',
        });

        // Emit inventory.updated event if quantity changed
        const oldVariant = existingVariants.find(v => v.id === variant.id);
        if (oldVariant) {
          const oldInventory = await queryOne<{ available: number }>(
            'SELECT available FROM variant_inventory WHERE variant_id = $1 LIMIT 1',
            [oldVariant.id]
          );
          const newInventory = await queryOne<{ available: number }>(
            'SELECT available FROM variant_inventory WHERE variant_id = $1 LIMIT 1',
            [insertedVariant.id]
          );
          if (oldInventory && newInventory && oldInventory.available !== newInventory.available) {
            await eventBus.emitEvent('inventory.updated', {
              variant_id: insertedVariant.id,
              quantity: newInventory.available,
              reason: 'sync',
            }, {
              store_id: product.store_id,
              source: 'api',
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      variants: insertedVariants,
    });
  } catch (error: any) {
    console.error('Error syncing variants:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync variants' },
      { status: 500 }
    );
  }
}

