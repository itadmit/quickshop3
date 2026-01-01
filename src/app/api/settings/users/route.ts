import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { quickshopList, quickshopItem } from '@/lib/utils/apiFormatter';
import bcrypt from 'bcryptjs';

// GET /api/settings/users - Get admin users for store
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the store owner
    const owner = await queryOne<{
      id: number;
      email: string;
      name: string;
    }>(
      `SELECT id, email, name
       FROM store_owners
       WHERE id = $1`,
      [user.id]
    );

    // Get all admin users for this store
    const adminUsers = await query<{
      id: number;
      email: string;
      first_name: string;
      last_name: string;
      role: string;
      is_active: boolean;
      created_at: Date;
    }>(
      `SELECT id, email, first_name, last_name, role, is_active, created_at
       FROM admin_users
       WHERE store_id = $1
       ORDER BY created_at DESC`,
      [user.store_id]
    );

    // Get pending invitations
    const invitations = await query<any>(
      `SELECT id, email, first_name, last_name, role, status, expires_at, created_at
       FROM admin_user_invitations
       WHERE store_id = $1 AND status = 'pending'
       ORDER BY created_at DESC`,
      [user.store_id]
    );

    // Combine owner + admin users
    const users = [
      // Owner first
      owner ? {
        id: owner.id,
        email: owner.email,
        name: owner.name,
        firstName: owner.name?.split(' ')[0] || '',
        lastName: owner.name?.split(' ').slice(1).join(' ') || '',
        role: 'owner',
        isActive: true,
        isOwner: true,
        createdAt: null,
      } : null,
      // Admin users
      ...adminUsers.map((u: any) => ({
        id: u.id,
        email: u.email,
        name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
        firstName: u.first_name,
        lastName: u.last_name,
        role: u.role,
        isActive: u.is_active,
        isOwner: false,
        createdAt: u.created_at,
      })),
    ].filter(Boolean);

    // Pending invitations
    const pendingInvitations = invitations.map((inv: any) => ({
      id: inv.id,
      email: inv.email,
      firstName: inv.first_name,
      lastName: inv.last_name,
      role: inv.role,
      status: inv.status,
      expiresAt: inv.expires_at,
      createdAt: inv.created_at,
      isExpired: new Date(inv.expires_at) < new Date(),
    }));

    return NextResponse.json({
      users,
      invitations: pendingInvitations,
    });
  } catch (error: any) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch admin users' },
      { status: 500 }
    );
  }
}

// DELETE /api/settings/users - Remove an admin user
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'מזהה משתמש חסר' }, { status: 400 });
    }

    // Verify user belongs to this store and is not the owner
    const adminUser = await queryOne<any>(
      `SELECT id FROM admin_users WHERE id = $1 AND store_id = $2`,
      [userId, user.store_id]
    );

    if (!adminUser) {
      return NextResponse.json({ error: 'משתמש לא נמצא' }, { status: 404 });
    }

    // Delete the admin user
    await query(
      `DELETE FROM admin_users WHERE id = $1`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      message: 'המשתמש הוסר בהצלחה',
    });
  } catch (error: any) {
    console.error('Error removing admin user:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה בהסרת המשתמש' },
      { status: 500 }
    );
  }
}

// PUT /api/settings/users - Update an admin user
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, firstName, lastName, role, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'מזהה משתמש חסר' }, { status: 400 });
    }

    // Verify user belongs to this store
    const adminUser = await queryOne<any>(
      `SELECT id FROM admin_users WHERE id = $1 AND store_id = $2`,
      [id, user.store_id]
    );

    if (!adminUser) {
      return NextResponse.json({ error: 'משתמש לא נמצא' }, { status: 404 });
    }

    // Update the admin user
    await query(
      `UPDATE admin_users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           role = COALESCE($3, role),
           is_active = COALESCE($4, is_active),
           updated_at = now()
       WHERE id = $5`,
      [firstName, lastName, role, isActive, id]
    );

    return NextResponse.json({
      success: true,
      message: 'המשתמש עודכן בהצלחה',
    });
  } catch (error: any) {
    console.error('Error updating admin user:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה בעדכון המשתמש' },
      { status: 500 }
    );
  }
}
