import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/products/tags - Get all tags for a store
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    let sql = 'SELECT * FROM product_tags WHERE store_id = $1';
    const params: any[] = [storeId];

    if (search) {
      sql += ' AND name ILIKE $2';
      params.push(`%${search}%`);
    }

    sql += ' ORDER BY name ASC';

    const tags = await query(sql, params);

    return NextResponse.json({ tags });
  } catch (error: any) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

// POST /api/products/tags - Create a new tag
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
    }

    const storeId = user.store_id;
    const tagName = name.trim();

    // Check if tag already exists
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM product_tags WHERE store_id = $1 AND name = $2',
      [storeId, tagName]
    );

    if (existing) {
      return NextResponse.json({ 
        tag: { id: existing.id, name: tagName },
        message: 'Tag already exists' 
      });
    }

    // Create tag
    const tag = await queryOne<{ id: number; name: string; created_at: Date }>(
      `INSERT INTO product_tags (store_id, name, created_at)
       VALUES ($1, $2, now())
       RETURNING id, name, created_at`,
      [storeId, tagName]
    );

    if (!tag) {
      throw new Error('Failed to create tag');
    }

    // Emit event
    await eventBus.emitEvent('product.tag.created', {
      tag: {
        id: tag.id,
        name: tag.name,
      },
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating tag:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create tag' },
      { status: 500 }
    );
  }
}

