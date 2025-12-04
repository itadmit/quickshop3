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

    return NextResponse.json({ discount });
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

    if (body.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      values.push(body.is_active);
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

