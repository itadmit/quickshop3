import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import crypto from 'crypto';

const inviteStaffSchema = z.object({
  email: z.string().email('כתובת אימייל לא תקינה'),
  role: z.enum(['admin', 'staff', 'limited_staff'], {
    errorMap: () => ({ message: 'תפקיד לא חוקי' }),
  }),
  permissions: z.record(z.boolean()).optional(),
});

// GET /api/staff - Get all staff members for current store
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all staff members with access to this store
    const staffMembers = await query<{
      id: number;
      email: string;
      first_name: string | null;
      last_name: string | null;
      is_active: boolean;
      last_login_at: Date | null;
      role: string;
      permissions: any;
      access_is_active: boolean;
      created_at: Date;
    }>(
      `SELECT 
        su.id,
        su.email,
        su.first_name,
        su.last_name,
        su.is_active,
        su.last_login_at,
        ssa.role,
        ssa.permissions,
        ssa.is_active as access_is_active,
        ssa.created_at
      FROM staff_users su
      INNER JOIN staff_store_access ssa ON su.id = ssa.staff_user_id
      WHERE ssa.store_id = $1
      ORDER BY ssa.created_at DESC`,
      [user.store_id]
    );

    // Get pending invitations
    const pendingInvitations = await query<{
      id: number;
      email: string;
      role: string;
      status: string;
      expires_at: Date;
      created_at: Date;
    }>(
      `SELECT id, email, role, status, expires_at, created_at
       FROM staff_invitations
       WHERE store_id = $1 AND status = 'pending' AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [user.store_id]
    );

    return NextResponse.json({
      staff: staffMembers.map((member) => ({
        id: member.id,
        email: member.email,
        firstName: member.first_name,
        lastName: member.last_name,
        name: [member.first_name, member.last_name].filter(Boolean).join(' ') || member.email,
        isActive: member.is_active && member.access_is_active,
        lastLoginAt: member.last_login_at,
        role: member.role,
        permissions: member.permissions || {},
        createdAt: member.created_at,
      })),
      pendingInvitations: pendingInvitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        expiresAt: inv.expires_at,
        createdAt: inv.created_at,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch staff' },
      { status: 500 }
    );
  }
}

// POST /api/staff - Invite new staff member
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is store owner (only owners can invite staff)
    const store = await queryOne<{ owner_id: number }>(
      'SELECT owner_id FROM stores WHERE id = $1',
      [user.store_id]
    );

    if (!store || store.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'רק בעלי החנות יכולים להזמין עובדים' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = inviteStaffSchema.parse(body);

    // Check if user already has access to this store
    const existingAccess = await queryOne(
      `SELECT su.id
       FROM staff_users su
       INNER JOIN staff_store_access ssa ON su.id = ssa.staff_user_id
       WHERE su.email = $1 AND ssa.store_id = $2`,
      [data.email, user.store_id]
    );

    if (existingAccess) {
      return NextResponse.json(
        { error: 'משתמש זה כבר מוזמן לחנות' },
        { status: 400 }
      );
    }

    // Check if there's a pending invitation
    const existingInvitation = await queryOne<{ id: number; status: string }>(
      `SELECT id, status
       FROM staff_invitations
       WHERE email = $1 AND store_id = $2 AND status = 'pending' AND expires_at > NOW()`,
      [data.email, user.store_id]
    );

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'קיימת הזמנה פעילה למשתמש זה' },
        { status: 400 }
      );
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');

    // Create invitation (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await queryOne<{
      id: number;
      email: string;
      role: string;
      token: string;
    }>(
      `INSERT INTO staff_invitations (email, store_id, invited_by, role, permissions, token, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, role, token`,
      [
        data.email,
        user.store_id,
        user.id,
        data.role,
        JSON.stringify(data.permissions || {}),
        token,
        expiresAt,
      ]
    );

    if (!invitation) {
      throw new Error('Failed to create invitation');
    }

    // Get store name for email
    const storeInfo = await queryOne<{ name: string }>(
      'SELECT name FROM stores WHERE id = $1',
      [user.store_id]
    );

    // Send invitation email (async, don't block response)
    const { sendStaffInvitationEmail } = await import('@/lib/staff-email');
    sendStaffInvitationEmail(user.store_id, {
      email: invitation.email,
      storeName: storeInfo?.name || 'החנות',
      inviterName: user.name || 'מנהל החנות',
      role: invitation.role,
      token: invitation.token,
    }).catch((error) => {
      console.warn('Failed to send staff invitation email:', error);
    });

    return NextResponse.json(
      {
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expiresAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'שגיאת אימות' },
        { status: 400 }
      );
    }

    console.error('Error inviting staff:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to invite staff' },
      { status: 500 }
    );
  }
}

// DELETE /api/staff - Remove staff member or cancel invitation
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staffId');
    const invitationId = searchParams.get('invitationId');

    if (invitationId) {
      // Cancel invitation
      await query(
        `UPDATE staff_invitations
         SET status = 'cancelled'
         WHERE id = $1 AND store_id = $2`,
        [parseInt(invitationId), user.store_id]
      );

      return NextResponse.json({ message: 'ההזמנה בוטלה בהצלחה' });
    }

    if (staffId) {
      // Remove staff access to store
      await query(
        `DELETE FROM staff_store_access
         WHERE staff_user_id = $1 AND store_id = $2`,
        [parseInt(staffId), user.store_id]
      );

      return NextResponse.json({ message: 'חבר הצוות הוסר בהצלחה' });
    }

    return NextResponse.json(
      { error: 'חסר מזהה של חבר צוות או הזמנה' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error removing staff:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove staff' },
      { status: 500 }
    );
  }
}

