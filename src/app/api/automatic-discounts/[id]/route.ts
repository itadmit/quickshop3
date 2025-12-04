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
      `SELECT * FROM automatic_discounts WHERE id = $1 AND store_id = $2`,
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

    // Update discount
    const discount = await queryOne(
      `UPDATE automatic_discounts SET
        name = COALESCE($3, name),
        description = COALESCE($4, description),
        discount_type = COALESCE($5, discount_type),
        value = COALESCE($6, value),
        minimum_order_amount = COALESCE($7, minimum_order_amount),
        maximum_order_amount = COALESCE($8, maximum_order_amount),
        minimum_quantity = COALESCE($9, minimum_quantity),
        maximum_quantity = COALESCE($10, maximum_quantity),
        applies_to = COALESCE($11, applies_to),
        priority = COALESCE($12, priority),
        can_combine_with_codes = COALESCE($13, can_combine_with_codes),
        can_combine_with_other_automatic = COALESCE($14, can_combine_with_other_automatic),
        max_combined_discounts = COALESCE($15, max_combined_discounts),
        customer_segment = COALESCE($16, customer_segment),
        minimum_orders_count = COALESCE($17, minimum_orders_count),
        minimum_lifetime_value = COALESCE($18, minimum_lifetime_value),
        starts_at = COALESCE($19, starts_at),
        ends_at = COALESCE($20, ends_at),
        day_of_week = COALESCE($21, day_of_week),
        hour_start = COALESCE($22, hour_start),
        hour_end = COALESCE($23, hour_end),
        is_active = COALESCE($24, is_active),
        updated_at = now()
      WHERE id = $1 AND store_id = $2
      RETURNING *`,
      [
        id,
        storeId,
        body.name,
        body.description,
        body.discount_type,
        body.value,
        body.minimum_order_amount,
        body.maximum_order_amount,
        body.minimum_quantity,
        body.maximum_quantity,
        body.applies_to,
        body.priority,
        body.can_combine_with_codes,
        body.can_combine_with_other_automatic,
        body.max_combined_discounts,
        body.customer_segment,
        body.minimum_orders_count,
        body.minimum_lifetime_value,
        body.starts_at,
        body.ends_at,
        body.day_of_week,
        body.hour_start,
        body.hour_end,
        body.is_active,
      ]
    );

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
    await eventBus.emit(
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
    await eventBus.emit(
      'automatic_discount.deleted',
      {
        discount_id: Number(id),
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

