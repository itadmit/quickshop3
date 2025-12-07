import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { eventBus } from '@/lib/events/eventBus';
import { quickshopList, quickshopItem } from '@/lib/utils/apiFormatter';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/categories - Get all categories for a shop
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let sql = `SELECT id, title as name, handle, description, image_url, published_at, 
                      parent_id, type, rules, is_published
               FROM product_collections
               WHERE store_id = $1`;
    const params: any[] = [user.store_id];
    let paramIndex = 2;

    if (search) {
      sql += ` AND (title ILIKE $${paramIndex} OR handle ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    sql += ` ORDER BY title ASC`;

    const collections = await query(sql, params);

    return NextResponse.json(quickshopList('collections', collections));
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create a new category
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description = null, imageUrl = null } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    // Generate handle from name
    const handle = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\u0590-\u05ffa-z0-9-]/g, '')
      .substring(0, 200);

    // Check if handle exists
    const existingResult = await query(
      'SELECT id FROM product_collections WHERE store_id = $1 AND handle = $2',
      [user.store_id, handle]
    );

    let finalHandle = handle;
    if (existingResult.length > 0) {
      // Add random suffix if handle exists
      finalHandle = `${handle}-${Math.random().toString(36).substr(2, 6)}`;
    }

    const result = await query(
      `INSERT INTO product_collections (store_id, title, handle, description, image_url, published_at, published_scope, sort_order, type, is_published)
       VALUES ($1, $2, $3, $4, $5, NOW(), 'web', 'manual', 'MANUAL', true)
       RETURNING id, title as name, handle, description, image_url`,
      [user.store_id, name, finalHandle, description, imageUrl]
    );

    const category = result[0];

    // Emit event
    await eventBus.emitEvent('category.created', {
      category: {
        id: category.id,
        name: category.name,
        handle: category.handle,
      },
    }, {
      store_id: user.store_id,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json(
      quickshopItem('category', category),
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create category' },
      { status: 500 }
    );
  }
}

