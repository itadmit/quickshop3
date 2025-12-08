import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { eventBus } from '@/lib/events/eventBus';
import { quickshopList, quickshopItem } from '@/lib/utils/apiFormatter';
import { generateSlugFromHebrew } from '@/lib/utils/hebrewSlug';
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

    let sql = `SELECT c.id, c.title, c.handle, c.description, c.image_url, c.published_at, 
                      c.parent_id, c.type, c.rules, c.is_published,
                      p.title as parent_title
               FROM product_collections c
               LEFT JOIN product_collections p ON c.parent_id = p.id
               WHERE c.store_id = $1`;
    const params: any[] = [user.store_id];
    let paramIndex = 2;

    if (search) {
      sql += ` AND (c.title ILIKE $${paramIndex} OR c.handle ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    sql += ` ORDER BY COALESCE(c.parent_id, c.id), c.id, c.title ASC`;

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

    // Generate handle from name using Hebrew transliteration
    let baseHandle = generateSlugFromHebrew(name);
    
    // Limit length
    if (baseHandle.length > 200) {
      baseHandle = baseHandle.substring(0, 200);
    }

    // Check if handle exists
    let finalHandle = baseHandle;
    let counter = 1;
    
    while (true) {
      const existingResult = await query(
        'SELECT id FROM product_collections WHERE store_id = $1 AND handle = $2',
        [user.store_id, finalHandle]
      );

      if (existingResult.length === 0) {
        break; // Handle is unique
      }

      // Add counter suffix if handle exists
      finalHandle = `${baseHandle}-${counter}`;
      counter++;
    }

    const result = await query(
      `INSERT INTO product_collections (store_id, title, handle, description, image_url, published_at, published_scope, sort_order, type, is_published)
       VALUES ($1, $2, $3, $4, $5, NOW(), 'web', 'manual', 'MANUAL', true)
       RETURNING id, title, handle, description, image_url`,
      [user.store_id, name, finalHandle, description, imageUrl]
    );

    const category = result[0];

    // Emit event
    await eventBus.emitEvent('category.created', {
      category: {
        id: category.id,
        title: category.title,
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

