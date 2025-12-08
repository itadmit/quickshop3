import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

const updateReturnSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED', 'CANCELLED']),
  refundAmount: z.number().min(0).optional(),
  refundMethod: z.enum(['STORE_CREDIT', 'ORIGINAL_PAYMENT_METHOD']).optional(),
  notes: z.string().optional(),
});

// GET /api/returns/[id] - Get single return details
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
    const returnId = parseInt(id);

    if (isNaN(returnId)) {
      return NextResponse.json({ error: 'Invalid return ID' }, { status: 400 });
    }

    const returnItem = await queryOne<any>(
      `SELECT 
        r.*,
        o.order_number,
        o.order_name,
        o.total_price as order_total,
        o.financial_status as order_financial_status,
        c.first_name || ' ' || COALESCE(c.last_name, '') as customer_name,
        c.email as customer_email
      FROM returns r
      JOIN orders o ON r.order_id = o.id
      LEFT JOIN customers c ON r.customer_id = c.id
      WHERE r.id = $1 AND r.store_id = $2`,
      [returnId, user.store_id]
    );

    if (!returnItem) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 });
    }

    // Get order line items
    const orderItems = await query<any>(
      `SELECT id, product_id, variant_id, title, variant_title, quantity, price
       FROM order_line_items
       WHERE order_id = $1`,
      [returnItem.order_id]
    );

    return NextResponse.json({
      id: returnItem.id,
      orderId: returnItem.order_id,
      orderNumber: returnItem.order_number,
      orderName: returnItem.order_name,
      orderTotal: parseFloat(returnItem.order_total),
      orderFinancialStatus: returnItem.order_financial_status,
      customerId: returnItem.customer_id,
      customerName: returnItem.customer_name,
      customerEmail: returnItem.customer_email,
      status: returnItem.status,
      reason: returnItem.reason,
      items: typeof returnItem.items === 'string' ? JSON.parse(returnItem.items) : returnItem.items,
      refundAmount: returnItem.refund_amount ? parseFloat(returnItem.refund_amount) : null,
      refundMethod: returnItem.refund_method,
      notes: returnItem.notes,
      createdAt: returnItem.created_at,
      updatedAt: returnItem.updated_at,
      orderItems: orderItems.map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        variantId: item.variant_id,
        title: item.title,
        variantTitle: item.variant_title,
        quantity: item.quantity,
        price: parseFloat(item.price),
      })),
    });
  } catch (error: any) {
    console.error('Error fetching return:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch return' },
      { status: 500 }
    );
  }
}

// PATCH /api/returns/[id] - Update return status and process refund
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const returnId = parseInt(id);

    if (isNaN(returnId)) {
      return NextResponse.json({ error: 'Invalid return ID' }, { status: 400 });
    }

    const body = await request.json();
    const data = updateReturnSchema.parse(body);

    // Get the return to verify ownership
    const returnItem = await queryOne<any>(
      `SELECT * FROM returns WHERE id = $1 AND store_id = $2`,
      [returnId, user.store_id]
    );

    if (!returnItem) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 });
    }

    // If approving and refund method is STORE_CREDIT, create/update store credit
    if (data.status === 'APPROVED' && data.refundMethod === 'STORE_CREDIT') {
      const refundAmount = data.refundAmount || returnItem.refund_amount;
      
      if (!refundAmount || refundAmount <= 0) {
        return NextResponse.json(
          { error: 'Refund amount is required when approving with store credit' },
          { status: 400 }
        );
      }

      // Check if store credit exists
      const existingCredit = await queryOne<{ id: number; balance: string }>(
        `SELECT id, balance FROM store_credits WHERE store_id = $1 AND customer_id = $2`,
        [user.store_id, returnItem.customer_id]
      );

      if (existingCredit) {
        // Update existing credit
        const newBalance = parseFloat(existingCredit.balance) + refundAmount;
        await query(
          `UPDATE store_credits SET balance = $1, updated_at = now() WHERE id = $2`,
          [newBalance, existingCredit.id]
        );

        // Create transaction record
        await query(
          `INSERT INTO store_credit_transactions (store_credit_id, order_id, amount, transaction_type, description)
           VALUES ($1, $2, $3, 'refunded', $4)`,
          [
            existingCredit.id,
            returnItem.order_id,
            refundAmount,
            `החזרה מאושרת עבור הזמנה #${returnItem.order_id}`,
          ]
        );
      } else {
        // Create new store credit
        const newCredit = await queryOne<{ id: number }>(
          `INSERT INTO store_credits (store_id, customer_id, balance, currency, created_at, updated_at)
           VALUES ($1, $2, $3, 'ILS', now(), now())
           RETURNING id`,
          [user.store_id, returnItem.customer_id, refundAmount]
        );

        if (newCredit) {
          // Create transaction record
          await query(
            `INSERT INTO store_credit_transactions (store_credit_id, order_id, amount, transaction_type, description)
             VALUES ($1, $2, $3, 'refunded', $4)`,
            [
              newCredit.id,
              returnItem.order_id,
              refundAmount,
              `החזרה מאושרת עבור הזמנה #${returnItem.order_id}`,
            ]
          );
        }
      }
    }

    // Update return status
    const updateFields: string[] = [];
    const updateParams: any[] = [];
    let paramIndex = 1;

    updateFields.push(`status = $${paramIndex++}`);
    updateParams.push(data.status);

    if (data.refundAmount !== undefined) {
      updateFields.push(`refund_amount = $${paramIndex++}`);
      updateParams.push(data.refundAmount);
    }

    if (data.refundMethod !== undefined) {
      updateFields.push(`refund_method = $${paramIndex++}`);
      updateParams.push(data.refundMethod);
    }

    if (data.notes !== undefined) {
      updateFields.push(`notes = $${paramIndex++}`);
      updateParams.push(data.notes);
    }

    updateFields.push(`updated_at = now()`);
    updateParams.push(returnId, user.store_id);

    await query(
      `UPDATE returns SET ${updateFields.join(', ')} WHERE id = $${paramIndex++} AND store_id = $${paramIndex++}`,
      updateParams
    );

    // Create event for return status change
    await query(
      `INSERT INTO store_events (store_id, event_type, entity_type, entity_id, payload, created_at)
       VALUES ($1, $2, $3, $4, $5, now())`,
      [
        user.store_id,
        'return.updated',
        'return',
        returnId,
        JSON.stringify({
          returnId,
          status: data.status,
          refundAmount: data.refundAmount,
          refundMethod: data.refundMethod,
        }),
      ]
    );

    // Fetch updated return
    const updatedReturn = await queryOne<any>(
      `SELECT 
        r.*,
        o.order_number,
        o.order_name,
        o.total_price as order_total,
        c.first_name || ' ' || COALESCE(c.last_name, '') as customer_name,
        c.email as customer_email
      FROM returns r
      JOIN orders o ON r.order_id = o.id
      LEFT JOIN customers c ON r.customer_id = c.id
      WHERE r.id = $1 AND r.store_id = $2`,
      [returnId, user.store_id]
    );

    return NextResponse.json({
      id: updatedReturn.id,
      orderId: updatedReturn.order_id,
      orderNumber: updatedReturn.order_number,
      orderName: updatedReturn.order_name,
      orderTotal: parseFloat(updatedReturn.order_total),
      customerId: updatedReturn.customer_id,
      customerName: updatedReturn.customer_name,
      customerEmail: updatedReturn.customer_email,
      status: updatedReturn.status,
      reason: updatedReturn.reason,
      items: typeof updatedReturn.items === 'string' ? JSON.parse(updatedReturn.items) : updatedReturn.items,
      refundAmount: updatedReturn.refund_amount ? parseFloat(updatedReturn.refund_amount) : null,
      refundMethod: updatedReturn.refund_method,
      notes: updatedReturn.notes,
      createdAt: updatedReturn.created_at,
      updatedAt: updatedReturn.updated_at,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Error updating return:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update return' },
      { status: 500 }
    );
  }
}

