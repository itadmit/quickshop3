import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { quickshopList, quickshopItem } from '@/lib/utils/apiFormatter';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/navigation/:id/items - Get menu items
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

    // Verify menu exists
    const menu = await queryOne(
      `SELECT * FROM navigation_menus WHERE id = $1 AND store_id = $2`,
      [menuId, storeId]
    );

    if (!menu) {
      return NextResponse.json({ error: 'Navigation menu not found' }, { status: 404 });
    }

    const items = await query(
      `SELECT * FROM navigation_menu_items WHERE menu_id = $1 ORDER BY position`,
      [menuId]
    );

    return NextResponse.json(quickshopList('navigation_menu_items', items));
  } catch (error: any) {
    console.error('Error fetching navigation menu items:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch navigation menu items' },
      { status: 500 }
    );
  }
}

// POST /api/navigation/:id/items - Add item to menu
export async function POST(
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
    const { title, url, type, resource_id, parent_id, position = 0 } = body;

    if (!title || !type) {
      return NextResponse.json({ error: 'title and type are required' }, { status: 400 });
    }

    // Verify menu exists
    const menu = await queryOne(
      `SELECT * FROM navigation_menus WHERE id = $1 AND store_id = $2`,
      [menuId, storeId]
    );

    if (!menu) {
      return NextResponse.json({ error: 'Navigation menu not found' }, { status: 404 });
    }

    const item = await queryOne(
      `INSERT INTO navigation_menu_items (
        menu_id, parent_id, title, url, type, resource_id, position, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, now())
      RETURNING *`,
      [menuId, parent_id || null, title, url || null, type, resource_id || null, position]
    );

    return NextResponse.json(quickshopItem('navigation_menu_item', item));
  } catch (error: any) {
    console.error('Error adding navigation menu item:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add navigation menu item' },
      { status: 500 }
    );
  }
}

