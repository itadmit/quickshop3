import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/products/[id]/reviews
 * Returns approved reviews for a product (public endpoint for storefront)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id, 10);
    
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    // Get approved and published reviews for this product
    const reviews = await query(
      `SELECT pr.id, pr.rating, pr.title, pr.review_text as content, pr.reviewer_name as customer_name, pr.created_at
       FROM product_reviews pr
       WHERE pr.product_id = $1 
         AND pr.is_approved = true
         AND pr.is_published = true
       ORDER BY pr.created_at DESC
       LIMIT 50`,
      [productId]
    );

    // Calculate average rating
    const avgResult = await query<{ avg: string; count: string }>(
      `SELECT AVG(rating)::numeric(3,2) as avg, COUNT(*) as count
       FROM product_reviews
       WHERE product_id = $1 AND is_approved = true AND is_published = true`,
      [productId]
    );

    const average_rating = avgResult[0]?.avg ? parseFloat(avgResult[0].avg) : 0;
    const total_count = avgResult[0]?.count ? parseInt(avgResult[0].count) : 0;

    return NextResponse.json({ 
      reviews,
      average_rating,
      total_count
    });
  } catch (error) {
    console.error('Error loading product reviews:', error);
    return NextResponse.json({ reviews: [], average_rating: 0, total_count: 0 });
  }
}

