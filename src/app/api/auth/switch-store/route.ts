import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { getUserFromRequest, generateToken, setSessionCookie } from '@/lib/auth';

// POST /api/auth/switch-store - Switch current store
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { storeId } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    // Check if user has access to this store (as owner or staff)
    const storeAccess = await queryOne<{ id: number; name: string }>(
      `SELECT s.id, s.name
       FROM stores s
       LEFT JOIN staff_store_access ssa ON s.id = ssa.store_id
       LEFT JOIN staff_users su ON ssa.staff_user_id = su.id
       WHERE s.id = $1 
       AND (
         s.owner_id = $2 
         OR (su.email = $3 AND ssa.is_active = true AND su.is_active = true)
       )
       LIMIT 1`,
      [storeId, user.id, user.email]
    );

    if (!storeAccess) {
      return NextResponse.json(
        { error: 'אין לך גישה לחנות זו' },
        { status: 403 }
      );
    }

    // Generate new token with new store_id
    const token = await generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      store_id: storeId,
    });

    const response = NextResponse.json({
      success: true,
      store: {
        id: storeAccess.id,
        name: storeAccess.name,
      },
    });

    // Set new session cookie
    const finalResponse = setSessionCookie(response, token);

    console.log('Store switched successfully:', {
      userId: user.id,
      oldStoreId: user.store_id,
      newStoreId: storeId,
    });

    return finalResponse;
  } catch (error: any) {
    console.error('Error switching store:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to switch store' },
      { status: 500 }
    );
  }
}

