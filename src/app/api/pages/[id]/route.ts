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

    const template = body.template !== undefined ? body.template : oldPage.template;
    const displayType = template === 'CHOICES_OF' ? (body.display_type || oldPage.display_type || 'GRID') : null;
    const selectedProducts = template === 'CHOICES_OF' && body.selected_products !== undefined ? body.selected_products : (template === 'CHOICES_OF' ? oldPage.selected_products : null);

    const page = await queryOne<Page>(
      `UPDATE pages 
       SET title = $1, handle = $2, body_html = $3, template = $4, display_type = $5,
           selected_products = $6, coupon_code = $7, influencer_id = $8,
           meta_title = $9, meta_description = $10, is_published = $11, updated_at = now()
       WHERE id = $12 AND store_id = $13
       RETURNING *`,
      [
        body.title,
        handle,
        body.body_html !== undefined ? body.body_html : oldPage.body_html,
        template,
        displayType,
        selectedProducts,
        body.coupon_code !== undefined ? body.coupon_code : oldPage.coupon_code,
        body.influencer_id !== undefined ? body.influencer_id : oldPage.influencer_id,
        body.meta_title !== undefined ? body.meta_title : oldPage.meta_title,
        body.meta_description !== undefined ? body.meta_description : oldPage.meta_description,
        body.is_published !== undefined ? body.is_published : oldPage.is_published,
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
