// API Route for getting story stats for a specific product
import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

interface RouteParams {
  params: Promise<{ productId: string }>;
}

/**
 * GET /api/storefront/stories/product/[productId]/stats - Get story stats for a product
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { productId } = await params;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Get story stats for this product
    const stats = await queryOne<{
      likes_count: number;
      comments_count: number;
      views_count: number;
    }>(
      `SELECT 
        ps.likes_count,
        ps.comments_count,
        ps.views_count
      FROM product_stories ps
      WHERE ps.product_id = $1 AND ps.is_active = true`,
      [productId]
    );

    if (!stats) {
      return NextResponse.json({
        likes_count: 0,
        comments_count: 0,
        views_count: 0,
      });
    }

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error fetching story stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch story stats' },
      { status: 500 }
    );
  }
}

