import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { quickshopList, quickshopItem } from '@/lib/utils/apiFormatter';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/navigation - List all navigation menus
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const storeId = user.store_id;
    const position = searchParams.get('position');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let sql = `SELECT * FROM navigation_menus WHERE store_id = $1`;
    const params: any[] = [storeId];
    let paramIndex = 2;

    if (position) {
      sql += ` AND position = $${paramIndex}`;
      params.push(position);
      paramIndex++;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const menus = await query(sql, params);

    // Get items for each menu
    const menusWithItems = await Promise.all(
      menus.map(async (menu: any) => {
        const items = await query(
          `SELECT * FROM navigation_menu_items WHERE menu_id = $1 ORDER BY position`,
          [menu.id]
        );
        return {
          ...menu,
          items,
        };
      })
    );

    return NextResponse.json(quickshopList('navigation_menus', menusWithItems));
  } catch (error: any) {
    console.error('Error fetching navigation menus:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch navigation menus' },
      { status: 500 }
    );
  }
}

// POST /api/navigation - Create navigation menu
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const storeId = user.store_id;
    const { name, handle, position, display_on } = body;

    if (!name || !handle) {
      return NextResponse.json({ error: 'name and handle are required' }, { status: 400 });
    }

    // אם display_on לא מוגדר, נשתמש ב-both כברירת מחדל
    const displayOn = display_on || 'both';

    // ניסיון ליצור עם display_on, אם השדה לא קיים ננסה בלי
    let menu;
    try {
      menu = await queryOne(
        `INSERT INTO navigation_menus (store_id, name, handle, position, display_on, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, now(), now())
         RETURNING *`,
        [storeId, name, handle, position || null, displayOn]
      );
    } catch (error: any) {
      // אם השדה לא קיים, ננסה בלי display_on
      if (error.message?.includes('display_on') || error.message?.includes('column')) {
        menu = await queryOne(
          `INSERT INTO navigation_menus (store_id, name, handle, position, created_at, updated_at)
           VALUES ($1, $2, $3, $4, now(), now())
           RETURNING *`,
          [storeId, name, handle, position || null]
        );
      } else {
        throw error;
      }
    }

    await eventBus.emitEvent('navigation.menu.created', {
      menu: menu,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json(quickshopItem('navigation_menu', menu));
  } catch (error: any) {
    console.error('Error creating navigation menu:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create navigation menu' },
      { status: 500 }
    );
  }
}

