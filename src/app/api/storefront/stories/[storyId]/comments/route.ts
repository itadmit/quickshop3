// API Route for story comments
import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { cookies } from 'next/headers';

interface RouteParams {
  params: Promise<{ storyId: string }>;
}

interface Comment {
  id: number;
  author_name: string;
  content: string;
  created_at: string;
}

/**
 * GET /api/storefront/stories/[storyId]/comments - Get comments for a story
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { storyId } = await params;

    if (!storyId) {
      return NextResponse.json(
        { error: 'Story ID is required' },
        { status: 400 }
      );
    }

    const comments = await query<Comment>(
      `SELECT 
        sc.id,
        COALESCE(sc.author_name, c.first_name, 'אנונימי') as author_name,
        sc.content,
        sc.created_at
      FROM story_comments sc
      LEFT JOIN customers c ON c.id = sc.customer_id
      WHERE sc.story_id = $1 AND sc.is_approved = true AND sc.is_visible = true
      ORDER BY sc.created_at DESC
      LIMIT 50`,
      [storyId]
    );

    return NextResponse.json({ comments });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/storefront/stories/[storyId]/comments - Add comment to a story
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { storyId } = await params;
    const body = await request.json();
    const { content, authorName } = body;

    if (!storyId) {
      return NextResponse.json(
        { error: 'Story ID is required' },
        { status: 400 }
      );
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Verify story exists and get store settings
    const story = await queryOne<{ id: number; store_id: number }>(
      `SELECT id, store_id FROM product_stories WHERE id = $1`,
      [storyId]
    );

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    // Check if comments are allowed
    const settings = await queryOne(
      `SELECT allow_comments FROM story_settings WHERE store_id = $1`,
      [story.store_id]
    );

    if (!settings?.allow_comments) {
      return NextResponse.json(
        { error: 'Comments are disabled' },
        { status: 403 }
      );
    }

    // Get customer ID if logged in
    const cookieStore = await cookies();
    const customerId = cookieStore.get('customer_id')?.value;

    // Insert comment (requires approval by default)
    const comment = await queryOne<Comment>(
      `INSERT INTO story_comments (story_id, customer_id, author_name, content, is_approved)
       VALUES ($1, $2, $3, $4, false)
       RETURNING id, author_name, content, created_at`,
      [storyId, customerId || null, authorName || null, content.trim()]
    );

    return NextResponse.json({
      success: true,
      comment,
      message: 'התגובה נשלחה לאישור',
    });
  } catch (error: any) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add comment' },
      { status: 500 }
    );
  }
}

