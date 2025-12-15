import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { DiscountCode, UpdateDiscountCodeRequest } from '@/types/discount';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/discounts/:id - Get discount code
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
    const discountId = parseInt(id);
    const discount = await queryOne<DiscountCode>(
      'SELECT * FROM discount_codes WHERE id = $1 AND store_id = $2',
      [discountId, user.store_id]
    );

    if (!discount) {
      return NextResponse.json({ error: 'Discount code not found' }, { status: 404 });
    }

    // Load mappings
    const [productIds, collectionIds, tagNames] = await Promise.all([
      query<{ product_id: number }>(
        'SELECT product_id FROM discount_code_products WHERE discount_code_id = $1',
        [discountId]
      ),
      query<{ collection_id: number }>(
        'SELECT collection_id FROM discount_code_collections WHERE discount_code_id = $1',
        [discountId]
      ),
      query<{ tag_name: string }>(
        'SELECT tag_name FROM discount_code_tags WHERE discount_code_id = $1',
        [discountId]
      ),
    ]);

    return NextResponse.json({
      discount: {
        ...discount,
        product_ids: productIds.map(p => p.product_id),
        collection_ids: collectionIds.map(c => c.collection_id),
        tag_names: tagNames.map(t => t.tag_name),
      },
    });
  } catch (error: any) {
    console.error('Error fetching discount code:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch discount code' },
      { status: 500 }
    );
  }
}

// PUT /api/discounts/:id - Update discount code
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
    const discountId = parseInt(id);
    const body: UpdateDiscountCodeRequest = await request.json();

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (body.code !== undefined) {
      updates.push(`code = $${paramIndex}`);
      values.push(body.code);
      paramIndex++;
    }

    if (body.discount_type !== undefined) {
      updates.push(`discount_type = $${paramIndex}`);
      values.push(body.discount_type);
      paramIndex++;
    }

    if (body.value !== undefined) {
      updates.push(`value = $${paramIndex}`);
      values.push(body.value);
      paramIndex++;
    }

    if (body.minimum_order_amount !== undefined) {
      updates.push(`minimum_order_amount = $${paramIndex}`);
      values.push(body.minimum_order_amount);
      paramIndex++;
    }

    if (body.maximum_order_amount !== undefined) {
      updates.push(`maximum_order_amount = $${paramIndex}`);
      values.push(body.maximum_order_amount);
      paramIndex++;
    }

    if (body.minimum_quantity !== undefined) {
      updates.push(`minimum_quantity = $${paramIndex}`);
      values.push(body.minimum_quantity);
      paramIndex++;
    }

    if (body.maximum_quantity !== undefined) {
      updates.push(`maximum_quantity = $${paramIndex}`);
      values.push(body.maximum_quantity);
      paramIndex++;
    }

    if (body.usage_limit !== undefined) {
      updates.push(`usage_limit = $${paramIndex}`);
      values.push(body.usage_limit);
      paramIndex++;
    }

    if (body.applies_to !== undefined) {
      updates.push(`applies_to = $${paramIndex}`);
      values.push(body.applies_to);
      paramIndex++;
    }

    if (body.priority !== undefined) {
      updates.push(`priority = $${paramIndex}`);
      values.push(body.priority);
      paramIndex++;
    }

    if (body.can_combine_with_automatic !== undefined) {
      updates.push(`can_combine_with_automatic = $${paramIndex}`);
      values.push(body.can_combine_with_automatic);
      paramIndex++;
    }

    if (body.can_combine_with_other_codes !== undefined) {
      updates.push(`can_combine_with_other_codes = $${paramIndex}`);
      values.push(body.can_combine_with_other_codes);
      paramIndex++;
    }

    if (body.max_combined_discounts !== undefined) {
      updates.push(`max_combined_discounts = $${paramIndex}`);
      values.push(body.max_combined_discounts);
      paramIndex++;
    }

    if (body.customer_segment !== undefined) {
      updates.push(`customer_segment = $${paramIndex}`);
      values.push(body.customer_segment);
      paramIndex++;
    }

    if (body.minimum_orders_count !== undefined) {
      updates.push(`minimum_orders_count = $${paramIndex}`);
      values.push(body.minimum_orders_count);
      paramIndex++;
    }

    if (body.minimum_lifetime_value !== undefined) {
      updates.push(`minimum_lifetime_value = $${paramIndex}`);
      values.push(body.minimum_lifetime_value);
      paramIndex++;
    }

    if (body.starts_at !== undefined) {
      updates.push(`starts_at = $${paramIndex}`);
      values.push(body.starts_at);
      paramIndex++;
    }

    if (body.ends_at !== undefined) {
      updates.push(`ends_at = $${paramIndex}`);
      values.push(body.ends_at);
      paramIndex++;
    }

    if (body.day_of_week !== undefined) {
      updates.push(`day_of_week = $${paramIndex}`);
      values.push(body.day_of_week);
      paramIndex++;
    }

    if (body.hour_start !== undefined) {
      updates.push(`hour_start = $${paramIndex}`);
      values.push(body.hour_start);
      paramIndex++;
    }

    if (body.hour_end !== undefined) {
      updates.push(`hour_end = $${paramIndex}`);
      values.push(body.hour_end);
      paramIndex++;
    }

    if (body.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      values.push(body.is_active);
      paramIndex++;
    }

    if (body.gift_product_id !== undefined) {
      updates.push(`gift_product_id = $${paramIndex}`);
      values.push(body.gift_product_id);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push(`updated_at = now()`);
    values.push(discountId, user.store_id);

    const sql = `
      UPDATE discount_codes 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1}
      RETURNING *
    `;

    const updatedDiscount = await queryOne<DiscountCode>(sql, values);

    if (!updatedDiscount) {
      return NextResponse.json({ error: 'Failed to update discount code' }, { status: 500 });
    }

    // Update mappings if provided
    if (body.product_ids !== undefined) {
      await query('DELETE FROM discount_code_products WHERE discount_code_id = $1', [discountId]);
      if (body.product_ids.length > 0) {
        for (const productId of body.product_ids) {
          await query(
            'INSERT INTO discount_code_products (discount_code_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [discountId, productId]
          );
        }
      }
    }

    if (body.collection_ids !== undefined) {
      await query('DELETE FROM discount_code_collections WHERE discount_code_id = $1', [discountId]);
      if (body.collection_ids.length > 0) {
        for (const collectionId of body.collection_ids) {
          await query(
            'INSERT INTO discount_code_collections (discount_code_id, collection_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [discountId, collectionId]
          );
        }
      }
    }

    if (body.tag_names !== undefined) {
      await query('DELETE FROM discount_code_tags WHERE discount_code_id = $1', [discountId]);
      if (body.tag_names.length > 0) {
        for (const tagName of body.tag_names) {
          await query(
            'INSERT INTO discount_code_tags (discount_code_id, tag_name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [discountId, tagName]
          );
        }
      }
    }

    // Emit event
    await eventBus.emitEvent('discount.updated', {
      discount: {
        id: updatedDiscount.id,
        code: updatedDiscount.code,
      },
      changes: body,
    }, {
      store_id: user.store_id,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ discount: updatedDiscount });
  } catch (error: any) {
    console.error('Error updating discount code:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update discount code' },
      { status: 500 }
    );
  }
}

// DELETE /api/discounts/:id - Delete discount code
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
    const discountId = parseInt(id);

    const discount = await queryOne<DiscountCode>(
      'SELECT * FROM discount_codes WHERE id = $1 AND store_id = $2',
      [discountId, user.store_id]
    );

    if (!discount) {
      return NextResponse.json({ error: 'Discount code not found' }, { status: 404 });
    }

    await query(
      'DELETE FROM discount_codes WHERE id = $1 AND store_id = $2',
      [discountId, user.store_id]
    );

    // Emit event
    await eventBus.emitEvent('discount.deleted', {
      discount: {
        id: discount.id,
        code: discount.code,
      },
    }, {
      store_id: user.store_id,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting discount code:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete discount code' },
      { status: 500 }
    );
  }
}

