import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Page, CreatePageRequest } from '@/types/content';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';
import { generateUniqueSlug } from '@/lib/utils/slug';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/pages/:id - Get page
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
    const pageId = parseInt(id);
    const page = await queryOne<Page>(
      'SELECT * FROM pages WHERE id = $1 AND store_id = $2',
      [pageId, user.store_id]
    );

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json({ page });
  } catch (error: any) {
    console.error('Error fetching page:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch page' },
      { status: 500 }
    );
  }
}

// PUT /api/pages/:id - Update page
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
    const pageId = parseInt(id);
    const body: CreatePageRequest = await request.json();

    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Get existing page
    const oldPage = await queryOne<Page>(
      'SELECT * FROM pages WHERE id = $1 AND store_id = $2',
      [pageId, user.store_id]
    );

    if (!oldPage) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Generate handle if not provided or if title changed
    let handle = body.handle;
    if (!handle || (body.title && body.title !== oldPage.title)) {
      handle = await generateUniqueSlug(body.title, 'pages', user.store_id, pageId);
    }

    const page = await queryOne<Page>(
      `UPDATE pages 
       SET title = $1, handle = $2, body_html = $3, meta_title = $4, 
           meta_description = $5, is_published = $6, updated_at = now()
       WHERE id = $7 AND store_id = $8
       RETURNING *`,
      [
        body.title,
        handle,
        body.body_html || null,
        body.meta_title || null,
        body.meta_description || null,
        body.is_published !== undefined ? body.is_published : false,
        pageId,
        user.store_id,
      ]
    );

    if (!page) {
      return NextResponse.json({ error: 'Failed to update page' }, { status: 500 });
    }

    // Emit event
    await eventBus.emitEvent('page.updated', {
      page: {
        id: page.id,
        title: page.title,
        handle: page.handle,
      },
    }, {
      store_id: user.store_id,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ page });
  } catch (error: any) {
    console.error('Error updating page:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update page' },
      { status: 500 }
    );
  }
}

// DELETE /api/pages/:id - Delete page
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
    const pageId = parseInt(id);

    const page = await queryOne<Page>(
      'SELECT * FROM pages WHERE id = $1 AND store_id = $2',
      [pageId, user.store_id]
    );

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    await query(
      'DELETE FROM pages WHERE id = $1 AND store_id = $2',
      [pageId, user.store_id]
    );

    // Emit event
    await eventBus.emitEvent('page.deleted', {
      page: {
        id: page.id,
        title: page.title,
        handle: page.handle,
      },
    }, {
      store_id: user.store_id,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting page:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete page' },
      { status: 500 }
    );
  }
}
