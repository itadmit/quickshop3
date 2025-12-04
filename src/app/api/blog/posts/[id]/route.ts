import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { BlogPost, CreateBlogPostRequest } from '@/types/content';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';
import { generateUniqueSlug } from '@/lib/utils/slug';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/blog/posts/:id - Get blog post
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
    const postId = parseInt(id);
    const post = await queryOne<BlogPost>(
      'SELECT * FROM blog_posts WHERE id = $1 AND store_id = $2',
      [postId, user.store_id]
    );

    if (!post) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error: any) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch blog post' },
      { status: 500 }
    );
  }
}

// PUT /api/blog/posts/:id - Update blog post
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
    const postId = parseInt(id);
    const body: CreateBlogPostRequest = await request.json();

    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Get existing post
    const oldPost = await queryOne<BlogPost>(
      'SELECT * FROM blog_posts WHERE id = $1 AND store_id = $2',
      [postId, user.store_id]
    );

    if (!oldPost) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    // Generate handle if not provided or if title changed
    let handle = body.handle;
    if (!handle || (body.title && body.title !== oldPost.title)) {
      handle = await generateUniqueSlug(body.title, 'blog_posts', user.store_id, postId);
    }

    const post = await queryOne<BlogPost>(
      `UPDATE blog_posts 
       SET title = $1, handle = $2, body_html = $3, excerpt = $4, tags = $5,
           meta_title = $6, meta_description = $7, featured_image_url = $8,
           is_published = $9, updated_at = now()
       WHERE id = $10 AND store_id = $11
       RETURNING *`,
      [
        body.title,
        handle,
        body.body_html || null,
        body.excerpt || null,
        body.tags || null,
        body.meta_title || null,
        body.meta_description || null,
        body.featured_image_url || null,
        body.is_published !== undefined ? body.is_published : false,
        postId,
        user.store_id,
      ]
    );

    if (!post) {
      return NextResponse.json({ error: 'Failed to update blog post' }, { status: 500 });
    }

    // Emit event
    await eventBus.emitEvent('blog.post.updated', {
      post: {
        id: post.id,
        title: post.title,
        handle: post.handle,
      },
    }, {
      store_id: user.store_id,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ post });
  } catch (error: any) {
    console.error('Error updating blog post:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update blog post' },
      { status: 500 }
    );
  }
}

// DELETE /api/blog/posts/:id - Delete blog post
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
    const postId = parseInt(id);

    const post = await queryOne<BlogPost>(
      'SELECT * FROM blog_posts WHERE id = $1 AND store_id = $2',
      [postId, user.store_id]
    );

    if (!post) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    await query(
      'DELETE FROM blog_posts WHERE id = $1 AND store_id = $2',
      [postId, user.store_id]
    );

    // Emit event
    await eventBus.emitEvent('blog.post.deleted', {
      post: {
        id: post.id,
        title: post.title,
        handle: post.handle,
      },
    }, {
      store_id: user.store_id,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete blog post' },
      { status: 500 }
    );
  }
}
