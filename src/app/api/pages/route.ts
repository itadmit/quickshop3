import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Page, CreatePageRequest } from '@/types/content';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';
import { generateUniqueSlug } from '@/lib/utils/slug';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/pages - List all pages
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const isPublished = searchParams.get('is_published');

    let sql = 'SELECT * FROM pages WHERE store_id = $1';
    const params: any[] = [user.store_id];

    if (isPublished !== null) {
      sql += ' AND is_published = $2';
      params.push(isPublished === 'true');
    }

    sql += ' ORDER BY created_at DESC';

    const pages = await query<Page>(sql, params);

    return NextResponse.json({ pages });
  } catch (error: any) {
    console.error('Error fetching pages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pages' },
      { status: 500 }
    );
  }
}

// POST /api/pages - Create page
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreatePageRequest = await request.json();
    const storeId = user.store_id;

    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Generate handle if not provided
    const handle = body.handle || await generateUniqueSlug(body.title, 'pages', user.store_id);

    const page = await queryOne<Page>(
      `INSERT INTO pages (
        store_id, title, handle, body_html, meta_title, meta_description,
        is_published, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())
      RETURNING *`,
      [
        storeId,
        body.title,
        handle,
        body.body_html || null,
        body.meta_title || null,
        body.meta_description || null,
        body.is_published !== undefined ? body.is_published : false,
      ]
    );

    if (!page) {
      throw new Error('Failed to create page');
    }

    // Emit event
    await eventBus.emitEvent('page.created', {
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

    return NextResponse.json({ page }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating page:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create page' },
      { status: 500 }
    );
  }
}

