import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { quickshopItem } from '@/lib/utils/apiFormatter';
// Initialize event listeners
import '@/lib/events/listeners';

// PUT /api/navigation/:id/items/:itemId - Update menu item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, itemId } = await params;
    const menuId = parseInt(id);
    const itemIdNum = parseInt(itemId);
    const storeId = user.store_id;
    const body = await request.json();

    // Verify menu exists
    const menu = await queryOne(
      `SELECT * FROM navigation_menus WHERE id = $1 AND store_id = $2`,
      [menuId, storeId]
    );

    if (!menu) {
      return NextResponse.json({ error: 'Navigation menu not found' }, { status: 404 });
    }

    const existingItem = await queryOne(
      `SELECT * FROM navigation_menu_items WHERE id = $1 AND menu_id = $2`,
      [itemIdNum, menuId]
    );

    if (!existingItem) {
      return NextResponse.json({ error: 'Navigation menu item not found' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // תמיכה גם ב-label וגם ב-title
    if (body.title !== undefined || body.label !== undefined) {
      const titleValue = body.title !== undefined ? body.title : body.label;
      updates.push(`title = $${paramIndex}`);
      values.push(titleValue);
      paramIndex++;
    }

    if (body.url !== undefined) {
      updates.push(`url = $${paramIndex}`);
      values.push(body.url);
      paramIndex++;
    }

    if (body.type !== undefined) {
      updates.push(`type = $${paramIndex}`);
      values.push(body.type);
      paramIndex++;
    }

    if (body.resource_id !== undefined) {
      updates.push(`resource_id = $${paramIndex}`);
      values.push(body.resource_id);
      paramIndex++;
    }

    if (body.parent_id !== undefined) {
      updates.push(`parent_id = $${paramIndex}`);
      values.push(body.parent_id);
      paramIndex++;
    }

    if (body.position !== undefined) {
      updates.push(`position = $${paramIndex}`);
      values.push(body.position);
      paramIndex++;
    }

    if (body.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      values.push(body.is_active);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json(quickshopItem('navigation_menu_item', existingItem));
    }

    values.push(itemIdNum, menuId);

    const item = await queryOne(
      `UPDATE navigation_menu_items 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND menu_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    return NextResponse.json(quickshopItem('navigation_menu_item', item));
  } catch (error: any) {
    console.error('Error updating navigation menu item:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update navigation menu item' },
      { status: 500 }
    );
  }
}

// DELETE /api/navigation/:id/items/:itemId - Delete menu item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, itemId } = await params;
    const menuId = parseInt(id);
    const itemIdNum = parseInt(itemId);
    const storeId = user.store_id;

    // Verify menu exists
    const menu = await queryOne(
      `SELECT * FROM navigation_menus WHERE id = $1 AND store_id = $2`,
      [menuId, storeId]
    );

    if (!menu) {
      return NextResponse.json({ error: 'Navigation menu not found' }, { status: 404 });
    }

    await query(
      `DELETE FROM navigation_menu_items WHERE id = $1 AND menu_id = $2`,
      [itemIdNum, menuId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting navigation menu item:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete navigation menu item' },
      { status: 500 }
    );
  }
}

