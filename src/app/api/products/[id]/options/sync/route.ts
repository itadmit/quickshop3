import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { ProductOption, ProductOptionValue } from '@/types/product';
import { getUserFromRequest } from '@/lib/auth';

// POST /api/products/[id]/options/sync - Sync product options
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
    const { options } = body;

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

    // Delete all existing options and their values
    await query('DELETE FROM product_option_values WHERE option_id IN (SELECT id FROM product_options WHERE product_id = $1)', [productId]);
    await query('DELETE FROM product_options WHERE product_id = $1', [productId]);

    // Insert new options
    const insertedOptions = [];
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      
      // Insert option with type
      const optionResult = await queryOne<{ id: number }>(
        `INSERT INTO product_options (product_id, name, type, position, created_at)
         VALUES ($1, $2, $3, $4, now())
         RETURNING id`,
        [productId, option.name, option.type || 'button', i + 1]
      );

      if (!optionResult) continue;

      const optionId = optionResult.id;

      // Insert option values
      if (option.values && option.values.length > 0) {
        for (let j = 0; j < option.values.length; j++) {
          const val = option.values[j];
          // Handle value as string or object with value/name property
          const valueStr = typeof val === 'string' 
            ? val 
            : (val.value || val.name || String(val));
          await query(
            `INSERT INTO product_option_values (option_id, value, position, created_at)
             VALUES ($1, $2, $3, now())`,
            [optionId, valueStr, j + 1]
          );
        }
      }

      insertedOptions.push({
        id: optionId,
        name: option.name,
        position: i + 1,
        values: option.values || [],
      });
    }

    return NextResponse.json({
      success: true,
      options: insertedOptions,
    });
  } catch (error: any) {
    console.error('Error syncing options:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync options' },
      { status: 500 }
    );
  }
}

