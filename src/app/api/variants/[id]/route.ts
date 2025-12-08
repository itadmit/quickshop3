import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { ProductVariant } from '@/types/product';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';
import { getVariantTitle } from '@/lib/utils/variant-title';

/**
 * PUT /api/variants/[id] - Update a specific variant
 */
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
    const variantId = parseInt(id);
    const body = await request.json();

    // Verify variant exists and belongs to user's store
    const variant = await queryOne<ProductVariant & { store_id: number }>(
      `SELECT pv.*, p.store_id 
       FROM product_variants pv
       INNER JOIN products p ON pv.product_id = p.id
       WHERE pv.id = $1 AND p.store_id = $2`,
      [variantId, user.store_id]
    );

    if (!variant) {
      return NextResponse.json(
        { error: 'Variant not found' },
        { status: 404 }
      );
    }

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // אם יש options, עדכן את ה-title אוטומטית
    const hasOptions = body.option1 !== undefined || body.option2 !== undefined || body.option3 !== undefined;
    if (hasOptions) {
      const newOption1 = body.option1 !== undefined ? body.option1 : variant.option1;
      const newOption2 = body.option2 !== undefined ? body.option2 : variant.option2;
      const newOption3 = body.option3 !== undefined ? body.option3 : variant.option3;
      const newTitle = getVariantTitle(body.title || variant.title, newOption1, newOption2, newOption3);
      updates.push(`title = $${paramIndex++}`);
      values.push(newTitle);
    } else if (body.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(body.title);
    }

    if (body.option1 !== undefined) {
      updates.push(`option1 = $${paramIndex++}`);
      values.push(body.option1);
    }
    if (body.option2 !== undefined) {
      updates.push(`option2 = $${paramIndex++}`);
      values.push(body.option2);
    }
    if (body.option3 !== undefined) {
      updates.push(`option3 = $${paramIndex++}`);
      values.push(body.option3);
    }
    if (body.price !== undefined) {
      updates.push(`price = $${paramIndex++}`);
      values.push(body.price);
    }
    if (body.compare_at_price !== undefined) {
      updates.push(`compare_at_price = $${paramIndex++}`);
      values.push(body.compare_at_price);
    }
    if (body.sku !== undefined) {
      updates.push(`sku = $${paramIndex++}`);
      values.push(body.sku);
    }
    if (body.barcode !== undefined) {
      updates.push(`barcode = $${paramIndex++}`);
      values.push(body.barcode);
    }
    if (body.inventory_quantity !== undefined) {
      updates.push(`inventory_quantity = $${paramIndex++}`);
      values.push(body.inventory_quantity);
    }
    if (body.inventory_policy !== undefined) {
      updates.push(`inventory_policy = $${paramIndex++}`);
      values.push(body.inventory_policy);
    }
    if (body.inventory_management !== undefined) {
      updates.push(`inventory_management = $${paramIndex++}`);
      values.push(body.inventory_management);
    }
    if (body.weight !== undefined) {
      updates.push(`weight = $${paramIndex++}`);
      values.push(body.weight);
    }
    if (body.taxable !== undefined) {
      updates.push(`taxable = $${paramIndex++}`);
      values.push(body.taxable);
    }

    if (updates.length === 0) {
      return NextResponse.json({ variant }, { status: 200 });
    }

    // Add updated_at
    updates.push(`updated_at = now()`);
    values.push(variantId);

    const sql = `
      UPDATE product_variants 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const updatedVariant = await queryOne<ProductVariant>(sql, values);

    if (!updatedVariant) {
      throw new Error('Failed to update variant');
    }

    // Emit variant.updated event
    await eventBus.emitEvent('variant.updated', {
      variant: updatedVariant,
      oldVariant: variant,
    }, {
      store_id: variant.store_id,
      source: 'api',
    });

    // If inventory changed, emit inventory.updated event
    if (body.inventory_quantity !== undefined && body.inventory_quantity !== variant.inventory_quantity) {
      await eventBus.emitEvent('inventory.updated', {
        variant_id: variantId,
        quantity: body.inventory_quantity,
        old_quantity: variant.inventory_quantity,
        reason: 'update',
      }, {
        store_id: variant.store_id,
        source: 'api',
      });
    }

    return NextResponse.json({ variant: updatedVariant }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating variant:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update variant' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/variants/[id] - Delete a variant
 */
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
    const variantId = parseInt(id);

    // Verify variant exists and belongs to user's store
    const variant = await queryOne<ProductVariant & { store_id: number; product_id: number }>(
      `SELECT pv.*, p.store_id, p.id as product_id
       FROM product_variants pv
       INNER JOIN products p ON pv.product_id = p.id
       WHERE pv.id = $1 AND p.store_id = $2`,
      [variantId, user.store_id]
    );

    if (!variant) {
      return NextResponse.json(
        { error: 'Variant not found' },
        { status: 404 }
      );
    }

    // Check if this is the last variant (shouldn't delete it)
    const variantCount = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM product_variants WHERE product_id = $1',
      [variant.product_id]
    );

    if (parseInt(variantCount?.count || '0') <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the last variant. A product must have at least one variant.' },
        { status: 400 }
      );
    }

    // Delete the variant
    await query('DELETE FROM product_variants WHERE id = $1', [variantId]);

    // Emit variant.deleted event
    await eventBus.emitEvent('variant.deleted', {
      variant_id: variantId,
      product_id: variant.product_id,
    }, {
      store_id: variant.store_id,
      source: 'api',
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting variant:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete variant' },
      { status: 500 }
    );
  }
}

