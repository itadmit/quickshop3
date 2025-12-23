import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { quickshopList, quickshopItem } from '@/lib/utils/apiFormatter';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/reviews - List all product reviews
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const storeId = user.store_id;
    const productId = searchParams.get('product_id');
    const customerId = searchParams.get('customer_id');
    const isApproved = searchParams.get('is_approved');
    const isPublished = searchParams.get('is_published');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let sql = `SELECT * FROM product_reviews WHERE store_id = $1`;
    const params: any[] = [storeId];
    let paramIndex = 2;

    if (productId) {
      sql += ` AND product_id = $${paramIndex}`;
      params.push(parseInt(productId));
      paramIndex++;
    }

    if (customerId) {
      sql += ` AND customer_id = $${paramIndex}`;
      params.push(parseInt(customerId));
      paramIndex++;
    }

    if (isApproved !== null) {
      sql += ` AND is_approved = $${paramIndex}`;
      params.push(isApproved === 'true');
      paramIndex++;
    }

    if (isPublished !== null) {
      sql += ` AND is_published = $${paramIndex}`;
      params.push(isPublished === 'true');
      paramIndex++;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const reviews = await query(sql, params);

    return NextResponse.json(quickshopList('reviews', reviews));
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Create product review
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const storeId = user.store_id;
    const {
      product_id,
      customer_id,
      order_id,
      rating,
      title,
      review_text,
      reviewer_name,
      reviewer_email,
      is_verified_purchase = false,
      is_approved = true,  // ברירת מחדל: מאושר (מהדשבורד)
      is_published = true, // ברירת מחדל: מפורסם (מהדשבורד)
    } = body;

    if (!product_id || !rating) {
      return NextResponse.json({ error: 'product_id and rating are required' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'rating must be between 1 and 5' }, { status: 400 });
    }

    const review = await queryOne(
      `INSERT INTO product_reviews (
        store_id, product_id, customer_id, order_id, rating, title, review_text,
        reviewer_name, reviewer_email, is_verified_purchase, is_approved, is_published, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now(), now())
      RETURNING *`,
      [
        storeId,
        product_id,
        customer_id || null,
        order_id || null,
        rating,
        title || null,
        review_text || null,
        reviewer_name || null,
        reviewer_email || null,
        is_verified_purchase,
        is_approved,
        is_published,
      ]
    );

    await eventBus.emitEvent('review.created', {
      review: review,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json(quickshopItem('review', review));
  } catch (error: any) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create review' },
      { status: 500 }
    );
  }
}

