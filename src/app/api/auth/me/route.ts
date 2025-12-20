import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { queryOne } from '@/lib/db';

// בדיקה אם המשתמש הוא סופר אדמין
function checkIsSuperAdmin(email: string): boolean {
  const superAdminEmails = process.env.SUPER_ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
  return superAdminEmails.includes(email.toLowerCase());
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json(
        { error: 'לא מאומת' },
        { status: 401 }
      );
    }

    // Get user details (including is_super_admin if exists)
    const userDetails = await queryOne<{
      id: number;
      email: string;
      name: string;
      email_verified: boolean;
      is_super_admin?: boolean;
    }>(
      'SELECT id, email, name, email_verified FROM store_owners WHERE id = $1',
      [user.id]
    );

    if (!userDetails) {
      return NextResponse.json(
        { error: 'משתמש לא נמצא' },
        { status: 404 }
      );
    }

    // Check super admin status (from DB or env)
    const isSuperAdmin = userDetails.is_super_admin || checkIsSuperAdmin(userDetails.email);

    // Get store details
    const store = await queryOne<{
      id: number;
      name: string;
      slug: string;
      myshopify_domain: string;
      currency: string;
      locale: string;
      plan: string;
    }>(
      'SELECT id, name, slug, myshopify_domain, currency, locale, plan FROM stores WHERE id = $1',
      [user.store_id]
    );

    return NextResponse.json({
      user: {
        id: userDetails.id,
        email: userDetails.email,
        name: userDetails.name,
        email_verified: userDetails.email_verified,
        is_super_admin: isSuperAdmin,
        role: isSuperAdmin ? 'super_admin' : 'store_owner',
      },
      store: store ? {
        id: store.id,
        name: store.name,
        slug: store.slug,
        myshopify_domain: store.myshopify_domain,
        currency: store.currency,
        locale: store.locale,
        plan: store.plan,
      } : null,
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה בקבלת פרטי משתמש' },
      { status: 500 }
    );
  }
}

