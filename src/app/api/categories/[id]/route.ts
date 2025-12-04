import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/categories/:id - Get category details
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
    const categoryId = parseInt(id);
    const category = await queryOne<{
      id: number;
      title: string;
      handle: string;
      description: string | null;
      image_url: string | null;
    }>(
      'SELECT id, title, handle, description, image_url FROM product_collections WHERE id = $1 AND store_id = $2',
      [categoryId, user.store_id]
    );

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({
      category: {
        id: category.id,
        name: category.title,
        handle: category.handle,
        description: category.description,
        image_url: category.image_url,
      },
    });
  } catch (error: any) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

// PUT /api/categories/:id - Update category
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
    const categoryId = parseInt(id);
    const body = await request.json();
    const { name, description = null, imageUrl = null } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    // Generate handle from name if not provided
    let handle = body.handle;
    if (!handle) {
      handle = name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\u0590-\u05ffa-z0-9-]/g, '')
        .substring(0, 200);
    }

    // Check if handle exists (excluding current category)
    const existingResult = await query(
      'SELECT id FROM product_collections WHERE store_id = $1 AND handle = $2 AND id != $3',
      [user.store_id, handle, categoryId]
    );

    if (existingResult.length > 0) {
      handle = `${handle}-${Math.random().toString(36).substr(2, 6)}`;
    }

    const result = await query(
      `UPDATE product_collections 
       SET title = $1, handle = $2, description = $3, image_url = $4, updated_at = NOW()
       WHERE id = $5 AND store_id = $6
       RETURNING id, title as name, handle, description, image_url`,
      [name, handle, description, imageUrl, categoryId, user.store_id]
    );

    if (result.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const category = result[0];

    // Emit event
    await eventBus.emitEvent('category.updated', {
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

    return NextResponse.json({ category });
  } catch (error: any) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/:id - Delete category
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
    const categoryId = parseInt(id);

    // Get category before deletion for event
    const category = await queryOne<{
      id: number;
      title: string;
      handle: string;
    }>(
      'SELECT id, title, handle FROM product_collections WHERE id = $1 AND store_id = $2',
      [categoryId, user.store_id]
    );

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    await query(
      'DELETE FROM product_collections WHERE id = $1 AND store_id = $2',
      [categoryId, user.store_id]
    );

    // Emit event
    await eventBus.emitEvent('category.deleted', {
      category_id: categoryId,
    }, {
      store_id: user.store_id,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete category' },
      { status: 500 }
    );
  }
}

