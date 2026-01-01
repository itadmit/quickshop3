// API Routes for Story Comments Management (Dashboard)
import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

interface StoryComment {
  id: number;
  story_id: number;
  customer_id: number | null;
  author_name: string;
  content: string;
  is_approved: boolean;
  is_visible: boolean;
  created_at: string;
  product_title: string;
  product_handle: string;
}

/**
 * GET /api/stories/comments - Get all comments for store's stories
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'pending' | 'approved' | 'all'

    let statusFilter = '';
    if (status === 'pending') {
      statusFilter = 'AND sc.is_approved = false';
    } else if (status === 'approved') {
      statusFilter = 'AND sc.is_approved = true';
    }

    const comments = await query<StoryComment>(
      `SELECT 
        sc.id,
        sc.story_id,
        sc.customer_id,
        COALESCE(sc.author_name, c.first_name, 'אנונימי') as author_name,
        sc.content,
        sc.is_approved,
        sc.is_visible,
        sc.created_at,
        p.title as product_title,
        p.handle as product_handle
      FROM story_comments sc
      JOIN product_stories ps ON ps.id = sc.story_id
      JOIN products p ON p.id = ps.product_id
      LEFT JOIN customers c ON c.id = sc.customer_id
      WHERE ps.store_id = $1 ${statusFilter}
      ORDER BY sc.created_at DESC`,
      [storeId]
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
 * PUT /api/stories/comments - Update comment (approve/reject)
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;
    const body = await request.json();
    const { commentId, isApproved, isVisible } = body;

    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      );
    }

    // Verify comment belongs to store
    const comment = await queryOne(
      `SELECT sc.id FROM story_comments sc
       JOIN product_stories ps ON ps.id = sc.story_id
       WHERE sc.id = $1 AND ps.store_id = $2`,
      [commentId, storeId]
    );

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Update comment
    await query(
      `UPDATE story_comments 
       SET is_approved = COALESCE($1, is_approved),
           is_visible = COALESCE($2, is_visible)
       WHERE id = $3`,
      [isApproved, isVisible, commentId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update comment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/stories/comments - Delete comment
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');

    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      );
    }

    // Verify comment belongs to store
    const comment = await queryOne(
      `SELECT sc.id FROM story_comments sc
       JOIN product_stories ps ON ps.id = sc.story_id
       WHERE sc.id = $1 AND ps.store_id = $2`,
      [commentId, storeId]
    );

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    await query(`DELETE FROM story_comments WHERE id = $1`, [commentId]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete comment' },
      { status: 500 }
    );
  }
}

