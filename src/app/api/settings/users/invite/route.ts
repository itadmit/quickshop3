import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import crypto from 'crypto';

// POST /api/settings/users/invite - Invite a new admin user
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, firstName, lastName, role = 'staff' } = body;

    if (!email) {
      return NextResponse.json({ error: 'אימייל הוא שדה חובה' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'כתובת אימייל לא תקינה' }, { status: 400 });
    }

    // Check if user is already an admin for this store
    const existingAdmin = await queryOne<any>(
      `SELECT id FROM admin_users WHERE store_id = $1 AND email = $2`,
      [user.store_id, email.toLowerCase()]
    );

    if (existingAdmin) {
      return NextResponse.json({ error: 'משתמש זה כבר קיים במערכת' }, { status: 400 });
    }

    // Check if there's already a pending invitation
    const existingInvitation = await queryOne<any>(
      `SELECT id, status FROM admin_user_invitations 
       WHERE store_id = $1 AND email = $2 AND status = 'pending'`,
      [user.store_id, email.toLowerCase()]
    );

    if (existingInvitation) {
      return NextResponse.json({ error: 'כבר נשלחה הזמנה לכתובת זו' }, { status: 400 });
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create or update invitation (handles cancelled/expired invitations)
    const invitation = await queryOne<any>(
      `INSERT INTO admin_user_invitations 
       (store_id, email, first_name, last_name, role, token, invited_by, expires_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
       ON CONFLICT (store_id, email) DO UPDATE SET
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         role = EXCLUDED.role,
         token = EXCLUDED.token,
         invited_by = EXCLUDED.invited_by,
         expires_at = EXCLUDED.expires_at,
         status = 'pending',
         created_at = now()
       RETURNING id, email, first_name, last_name, role, token, expires_at, created_at`,
      [
        user.store_id,
        email.toLowerCase(),
        firstName || null,
        lastName || null,
        role,
        token,
        user.id,
        expiresAt
      ]
    );

    if (!invitation) {
      throw new Error('Failed to create invitation');
    }

    // Get store info for email
    const store = await queryOne<{ name: string; slug: string }>(
      'SELECT name, slug FROM stores WHERE id = $1',
      [user.store_id]
    );

    // Send invitation email
    try {
      const { EmailEngine } = await import('@/lib/services/email-engine');
      const emailEngine = new EmailEngine(user.store_id);
      
      // Get base URL from environment variable or request headers
      const host = request.headers.get('host') || 'localhost:3000';
      const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
      const baseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
      const inviteUrl = `${baseUrl}/staff/accept-invitation?token=${token}`;

      await emailEngine.send('ADMIN_INVITE', email, {
        first_name: firstName || 'שלום',
        shop_name: store?.name || 'החנות',
        invitation_url: inviteUrl,
        inviter_name: user.name || 'מנהל החנות',
        role_label: getRoleDisplayName(role),
        email: email,
        expires_date: expiresAt.toLocaleDateString('he-IL'),
      });
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError);
      // Don't fail the whole request if email fails
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        firstName: invitation.first_name,
        lastName: invitation.last_name,
        role: invitation.role,
        expiresAt: invitation.expires_at,
        createdAt: invitation.created_at,
      },
      message: 'ההזמנה נשלחה בהצלחה',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה ביצירת ההזמנה' },
      { status: 500 }
    );
  }
}

// GET /api/settings/users/invite - Get all pending invitations
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invitations = await query<any>(
      `SELECT id, email, first_name, last_name, role, status, expires_at, created_at
       FROM admin_user_invitations
       WHERE store_id = $1
       ORDER BY created_at DESC`,
      [user.store_id]
    );

    return NextResponse.json({
      invitations: invitations.map((inv: any) => ({
        id: inv.id,
        email: inv.email,
        firstName: inv.first_name,
        lastName: inv.last_name,
        role: inv.role,
        status: inv.status,
        expiresAt: inv.expires_at,
        createdAt: inv.created_at,
        isExpired: new Date(inv.expires_at) < new Date() && inv.status === 'pending',
      })),
    });
  } catch (error: any) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה בטעינת ההזמנות' },
      { status: 500 }
    );
  }
}

// DELETE /api/settings/users/invite - Cancel an invitation
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get('id');

    if (!invitationId) {
      return NextResponse.json({ error: 'מזהה הזמנה חסר' }, { status: 400 });
    }

    // Verify invitation belongs to this store
    const invitation = await queryOne<any>(
      `SELECT id FROM admin_user_invitations WHERE id = $1 AND store_id = $2`,
      [invitationId, user.store_id]
    );

    if (!invitation) {
      return NextResponse.json({ error: 'הזמנה לא נמצאה' }, { status: 404 });
    }

    // Update status to cancelled
    await query(
      `UPDATE admin_user_invitations SET status = 'cancelled' WHERE id = $1`,
      [invitationId]
    );

    return NextResponse.json({
      success: true,
      message: 'ההזמנה בוטלה בהצלחה',
    });
  } catch (error: any) {
    console.error('Error cancelling invitation:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה בביטול ההזמנה' },
      { status: 500 }
    );
  }
}

function getRoleDisplayName(role: string): string {
  const roles: Record<string, string> = {
    admin: 'מנהל',
    staff: 'עובד',
    limited_staff: 'עובד מוגבל',
  };
  return roles[role] || role;
}

