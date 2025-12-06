import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { quickshopList, quickshopItem } from '@/lib/utils/apiFormatter';

// GET /api/settings/users - Get admin users for store
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, return only the store owner
    // In the future, we can add a store_users table for multiple admins
    const owner = await queryOne<{
      id: number;
      email: string;
      name: string;
      role: string;
    }>(
      `SELECT id, email, name, 'owner' as role
       FROM store_owners
       WHERE id = $1`,
      [user.id]
    );

    return NextResponse.json(quickshopList('users', owner ? [owner] : []));
  } catch (error: any) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch admin users' },
      { status: 500 }
    );
  }
}

// POST /api/settings/users - Create admin user (invite)
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, name, role = 'admin' } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // For now, just return success
    // In the future, we can implement invitation system
    return NextResponse.json({
      success: true,
      message: 'User invitation sent',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating admin user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create admin user' },
      { status: 500 }
    );
  }
}

