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

    // Get invitation details from admin_user_invitations
    const invitation = await queryOne<{
      id: number;
      email: string;
      first_name: string | null;
      last_name: string | null;
      store_id: number;
      role: string;
      status: string;
      expires_at: Date;
      invited_by: number | null;
    }>(
      `SELECT id, email, first_name, last_name, store_id, role, status, expires_at, invited_by
       FROM admin_user_invitations
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
        firstName: invitation.first_name || '',
        lastName: invitation.last_name || '',
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

// POST /api/staff/accept-invitation - Accept invitation and create admin user
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
      status: string;
      expires_at: Date;
    }>(
      `SELECT id, email, store_id, role, status, expires_at
       FROM admin_user_invitations
       WHERE token = $1 AND status = 'pending'`,
      [data.token]
    );

    if (!invitation) {
      return NextResponse.json({ error: 'הזמנה לא נמצאה או כבר אושרה' }, { status: 404 });
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'ההזמנה פגה תוקף' }, { status: 400 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Check if admin user already exists for this store
    const existingUser = await queryOne<{ id: number }>(
      'SELECT id FROM admin_users WHERE store_id = $1 AND email = $2',
      [invitation.store_id, invitation.email]
    );

    if (existingUser) {
      return NextResponse.json({ error: 'משתמש כבר קיים לחנות זו' }, { status: 400 });
    }

    // Check if this user has a store_owner account (can link to existing QuickShop account)
    const existingOwner = await queryOne<{ id: number; name: string }>(
      'SELECT id, name FROM store_owners WHERE email = $1',
      [invitation.email]
    );

    // Create admin user in admin_users table
    const newUser = await queryOne<{ id: number }>(
      `INSERT INTO admin_users (store_id, email, first_name, last_name, password_hash, role, is_active, store_owner_id)
       VALUES ($1, $2, $3, $4, $5, $6, true, $7)
       RETURNING id`,
      [
        invitation.store_id,
        invitation.email,
        data.firstName,
        data.lastName,
        passwordHash,
        invitation.role,
        existingOwner?.id || null,
      ]
    );

    if (!newUser) {
      throw new Error('Failed to create admin user');
    }

    // Mark invitation as accepted
    await query(
      `UPDATE admin_user_invitations
       SET status = 'accepted', accepted_at = NOW()
       WHERE id = $1`,
      [invitation.id]
    );

    return NextResponse.json({
      message: 'ההזמנה אושרה בהצלחה',
      adminUser: {
        id: newUser.id,
        email: invitation.email,
      },
      // If they have an existing QuickShop account, let them know
      hasExistingAccount: !!existingOwner,
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
