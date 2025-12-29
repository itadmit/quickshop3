import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const acceptInvitationSchema = z.object({
  token: z.string(),
  firstName: z.string().min(1, 'שם פרטי הוא שדה חובה'),
  lastName: z.string().min(1, 'שם משפחה הוא שדה חובה'),
  password: z.string().min(8, 'הסיסמה חייבת להכיל לפחות 8 תווים'),
});

// GET /api/staff/accept-invitation - Verify invitation token and get details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'חסר טוקן הזמנה' }, { status: 400 });
    }

    // Get invitation details
    const invitation = await queryOne<{
      id: number;
      email: string;
      store_id: number;
      role: string;
      status: string;
      expires_at: Date;
      invited_by: number | null;
    }>(
      `SELECT id, email, store_id, role, status, expires_at, invited_by
       FROM staff_invitations
       WHERE token = $1`,
      [token]
    );

    if (!invitation) {
      return NextResponse.json({ error: 'הזמנה לא נמצאה' }, { status: 404 });
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'ההזמנה פגה תוקף' }, { status: 400 });
    }

    // Check if already accepted
    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: 'ההזמנה כבר אושרה או בוטלה' }, { status: 400 });
    }

    // Get store name
    const store = await queryOne<{ name: string }>(
      'SELECT name FROM stores WHERE id = $1',
      [invitation.store_id]
    );

    // Get inviter name
    let inviterName = 'מנהל החנות';
    if (invitation.invited_by) {
      const inviter = await queryOne<{ name: string }>(
        'SELECT name FROM store_owners WHERE id = $1',
        [invitation.invited_by]
      );
      if (inviter) {
        inviterName = inviter.name;
      }
    }

    // Role labels
    const roleLabels: Record<string, string> = {
      owner: 'בעלים',
      admin: 'מנהל',
      staff: 'צוות',
      limited_staff: 'צוות מוגבל',
    };

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        storeName: store?.name || 'החנות',
        role: invitation.role,
        roleLabel: roleLabels[invitation.role] || invitation.role,
        expiresAt: invitation.expires_at,
        inviterName,
      },
    });
  } catch (error: any) {
    console.error('Error verifying invitation:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה באימות ההזמנה' },
      { status: 500 }
    );
  }
}

// POST /api/staff/accept-invitation - Accept invitation and create staff user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = acceptInvitationSchema.parse(body);

    // Get invitation details
    const invitation = await queryOne<{
      id: number;
      email: string;
      store_id: number;
      role: string;
      permissions: any;
      status: string;
      expires_at: Date;
    }>(
      `SELECT id, email, store_id, role, permissions, status, expires_at
       FROM staff_invitations
       WHERE token = $1`,
      [data.token]
    );

    if (!invitation) {
      return NextResponse.json({ error: 'הזמנה לא נמצאה' }, { status: 404 });
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'ההזמנה פגה תוקף' }, { status: 400 });
    }

    // Check if already accepted
    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: 'ההזמנה כבר אושרה או בוטלה' }, { status: 400 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Check if staff user already exists
    let staffUser = await queryOne<{ id: number }>(
      'SELECT id FROM staff_users WHERE email = $1',
      [invitation.email]
    );

    if (!staffUser) {
      // Create staff user
      staffUser = await queryOne<{ id: number }>(
        `INSERT INTO staff_users (email, first_name, last_name, password_hash)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [invitation.email, data.firstName, data.lastName, passwordHash]
      );
    } else {
      // Update existing user with password if they don't have one
      await query(
        `UPDATE staff_users
         SET first_name = $1, last_name = $2, password_hash = $3, updated_at = NOW()
         WHERE id = $4 AND password_hash IS NULL`,
        [data.firstName, data.lastName, passwordHash, staffUser.id]
      );
    }

    if (!staffUser) {
      throw new Error('Failed to create staff user');
    }

    // Create staff store access
    await query(
      `INSERT INTO staff_store_access (staff_user_id, store_id, role, permissions)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (staff_user_id, store_id) DO UPDATE
       SET role = $3, permissions = $4, is_active = true, updated_at = NOW()`,
      [
        staffUser.id,
        invitation.store_id,
        invitation.role,
        JSON.stringify(invitation.permissions || {}),
      ]
    );

    // Mark invitation as accepted
    await query(
      `UPDATE staff_invitations
       SET status = 'accepted', accepted_at = NOW()
       WHERE id = $1`,
      [invitation.id]
    );

    return NextResponse.json({
      message: 'ההזמנה אושרה בהצלחה',
      staffUser: {
        id: staffUser.id,
        email: invitation.email,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'שגיאת אימות' },
        { status: 400 }
      );
    }

    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה באישור ההזמנה' },
      { status: 500 }
    );
  }
}

