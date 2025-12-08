import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { ProductVariant } from '@/types/product';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';
import { getVariantTitle } from '@/lib/utils/variant-title';

// POST /api/products/[id]/variants/sync - Sync product variants
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
    const body = await request.json();
    const { variants } = body;

    // Verify product exists and belongs to user's store
    const product = await queryOne<{ store_id: number }>(
      'SELECT store_id FROM products WHERE id = $1 AND store_id = $2',
      [productId, user.store_id]
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
      
      // בנה title מ-options אם יש, אחרת השתמש ב-title הקיים
      const variantTitle = getVariantTitle(
        variant.title || variant.name,
        variant.option1,
        variant.option2,
        variant.option3
      );

      const sql = `
        INSERT INTO product_variants (
          product_id, title, price, compare_at_price, sku, barcode,
          option1, option2, option3,
          position, inventory_quantity, inventory_policy, inventory_management,
          weight, weight_unit, requires_shipping, taxable,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, now(), now())
        RETURNING *
      `;

      const insertedVariant = await queryOne<ProductVariant>(sql, [
        productId,
        variantTitle,
        variant.price || '0.00',
        variant.compare_at_price || null,
        variant.sku || null,
        variant.barcode || null,
        variant.option1 || null,
        variant.option2 || null,
        variant.option3 || null,
        i + 1,
        variant.inventory_quantity || 0,  // הוספת inventory_quantity
        variant.inventory_policy || 'deny',
        variant.inventory_management || null,
        variant.weight || null,
        variant.weight_unit || 'kg',
        variant.requires_shipping !== false,
        variant.taxable !== false,
      ]);

      if (insertedVariant) {
        insertedVariants.push(insertedVariant);

        // Emit variant.created event for new variants
        await eventBus.emitEvent('variant.created', { variant: insertedVariant }, {
          store_id: product.store_id,
          source: 'api',
        });

        // Emit inventory.updated event if quantity changed
        const oldVariant = existingVariants.find(v => v.id === variant.id);
        if (oldVariant) {
          const oldQty = oldVariant.inventory_quantity || 0;
          const newQty = insertedVariant.inventory_quantity || 0;
          if (oldQty !== newQty) {
            await eventBus.emitEvent('inventory.updated', {
              variant_id: insertedVariant.id,
              quantity: newQty,
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

