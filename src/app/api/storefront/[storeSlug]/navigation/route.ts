/**
 * API Route: Get Navigation Menu for Storefront
 * מחזיר תפריט ניווט לפי handle או position
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getStoreIdBySlug } from '@/lib/utils/store';

interface NavigationMenu {
  id: number;
  store_id: number;
  name: string;
  handle: string;
  position: string;
  created_at: string;
  updated_at: string;
}

interface NavigationMenuItem {
  id: number;
  menu_id: number;
  title: string;
  url: string | null;
  type: string;
  resource_id: number | null;
  resource_handle: string | null;
  parent_id: number | null;
  position: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const searchParams = request.nextUrl.searchParams;
    const handle = searchParams.get('handle');
    const position = searchParams.get('position');

    if (!storeSlug) {
      return NextResponse.json({ error: 'storeSlug is required' }, { status: 400 });
    }

    if (!handle && !position) {
      return NextResponse.json({ error: 'handle or position is required' }, { status: 400 });
    }

    const storeId = await getStoreIdBySlug(storeSlug);
    
    if (!storeId) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Find menu by handle or position
    let menu: NavigationMenu | null = null;
    
    if (handle) {
      menu = await queryOne<NavigationMenu>(
        'SELECT * FROM navigation_menus WHERE store_id = $1 AND handle = $2',
        [storeId, handle]
      );
    } else if (position) {
      menu = await queryOne<NavigationMenu>(
        'SELECT * FROM navigation_menus WHERE store_id = $1 AND position = $2',
        [storeId, position]
      );
    }

    if (!menu) {
      // Return empty menu if not found - this is OK for checkout footer
      return NextResponse.json({
        menu: null,
        items: []
      });
    }

    // Get menu items
    const items = await query<NavigationMenuItem>(
      'SELECT * FROM navigation_menu_items WHERE menu_id = $1 ORDER BY position',
      [menu.id]
    );

    // Build URLs for items based on type
    const itemsWithUrls = items.map(item => {
      let url = item.url;
      
      if (!url && item.type && item.resource_handle) {
        switch (item.type) {
          case 'page':
            url = `/p/${item.resource_handle}`;
            break;
          case 'collection':
            url = `/categories/${item.resource_handle}`; // ✅ תיקון: שימוש ב-/categories במקום /collections
            break;
          case 'product':
            url = `/products/${item.resource_handle}`;
            break;
          case 'blog':
            url = `/blog`;
            break;
        }
      }

      return {
        ...item,
        url
      };
    });

    return NextResponse.json({
      menu: {
        id: menu.id,
        name: menu.name,
        handle: menu.handle,
        position: menu.position,
        items: itemsWithUrls
      }
    });
  } catch (error) {
    console.error('Error fetching navigation menu:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

