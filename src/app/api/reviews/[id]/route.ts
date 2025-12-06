import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { quickshopItem } from '@/lib/utils/apiFormatter';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/reviews/:id - Get review details
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
    const reviewId = parseInt(id);
    const storeId = user.store_id;

    const review = await queryOne(
      `SELECT * FROM product_reviews WHERE id = $1 AND store_id = $2`,
      [reviewId, storeId]
    );

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Get helpful votes
    const helpfulVotes = await query(
      `SELECT * FROM review_helpful_votes WHERE review_id = $1`,
      [reviewId]
    );

    return NextResponse.json(quickshopItem('review', {
      ...review,
      helpful_votes: helpfulVotes,
    }));
  } catch (error: any) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch review' },
      { status: 500 }
    );
  }
}

// PUT /api/reviews/:id - Update review
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
    const reviewId = parseInt(id);
    const storeId = user.store_id;
    const body = await request.json();

    const existingReview = await queryOne(
      `SELECT * FROM product_reviews WHERE id = $1 AND store_id = $2`,
      [reviewId, storeId]
    );

    if (!existingReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (body.is_approved !== undefined) {
      updates.push(`is_approved = $${paramIndex}`);
      values.push(body.is_approved);
      paramIndex++;
    }

    if (body.is_published !== undefined) {
      updates.push(`is_published = $${paramIndex}`);
      values.push(body.is_published);
      paramIndex++;
    }

    if (body.rating !== undefined) {
      if (body.rating < 1 || body.rating > 5) {
        return NextResponse.json({ error: 'rating must be between 1 and 5' }, { status: 400 });
      }
      updates.push(`rating = $${paramIndex}`);
      values.push(body.rating);
      paramIndex++;
    }

    if (body.title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      values.push(body.title);
      paramIndex++;
    }

    if (body.review_text !== undefined) {
      updates.push(`review_text = $${paramIndex}`);
      values.push(body.review_text);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json(quickshopItem('review', existingReview));
    }

    updates.push(`updated_at = now()`);
    values.push(reviewId, storeId);

    const review = await queryOne(
      `UPDATE product_reviews 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    await eventBus.emitEvent('review.updated', {
      review: review,
      changes: body,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json(quickshopItem('review', review));
  } catch (error: any) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update review' },
      { status: 500 }
    );
  }
}

// DELETE /api/reviews/:id - Delete review
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
    const reviewId = parseInt(id);
    const storeId = user.store_id;

    const review = await queryOne(
      `SELECT * FROM product_reviews WHERE id = $1 AND store_id = $2`,
      [reviewId, storeId]
    );

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    await query(
      `DELETE FROM product_reviews WHERE id = $1 AND store_id = $2`,
      [reviewId, storeId]
    );

    await eventBus.emitEvent('review.deleted', {
      review: review,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete review' },
      { status: 500 }
    );
  }
}

