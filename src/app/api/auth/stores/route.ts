import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/auth/stores - Get all stores accessible by current user
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get stores owned by user
    const ownedStores = await query<{
      id: number;
      name: string;
      myshopify_domain: string;
      access_type: string;
    }>(
      `SELECT 
        s.id, 
        s.name, 
        s.myshopify_domain,
        'owner' as access_type
       FROM stores s
       WHERE s.owner_id = $1
       ORDER BY s.created_at ASC`,
      [user.id]
    );

    // Get stores where user is an admin user (invited staff)
    const adminStores = await query<{
      id: number;
      name: string;
      myshopify_domain: string;
      access_type: string;
      role: string;
    }>(
      `SELECT 
        s.id, 
        s.name, 
        s.myshopify_domain,
        'staff' as access_type,
        au.role
       FROM stores s
       INNER JOIN admin_users au ON s.id = au.store_id
       WHERE au.email = $1 AND au.is_active = true
       ORDER BY au.created_at ASC`,
      [user.email]
    );

    // Combine and deduplicate stores (owned stores take precedence)
    const allStores = [...ownedStores, ...adminStores];
    const uniqueStores = allStores.filter(
      (store, index, self) => index === self.findIndex((s) => s.id === store.id)
    );

    // Find current store
    const currentStore = uniqueStores.find((s) => s.id === user.store_id) || uniqueStores[0];

    return NextResponse.json({
      stores: uniqueStores.map((store) => ({
        id: store.id,
        name: store.name,
        domain: store.myshopify_domain,
        accessType: store.access_type,
        role: store.access_type === 'staff' ? (store as any).role : 'owner',
        isCurrent: store.id === user.store_id,
      })),
      currentStore: currentStore
        ? {
            id: currentStore.id,
            name: currentStore.name,
            domain: currentStore.myshopify_domain,
          }
        : null,
    });
  } catch (error: any) {
    console.error('Error fetching stores:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stores' },
      { status: 500 }
    );
  }
}
