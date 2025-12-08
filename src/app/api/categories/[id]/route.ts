import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { eventBus } from '@/lib/events/eventBus';
import { quickshopItem } from '@/lib/utils/apiFormatter';
import { generateSlugFromHebrew } from '@/lib/utils/hebrewSlug';
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

    return NextResponse.json(quickshopItem('category', {
      id: category.id,
      title: category.title,
      handle: category.handle,
      description: category.description,
      image_url: category.image_url,
    }));
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
    const { title, name, handle: providedHandle, description = null, imageUrl = null, image_url = null } = body;

    // Support both 'name' and 'title' for backward compatibility
    const categoryTitle = title || name;
    
    if (!categoryTitle) {
      return NextResponse.json(
        { error: 'title is required' },
        { status: 400 }
      );
    }

    // Generate handle from title if not provided using Hebrew transliteration
    let finalHandle = providedHandle;
    if (!finalHandle) {
      let baseHandle = generateSlugFromHebrew(categoryTitle);
      
      // Limit length
      if (baseHandle.length > 200) {
        baseHandle = baseHandle.substring(0, 200);
      }

      // Check if handle exists (excluding current category)
      let counter = 1;
      finalHandle = baseHandle;
      
      while (true) {
        const existingResult = await query(
          'SELECT id FROM product_collections WHERE store_id = $1 AND handle = $2 AND id != $3',
          [user.store_id, finalHandle, categoryId]
        );

        if (existingResult.length === 0) {
          break; // Handle is unique
        }

        // Add counter suffix if handle exists
        finalHandle = `${baseHandle}-${counter}`;
        counter++;
      }
    } else {
      // If handle is provided, check uniqueness
      const existingResult = await query(
        'SELECT id FROM product_collections WHERE store_id = $1 AND handle = $2 AND id != $3',
        [user.store_id, finalHandle, categoryId]
      );

      if (existingResult.length > 0) {
        return NextResponse.json(
          { error: 'Handle already exists' },
          { status: 400 }
        );
      }
    }

    const finalImageUrl = imageUrl || image_url;

    const result = await query(
      `UPDATE product_collections 
       SET title = $1, handle = $2, description = $3, image_url = $4, updated_at = NOW()
       WHERE id = $5 AND store_id = $6
       RETURNING id, title, handle, description, image_url`,
      [categoryTitle, finalHandle, description, finalImageUrl, categoryId, user.store_id]
    );

    if (result.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const category = result[0];

    // Emit event
    await eventBus.emitEvent('category.updated', {
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

    return NextResponse.json(quickshopItem('category', category));
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

