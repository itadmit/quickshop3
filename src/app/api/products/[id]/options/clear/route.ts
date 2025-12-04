import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

// POST /api/products/[id]/options/clear - Clear all product options
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    // Verify product exists
    const product = await queryOne(
      'SELECT id FROM products WHERE id = $1',
      [productId]
    );

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Delete all option values first (foreign key constraint)
    await query(
      'DELETE FROM product_option_values WHERE option_id IN (SELECT id FROM product_options WHERE product_id = $1)',
      [productId]
    );

    // Delete all options
    await query('DELETE FROM product_options WHERE product_id = $1', [productId]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error clearing options:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to clear options' },
      { status: 500 }
    );
  }
}

