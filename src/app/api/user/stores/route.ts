import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/user/stores - Get all stores the user has access to
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the store owner owns
    const ownedStore = await queryOne<{
      id: number;
      name: string;
      slug: string;
      logo?: string;
    }>(
      `SELECT s.id, s.name, s.slug, ss.settings->>'logo' as logo
       FROM stores s
       LEFT JOIN store_settings ss ON ss.store_id = s.id
       WHERE s.owner_id = $1`,
      [user.id]
    );

    // Get stores where user is an admin (invited staff)
    const adminStores = await query<{
      id: number;
      name: string;
      slug: string;
      logo?: string;
      role: string;
    }>(
      `SELECT s.id, s.name, s.slug, ss.settings->>'logo' as logo, au.role
       FROM admin_users au
       JOIN stores s ON s.id = au.store_id
       LEFT JOIN store_settings ss ON ss.store_id = s.id
       WHERE au.store_owner_id = $1 AND au.is_active = true`,
      [user.id]
    );

    // Also check by email for admin_users without store_owner_id link
    const adminStoresByEmail = await query<{
      id: number;
      name: string;
      slug: string;
      logo?: string;
      role: string;
    }>(
      `SELECT DISTINCT s.id, s.name, s.slug, ss.settings->>'logo' as logo, au.role
       FROM admin_users au
       JOIN stores s ON s.id = au.store_id
       LEFT JOIN store_settings ss ON ss.store_id = s.id
       JOIN store_owners so ON so.email = au.email
       WHERE so.id = $1 AND au.is_active = true`,
      [user.id]
    );

    // Combine all stores, owned store first
    const allStores: Array<{
      id: number;
      name: string;
      slug: string;
      logo?: string;
      role: string;
      isOwned: boolean;
      isCurrent: boolean;
    }> = [];

    // Add owned store first
    if (ownedStore) {
      allStores.push({
        id: ownedStore.id,
        name: ownedStore.name,
        slug: ownedStore.slug,
        logo: ownedStore.logo || undefined,
        role: 'owner',
        isOwned: true,
        isCurrent: ownedStore.id === user.store_id,
      });
    }

    // Add admin stores (deduplicate by id)
    const addedIds = new Set(allStores.map(s => s.id));
    
    for (const store of [...adminStores, ...adminStoresByEmail]) {
      if (!addedIds.has(store.id)) {
        allStores.push({
          id: store.id,
          name: store.name,
          slug: store.slug,
          logo: store.logo || undefined,
          role: store.role,
          isOwned: false,
          isCurrent: store.id === user.store_id,
        });
        addedIds.add(store.id);
      }
    }

    return NextResponse.json({
      stores: allStores,
      currentStoreId: user.store_id,
      hasMultipleStores: allStores.length > 1,
    });
  } catch (error: any) {
    console.error('Error fetching user stores:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stores' },
      { status: 500 }
    );
  }
}

// POST /api/user/stores - Switch to a different store
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { storeId } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'מזהה חנות חסר' }, { status: 400 });
    }

    // Verify user has access to this store
    // Check if owner
    const ownedStore = await queryOne<{ id: number }>(
      'SELECT id FROM stores WHERE id = $1 AND owner_id = $2',
      [storeId, user.id]
    );

    // Check if admin
    const adminAccess = await queryOne<{ id: number }>(
      `SELECT au.id FROM admin_users au
       JOIN store_owners so ON so.email = au.email
       WHERE au.store_id = $1 AND so.id = $2 AND au.is_active = true`,
      [storeId, user.id]
    );

    if (!ownedStore && !adminAccess) {
      return NextResponse.json({ error: 'אין לך גישה לחנות זו' }, { status: 403 });
    }

    // Get store info for response
    const store = await queryOne<{ id: number; name: string; slug: string }>(
      'SELECT id, name, slug FROM stores WHERE id = $1',
      [storeId]
    );

    if (!store) {
      return NextResponse.json({ error: 'חנות לא נמצאה' }, { status: 404 });
    }

    // Return the store ID that should be switched to
    // The actual cookie/session update happens on the client side
    return NextResponse.json({
      success: true,
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
      },
      message: 'החנות הוחלפה בהצלחה',
    });
  } catch (error: any) {
    console.error('Error switching store:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה בהחלפת חנות' },
      { status: 500 }
    );
  }
}

