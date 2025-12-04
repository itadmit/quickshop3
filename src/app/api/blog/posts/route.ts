import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { BlogPost, CreateBlogPostRequest } from '@/types/content';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';
import { generateUniqueSlug } from '@/lib/utils/slug';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/blog/posts - List all blog posts
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const isPublished = searchParams.get('is_published');

    let sql = 'SELECT * FROM blog_posts WHERE store_id = $1';
    const params: any[] = [user.store_id];

    if (isPublished !== null) {
      sql += ' AND is_published = $2';
      params.push(isPublished === 'true');
    }

    sql += ' ORDER BY created_at DESC';

    const posts = await query<BlogPost>(sql, params);

    return NextResponse.json({ posts });
  } catch (error: any) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}

// POST /api/blog/posts - Create blog post
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateBlogPostRequest = await request.json();
    const storeId = user.store_id;

    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Generate handle if not provided
    const handle = body.handle || await generateUniqueSlug(body.title, 'blog_posts', user.store_id);

    const post = await queryOne<BlogPost>(
      `INSERT INTO blog_posts (
        store_id, title, handle, body_html, excerpt, tags,
        meta_title, meta_description, featured_image_url,
        is_published, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), now())
      RETURNING *`,
      [
        storeId,
        body.title,
        handle,
        body.body_html || null,
        body.excerpt || null,
        body.tags || null,
        body.meta_title || null,
        body.meta_description || null,
        body.featured_image_url || null,
        body.is_published !== undefined ? body.is_published : false,
      ]
    );

    if (!post) {
      throw new Error('Failed to create blog post');
    }

    // Emit event
    await eventBus.emitEvent('blog.post.created', {
      post: {
        id: post.id,
        title: post.title,
        handle: post.handle,
      },
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating blog post:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create blog post' },
      { status: 500 }
    );
  }
}

