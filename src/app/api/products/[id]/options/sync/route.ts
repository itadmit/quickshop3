import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { ProductOption, ProductOptionValue } from '@/types/product';

// POST /api/products/[id]/options/sync - Sync product options
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    const body = await request.json();
    const { options } = body;

    // Verify product exists
    const product = await queryOne(
      'SELECT store_id FROM products WHERE id = $1',
      [productId]
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
      
      // Insert option
      const optionResult = await queryOne<{ id: number }>(
        `INSERT INTO product_options (product_id, name, position, created_at)
         VALUES ($1, $2, $3, now())
         RETURNING id`,
        [productId, option.name, i + 1]
      );

      if (!optionResult) continue;

      const optionId = optionResult.id;

      // Insert option values
      if (option.values && option.values.length > 0) {
        for (let j = 0; j < option.values.length; j++) {
          const value = option.values[j];
          await query(
            `INSERT INTO product_option_values (option_id, value, position, created_at)
             VALUES ($1, $2, $3, now())`,
            [optionId, value.name || value, j + 1]
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

