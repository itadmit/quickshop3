// API Route for liking/unliking a story
import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

interface RouteParams {
  params: Promise<{ storyId: string }>;
}

/**
 * POST /api/storefront/stories/[storyId]/like - Toggle like on story
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { storyId } = await params;

    if (!storyId) {
      return NextResponse.json(
        { error: 'Story ID is required' },
        { status: 400 }
      );
    }

    // Verify story exists
    const story = await queryOne<{ id: number; likes_count: number }>(
      `SELECT id, likes_count FROM product_stories WHERE id = $1`,
      [storyId]
    );

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    // Get session ID
    const cookieStore = await cookies();
    let sessionId = cookieStore.get('story_session')?.value;
    if (!sessionId) {
      sessionId = uuidv4();
    }

    // Get customer ID if logged in
    const customerId = cookieStore.get('customer_id')?.value;

    // Get IP address
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Check if already liked
    const existingLike = await queryOne(
      `SELECT id FROM story_likes 
       WHERE story_id = $1 AND (session_id = $2 OR customer_id = $3)`,
      [storyId, sessionId, customerId || null]
    );

    let isLiked: boolean;
    let newLikesCount: number;

    if (existingLike) {
      // Unlike
      await query(
        `DELETE FROM story_likes WHERE id = $1`,
        [existingLike.id]
      );
      isLiked = false;
      newLikesCount = story.likes_count - 1;
    } else {
      // Like
      await query(
        `INSERT INTO story_likes (story_id, customer_id, session_id, ip_address)
         VALUES ($1, $2, $3, $4)`,
        [storyId, customerId || null, sessionId, ip]
      );
      isLiked = true;
      newLikesCount = story.likes_count + 1;
    }

    const response = NextResponse.json({
      success: true,
      isLiked,
      likesCount: newLikesCount,
    });

    // Set session cookie if new
    if (!cookieStore.get('story_session')) {
      response.cookies.set('story_session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    return response;
  } catch (error: any) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to toggle like' },
      { status: 500 }
    );
  }
}

