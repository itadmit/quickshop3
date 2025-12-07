import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/collections - Get all collections for a store
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;
    const search = searchParams.get('search');
    const published = searchParams.get('published'); // 'true' or 'false'

    // Build WHERE clause
    let sql = `SELECT id, title, handle, description, image_url, published_at, 
                      published_scope, sort_order, created_at, updated_at
               FROM product_collections
               WHERE store_id = $1`;
    const params: any[] = [storeId];
    let paramIndex = 2;

    if (search) {
      sql += ` AND (title ILIKE $${paramIndex} OR handle ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (published === 'true') {
      sql += ` AND published_at IS NOT NULL`;
    } else if (published === 'false') {
      sql += ` AND published_at IS NULL`;
    }

    // Get total count for pagination
    let countSql = `SELECT COUNT(*) as total FROM product_collections WHERE store_id = $1`;
    const countParams: any[] = [storeId];
    let countParamIndex = 2;

    if (search) {
      countSql += ` AND (title ILIKE $${countParamIndex} OR handle ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (published === 'true') {
      countSql += ` AND published_at IS NOT NULL`;
    } else if (published === 'false') {
      countSql += ` AND published_at IS NULL`;
    }

    const totalResult = await queryOne<{ total: string }>(countSql, countParams);
    const total = parseInt(totalResult?.total || '0');
    const totalPages = Math.ceil(total / limit);

    // Apply pagination
    sql += ` ORDER BY title ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const collections = await query(sql, params);

    return NextResponse.json({ 
      collections,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error('Error fetching collections:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}

// POST /api/collections - Create a new collection
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, handle, description, image_url, published_scope, sort_order } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const storeId = user.store_id;
    
    // Generate handle from title if not provided
    let finalHandle = handle;
    if (!finalHandle) {
      finalHandle = title
        .toLowerCase()
        .trim()
        .replace(/[\u0590-\u05FF]/g, '') // Remove Hebrew characters
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
      
      if (!finalHandle) {
        finalHandle = 'collection';
      }
    }

    // Check if handle already exists and make it unique
    let uniqueHandle = finalHandle;
    let counter = 1;
    while (true) {
      const existing = await queryOne<{ id: number }>(
        'SELECT id FROM product_collections WHERE store_id = $1 AND handle = $2',
        [storeId, uniqueHandle]
      );

      if (!existing) {
        break; // Handle is unique
      }

      uniqueHandle = `${finalHandle}-${counter}`;
      counter++;
    }

    // Create collection
    const collection = await queryOne<{
      id: number;
      title: string;
      handle: string;
      description: string | null;
      image_url: string | null;
      published_at: Date | null;
      published_scope: string;
      sort_order: string;
      created_at: Date;
      updated_at: Date;
    }>(
      `INSERT INTO product_collections 
       (store_id, title, handle, description, image_url, published_scope, sort_order, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())
       RETURNING *`,
      [
        storeId,
        title.trim(),
        uniqueHandle,
        description || null,
        image_url || null,
        published_scope || 'web',
        sort_order || 'manual',
      ]
    );

    // Emit event
    await eventBus.emitEvent('collection.created', {
      collection: collection,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ 
      collection,
      message: 'Collection created successfully' 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating collection:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create collection' },
      { status: 500 }
    );
  }
}

