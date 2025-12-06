import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { quickshopItem } from '@/lib/utils/apiFormatter';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/navigation/:id - Get navigation menu details
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
    const menuId = parseInt(id);
    const storeId = user.store_id;

    const menu = await queryOne(
      `SELECT * FROM navigation_menus WHERE id = $1 AND store_id = $2`,
      [menuId, storeId]
    );

    if (!menu) {
      return NextResponse.json({ error: 'Navigation menu not found' }, { status: 404 });
    }

    // Get items
    const items = await query(
      `SELECT * FROM navigation_menu_items WHERE menu_id = $1 ORDER BY position`,
      [menuId]
    );

    return NextResponse.json(quickshopItem('navigation_menu', {
      ...menu,
      items,
    }));
  } catch (error: any) {
    console.error('Error fetching navigation menu:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch navigation menu' },
      { status: 500 }
    );
  }
}

// PUT /api/navigation/:id - Update navigation menu
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
    const menuId = parseInt(id);
    const storeId = user.store_id;
    const body = await request.json();

    const existingMenu = await queryOne(
      `SELECT * FROM navigation_menus WHERE id = $1 AND store_id = $2`,
      [menuId, storeId]
    );

    if (!existingMenu) {
      return NextResponse.json({ error: 'Navigation menu not found' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (body.name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(body.name);
      paramIndex++;
    }

    if (body.handle !== undefined) {
      updates.push(`handle = $${paramIndex}`);
      values.push(body.handle);
      paramIndex++;
    }

    if (body.position !== undefined) {
      updates.push(`position = $${paramIndex}`);
      values.push(body.position);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json(quickshopItem('navigation_menu', existingMenu));
    }

    updates.push(`updated_at = now()`);
    values.push(menuId, storeId);

    const menu = await queryOne(
      `UPDATE navigation_menus 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    await eventBus.emitEvent('navigation.menu.updated', {
      menu: menu,
      changes: body,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json(quickshopItem('navigation_menu', menu));
  } catch (error: any) {
    console.error('Error updating navigation menu:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update navigation menu' },
      { status: 500 }
    );
  }
}

// DELETE /api/navigation/:id - Delete navigation menu
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
    const menuId = parseInt(id);
    const storeId = user.store_id;

    const menu = await queryOne(
      `SELECT * FROM navigation_menus WHERE id = $1 AND store_id = $2`,
      [menuId, storeId]
    );

    if (!menu) {
      return NextResponse.json({ error: 'Navigation menu not found' }, { status: 404 });
    }

    await query(
      `DELETE FROM navigation_menus WHERE id = $1 AND store_id = $2`,
      [menuId, storeId]
    );

    await eventBus.emitEvent('navigation.menu.deleted', {
      menu: menu,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting navigation menu:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete navigation menu' },
      { status: 500 }
    );
  }
}

