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
    const storeId = user.store_id;
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;
    const search = searchParams.get('search');
    const isPublished = searchParams.get('is_published');

    // Build WHERE clause
    let sql = 'SELECT * FROM pages WHERE store_id = $1';
    const params: any[] = [storeId];
    let paramIndex = 2;

    if (search) {
      sql += ` AND (title ILIKE $${paramIndex} OR handle ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (isPublished !== null) {
      sql += ` AND is_published = $${paramIndex}`;
      params.push(isPublished === 'true');
      paramIndex++;
    }

    // Get total count for pagination
    let countSql = 'SELECT COUNT(*) as total FROM pages WHERE store_id = $1';
    const countParams: any[] = [storeId];
    let countParamIndex = 2;

    if (search) {
      countSql += ` AND (title ILIKE $${countParamIndex} OR handle ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (isPublished !== null) {
      countSql += ` AND is_published = $${countParamIndex}`;
      countParams.push(isPublished === 'true');
      countParamIndex++;
    }

    const totalResult = await queryOne<{ total: string }>(countSql, countParams);
    const total = parseInt(totalResult?.total || '0');
    const totalPages = Math.ceil(total / limit);

    // Apply pagination
    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const pages = await query<Page>(sql, params);

    return NextResponse.json({ 
      pages,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
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

