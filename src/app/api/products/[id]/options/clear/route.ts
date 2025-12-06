import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// POST /api/products/[id]/options/clear - Clear all product options
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

    // Verify product exists and belongs to user's store
    const product = await queryOne<{ id: number }>(
      'SELECT id FROM products WHERE id = $1 AND store_id = $2',
      [productId, user.store_id]
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

