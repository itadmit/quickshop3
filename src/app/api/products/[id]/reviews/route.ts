import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/products/:id/reviews - Get all reviews for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    // טעינת כל הביקורות המאושרות והמפורסמות של המוצר
    const reviews = await query<{
      id: number;
      product_id: number;
      customer_name: string;
      rating: number;
      title: string | null;
      content: string;
      is_approved: boolean;
      is_published: boolean;
      created_at: Date;
    }>(
      `SELECT 
        id, 
        product_id, 
        COALESCE(reviewer_name, 'לקוח מאומת') as customer_name, 
        rating, 
        title, 
        review_text as content, 
        is_approved,
        is_published,
        created_at
       FROM product_reviews
       WHERE product_id = $1 AND is_approved = true AND is_published = true
       ORDER BY created_at DESC`,
      [productId]
    );

    // חישוב ממוצע דירוג
    let averageRating = 0;
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
      averageRating = sum / reviews.length;
    }

    return NextResponse.json({
      reviews,
      average_rating: averageRating,
      total_reviews: reviews.length,
    });
  } catch (error: any) {
    console.error('Error fetching product reviews:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product reviews' },
      { status: 500 }
    );
  }
}
