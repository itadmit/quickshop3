import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { eventBus } from '@/lib/events/eventBus';

// GET /api/automatic-discounts/:id - Get automatic discount details
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
    const storeId = user.store_id;

    const discount = await queryOne(
      `SELECT 
        *,
        CASE WHEN volume_tiers IS NOT NULL THEN volume_tiers::jsonb ELSE NULL END as volume_tiers_json
      FROM automatic_discounts 
      WHERE id = $1 AND store_id = $2`,
      [id, storeId]
    );

    if (!discount) {
      return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
    }

    // Load mappings
    const [productIds, collectionIds, tagNames] = await Promise.all([
      query<{ product_id: number }>(
        'SELECT product_id FROM automatic_discount_products WHERE automatic_discount_id = $1',
        [id]
      ),
      query<{ collection_id: number }>(
        'SELECT collection_id FROM automatic_discount_collections WHERE automatic_discount_id = $1',
        [id]
      ),
      query<{ tag_name: string }>(
        'SELECT tag_name FROM automatic_discount_tags WHERE automatic_discount_id = $1',
        [id]
      ),
    ]);

    return NextResponse.json({
      discount: {
        ...discount,
        volume_tiers: discount.volume_tiers_json ? JSON.parse(discount.volume_tiers_json) : null,
        product_ids: productIds.map(p => p.product_id),
        collection_ids: collectionIds.map(c => c.collection_id),
        tag_names: tagNames.map(t => t.tag_name),
      },
    });
  } catch (error: any) {
    console.error('Error fetching automatic discount:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch automatic discount' },
      { status: 500 }
    );
  }
}

// PUT /api/automatic-discounts/:id - Update automatic discount
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
    const storeId = user.store_id;
    const body = await request.json();

    // Check if discount exists
    const existing = await queryOne(
      'SELECT id FROM automatic_discounts WHERE id = $1 AND store_id = $2',
      [id, storeId]
    );

    if (!existing) {
      return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
    }

    // Build dynamic update query - only update fields that were explicitly sent
    const updateFields: string[] = [];
    const values: any[] = [id, storeId];
    let paramIndex = 3;

    // Helper function to add field to update
    const addField = (fieldName: string, value: any, transform?: (v: any) => any) => {
      if (fieldName in body) {
        updateFields.push(`${fieldName} = $${paramIndex}`);
        values.push(transform ? transform(value) : value);
        paramIndex++;
      }
    };

    // Required fields (use COALESCE to prevent null)
    if ('name' in body && body.name) {
      updateFields.push(`name = $${paramIndex}`);
      values.push(body.name);
      paramIndex++;
    }

    // Optional fields that can be cleared (null allowed)
    addField('description', body.description || null);
    addField('discount_type', body.discount_type);
    addField('value', body.value || null);
    addField('minimum_order_amount', body.minimum_order_amount || null);
    addField('maximum_order_amount', body.maximum_order_amount || null);
    addField('minimum_quantity', body.minimum_quantity ?? null);
    addField('maximum_quantity', body.maximum_quantity ?? null);
    addField('applies_to', body.applies_to);
    addField('priority', body.priority ?? 0);
    addField('can_combine_with_codes', body.can_combine_with_codes);
    addField('can_combine_with_other_automatic', body.can_combine_with_other_automatic);
    addField('max_combined_discounts', body.max_combined_discounts ?? 1);
    addField('customer_segment', body.customer_segment || null);
    addField('minimum_orders_count', body.minimum_orders_count ?? null);
    addField('minimum_lifetime_value', body.minimum_lifetime_value || null);
    addField('starts_at', body.starts_at || null);
    addField('ends_at', body.ends_at || null);
    addField('day_of_week', body.day_of_week || null);
    addField('hour_start', body.hour_start ?? null);
    addField('hour_end', body.hour_end ?? null);
    addField('buy_quantity', body.buy_quantity ?? null);
    addField('get_quantity', body.get_quantity ?? null);
    addField('get_discount_type', body.get_discount_type || null);
    addField('get_discount_value', body.get_discount_value || null);
    addField('applies_to_same_product', body.applies_to_same_product);
    addField('bundle_min_products', body.bundle_min_products ?? null);
    addField('bundle_discount_type', body.bundle_discount_type || null);
    addField('bundle_discount_value', body.bundle_discount_value || null);
    addField('gift_product_id', body.gift_product_id ?? null);
    addField('fixed_price_quantity', body.fixed_price_quantity ?? null);
    addField('fixed_price_amount', body.fixed_price_amount ?? null);
    
    // Special handling for volume_tiers (JSON)
    if ('volume_tiers' in body) {
      updateFields.push(`volume_tiers = $${paramIndex}::jsonb`);
      values.push(body.volume_tiers ? JSON.stringify(body.volume_tiers) : null);
      paramIndex++;
    }
    
    addField('is_active', body.is_active);

    // Always update updated_at
    updateFields.push('updated_at = now()');

    // Build and execute query
    const updateQuery = `
      UPDATE automatic_discounts SET
        ${updateFields.join(',\n        ')}
      WHERE id = $1 AND store_id = $2
      RETURNING *
    `;

    const discount = await queryOne(updateQuery, values);

    // Update mappings if provided
    if (body.product_ids !== undefined) {
      await query('DELETE FROM automatic_discount_products WHERE automatic_discount_id = $1', [id]);
      if (body.product_ids.length > 0) {
        for (const productId of body.product_ids) {
          await query(
            'INSERT INTO automatic_discount_products (automatic_discount_id, product_id) VALUES ($1, $2)',
            [id, productId]
          );
        }
      }
    }

    if (body.collection_ids !== undefined) {
      await query('DELETE FROM automatic_discount_collections WHERE automatic_discount_id = $1', [id]);
      if (body.collection_ids.length > 0) {
        for (const collectionId of body.collection_ids) {
          await query(
            'INSERT INTO automatic_discount_collections (automatic_discount_id, collection_id) VALUES ($1, $2)',
            [id, collectionId]
          );
        }
      }
    }

    if (body.tag_names !== undefined) {
      await query('DELETE FROM automatic_discount_tags WHERE automatic_discount_id = $1', [id]);
      if (body.tag_names.length > 0) {
        for (const tagName of body.tag_names) {
          await query(
            'INSERT INTO automatic_discount_tags (automatic_discount_id, tag_name) VALUES ($1, $2)',
            [id, tagName]
          );
        }
      }
    }

    // Emit event
    await eventBus.emitEvent(
      'automatic_discount.updated',
      {
        discount: {
          id: Number(id),
          name: body.name || discount?.name,
        },
      },
      {
        store_id: storeId,
        source: 'api',
        user_id: user.id,
      }
    );

    return NextResponse.json({ discount });
  } catch (error: any) {
    console.error('Error updating automatic discount:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update automatic discount' },
      { status: 500 }
    );
  }
}

// DELETE /api/automatic-discounts/:id - Delete automatic discount
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
    const storeId = user.store_id;

    // Check if discount exists
    const existing = await queryOne(
      'SELECT id FROM automatic_discounts WHERE id = $1 AND store_id = $2',
      [id, storeId]
    );

    if (!existing) {
      return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
    }

    // Delete discount (CASCADE will delete mappings)
    await query('DELETE FROM automatic_discounts WHERE id = $1 AND store_id = $2', [id, storeId]);

    // Emit event
    await eventBus.emitEvent(
      'automatic_discount.deleted',
      {
        discount: {
          id: Number(id),
        },
      },
      {
        store_id: storeId,
        source: 'api',
        user_id: user.id,
      }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting automatic discount:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete automatic discount' },
      { status: 500 }
    );
  }
}

