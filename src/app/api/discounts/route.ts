import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { DiscountCode, CreateDiscountCodeRequest } from '@/types/discount';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/discounts - List all discount codes
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const isActive = searchParams.get('is_active');

    let sql = 'SELECT * FROM discount_codes WHERE store_id = $1';
    const params: any[] = [user.store_id];

    if (isActive !== null) {
      sql += ' AND is_active = $2';
      params.push(isActive === 'true');
    }

    sql += ' ORDER BY created_at DESC';

    const discounts = await query<DiscountCode>(sql, params);

    return NextResponse.json({ discounts });
  } catch (error: any) {
    console.error('Error fetching discount codes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch discount codes' },
      { status: 500 }
    );
  }
}

// POST /api/discounts - Create discount code
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateDiscountCodeRequest = await request.json();
    const storeId = user.store_id;

    // Check if code already exists
    const existing = await queryOne<DiscountCode>(
      'SELECT * FROM discount_codes WHERE store_id = $1 AND code = $2',
      [storeId, body.code]
    );

    if (existing) {
      return NextResponse.json({ error: 'Discount code already exists' }, { status: 400 });
    }

    const discount = await queryOne<DiscountCode>(
      `INSERT INTO discount_codes (
        store_id, code, discount_type, value,
        minimum_order_amount, maximum_order_amount,
        minimum_quantity, maximum_quantity,
        applies_to, usage_limit,
        priority, can_combine_with_automatic, can_combine_with_other_codes,
        max_combined_discounts,
        customer_segment, minimum_orders_count, minimum_lifetime_value,
        starts_at, ends_at, day_of_week, hour_start, hour_end,
        buy_quantity, get_quantity, get_discount_type, get_discount_value, applies_to_same_product,
        bundle_min_products, bundle_discount_type, bundle_discount_value,
        volume_tiers, gift_product_id,
        fixed_price_quantity, fixed_price_amount,
        is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, now(), now())
      RETURNING *`,
      [
        storeId,
        body.code,
        body.discount_type,
        (body.discount_type !== 'free_shipping' && body.discount_type !== 'bogo' && body.discount_type !== 'bundle' && body.discount_type !== 'volume' && body.discount_type !== 'fixed_price') ? (body.value || null) : null,
        body.minimum_order_amount || null,
        body.maximum_order_amount || null,
        body.minimum_quantity || null,
        body.maximum_quantity || null,
        body.applies_to || 'all',
        body.usage_limit || null,
        body.priority || 0,
        body.can_combine_with_automatic !== undefined ? body.can_combine_with_automatic : true,
        body.can_combine_with_other_codes !== undefined ? body.can_combine_with_other_codes : false,
        body.max_combined_discounts || 1,
        body.customer_segment || null,
        body.minimum_orders_count || null,
        body.minimum_lifetime_value || null,
        body.starts_at || null,
        body.ends_at || null,
        body.day_of_week || null,
        body.hour_start || null,
        body.hour_end || null,
        body.buy_quantity || null,
        body.get_quantity || null,
        body.get_discount_type || null,
        body.get_discount_value || null,
        body.applies_to_same_product !== undefined ? body.applies_to_same_product : true,
        body.bundle_min_products || null,
        body.bundle_discount_type || null,
        body.bundle_discount_value || null,
        body.volume_tiers ? JSON.stringify(body.volume_tiers) : null,
        body.gift_product_id || null,
        body.fixed_price_quantity || null,
        body.fixed_price_amount || null,
        body.is_active !== undefined ? body.is_active : true,
      ]
    );

    if (!discount) {
      throw new Error('Failed to create discount code');
    }

    const discountId = discount.id;

    // Add product mappings
    if (body.product_ids && body.product_ids.length > 0) {
      for (const productId of body.product_ids) {
        await query(
          'INSERT INTO discount_code_products (discount_code_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [discountId, productId]
        );
      }
    }

    // Add collection mappings
    if (body.collection_ids && body.collection_ids.length > 0) {
      for (const collectionId of body.collection_ids) {
        await query(
          'INSERT INTO discount_code_collections (discount_code_id, collection_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [discountId, collectionId]
        );
      }
    }

    // Add tag mappings
    if (body.tag_names && body.tag_names.length > 0) {
      for (const tagName of body.tag_names) {
        await query(
          'INSERT INTO discount_code_tags (discount_code_id, tag_name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [discountId, tagName]
        );
      }
    }

    // Emit event
    await eventBus.emitEvent('discount.created', {
      discount: {
        id: discount.id,
        code: discount.code,
        discount_type: discount.discount_type,
        value: discount.value,
      },
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ discount }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating discount code:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create discount code' },
      { status: 500 }
    );
  }
}

