import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { eventBus } from '@/lib/events/eventBus';

// GET /api/automatic-discounts - Get all automatic discounts
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;

    const discounts = await query(
      `SELECT 
        id, name, description, discount_type, value,
        minimum_order_amount, maximum_order_amount,
        minimum_quantity, maximum_quantity,
        applies_to, priority,
        can_combine_with_codes, can_combine_with_other_automatic,
        max_combined_discounts,
        customer_segment, minimum_orders_count, minimum_lifetime_value,
        starts_at, ends_at, day_of_week, hour_start, hour_end,
        buy_quantity, get_quantity, get_discount_type, get_discount_value, applies_to_same_product,
        bundle_min_products, bundle_discount_type, bundle_discount_value,
        volume_tiers, gift_product_id,
        is_active, created_at, updated_at
      FROM automatic_discounts
      WHERE store_id = $1
      ORDER BY priority DESC, created_at DESC`,
      [storeId]
    );

    return NextResponse.json({ discounts });
  } catch (error: any) {
    console.error('Error fetching automatic discounts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch automatic discounts' },
      { status: 500 }
    );
  }
}

// POST /api/automatic-discounts - Create automatic discount
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const storeId = user.store_id;

    const {
      name,
      description,
      discount_type,
      value,
      minimum_order_amount,
      maximum_order_amount,
      minimum_quantity,
      maximum_quantity,
      applies_to,
      priority,
      can_combine_with_codes,
      can_combine_with_other_automatic,
      max_combined_discounts,
      customer_segment,
      minimum_orders_count,
      minimum_lifetime_value,
      starts_at,
      ends_at,
      day_of_week,
      hour_start,
      hour_end,
      buy_quantity,
      get_quantity,
      get_discount_type,
      get_discount_value,
      applies_to_same_product,
      bundle_min_products,
      bundle_discount_type,
      bundle_discount_value,
      volume_tiers,
      gift_product_id,
      product_ids,
      collection_ids,
      tag_names,
    } = body;

    // Create discount
    const discount = await queryOne(
      `INSERT INTO automatic_discounts (
        store_id, name, description, discount_type, value,
        minimum_order_amount, maximum_order_amount,
        minimum_quantity, maximum_quantity,
        applies_to, priority,
        can_combine_with_codes, can_combine_with_other_automatic,
        max_combined_discounts,
        customer_segment, minimum_orders_count, minimum_lifetime_value,
        starts_at, ends_at, day_of_week, hour_start, hour_end,
        buy_quantity, get_quantity, get_discount_type, get_discount_value, applies_to_same_product,
        bundle_min_products, bundle_discount_type, bundle_discount_value,
        volume_tiers, gift_product_id,
        is_active, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27,
        $28, $29, $30, $31, $32, true, now(), now()
      )
      RETURNING *`,
      [
        storeId,
        name,
        description || null,
        discount_type,
        value || null,
        minimum_order_amount || null,
        maximum_order_amount || null,
        minimum_quantity || null,
        maximum_quantity || null,
        applies_to || 'all',
        priority || 0,
        can_combine_with_codes !== undefined ? can_combine_with_codes : true,
        can_combine_with_other_automatic !== undefined ? can_combine_with_other_automatic : false,
        max_combined_discounts || 1,
        customer_segment || null,
        minimum_orders_count || null,
        minimum_lifetime_value || null,
        starts_at || null,
        ends_at || null,
        day_of_week || null,
        hour_start || null,
        hour_end || null,
        buy_quantity || null,
        get_quantity || null,
        get_discount_type || null,
        get_discount_value || null,
        applies_to_same_product !== undefined ? applies_to_same_product : true,
        bundle_min_products || null,
        bundle_discount_type || null,
        bundle_discount_value || null,
        volume_tiers ? JSON.stringify(volume_tiers) : null,
        gift_product_id || null,
      ]
    );

    if (!discount) {
      throw new Error('Failed to create automatic discount');
    }

    const discountId = discount.id;

    // Add product mappings
    if (product_ids && product_ids.length > 0) {
      for (const productId of product_ids) {
        await query(
          'INSERT INTO automatic_discount_products (automatic_discount_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [discountId, productId]
        );
      }
    }

    // Add collection mappings
    if (collection_ids && collection_ids.length > 0) {
      for (const collectionId of collection_ids) {
        await query(
          'INSERT INTO automatic_discount_collections (automatic_discount_id, collection_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [discountId, collectionId]
        );
      }
    }

    // Add tag mappings
    if (tag_names && tag_names.length > 0) {
      for (const tagName of tag_names) {
        await query(
          'INSERT INTO automatic_discount_tags (automatic_discount_id, tag_name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [discountId, tagName]
        );
      }
    }

    // Emit event
    await eventBus.emitEvent(
      'automatic_discount.created',
      {
        discount: {
          id: discountId,
          name,
          discount_type,
          value,
        },
      },
      {
        store_id: storeId,
        source: 'api',
        user_id: user.id,
      }
    );

    return NextResponse.json({ discount }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating automatic discount:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create automatic discount' },
      { status: 500 }
    );
  }
}

