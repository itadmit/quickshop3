import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { verifyPassword, generateToken, setSessionCookie } from '@/lib/auth';
import { eventBus } from '@/lib/events/eventBus';
import { updateUserActivity } from '@/lib/session-tracker';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'אימייל וסיסמה נדרשים' },
        { status: 400 }
      );
    }

    // Try to find store owner first
    let user = await queryOne<{
      id: number;
      email: string;
      name: string;
      password_hash: string;
      user_type?: string;
    }>(
      'SELECT id, email, name, password_hash FROM store_owners WHERE email = $1',
      [email]
    );

    let isStaffUser = false;
    let staffStoreAccess = null;

    // If not found as store owner, try staff_users
    if (!user) {
      user = await queryOne<{
        id: number;
        email: string;
        first_name: string | null;
        last_name: string | null;
        password_hash: string;
        user_type?: string;
      }>(
        'SELECT id, email, first_name, last_name, password_hash FROM staff_users WHERE email = $1 AND is_active = true',
        [email]
      );

      if (user) {
        isStaffUser = true;
        // Get staff store access
        staffStoreAccess = await queryOne<{
          store_id: number;
          role: string;
          permissions: any;
        }>(
          'SELECT store_id, role, permissions FROM staff_store_access WHERE staff_user_id = $1 AND is_active = true ORDER BY created_at ASC LIMIT 1',
          [user.id]
        );

        if (!staffStoreAccess) {
          return NextResponse.json(
            { error: 'לא נמצאה חנות פעילה עבור משתמש זה' },
            { status: 404 }
          );
        }

        // Convert staff user format to match store owner format
        user = {
          ...user,
          name: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email,
          user_type: 'staff',
        };
      }
    } else {
      user.user_type = 'owner';
    }

    if (!user) {
      return NextResponse.json(
        { error: 'אימייל או סיסמה שגויים' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'אימייל או סיסמה שגויים' },
        { status: 401 }
      );
    }

    // Get store based on user type
    let store;
    if (isStaffUser && staffStoreAccess) {
      store = await queryOne<{
        id: number;
        name: string;
        myshopify_domain: string;
      }>(
        'SELECT id, name, myshopify_domain FROM stores WHERE id = $1',
        [staffStoreAccess.store_id]
      );
    } else {
      // Get user's first store (or create one if doesn't exist)
      store = await queryOne<{
        id: number;
        name: string;
        myshopify_domain: string;
      }>(
        'SELECT id, name, myshopify_domain FROM stores WHERE owner_id = $1 ORDER BY created_at ASC LIMIT 1',
        [user.id]
      );
    }

    if (!store) {
      return NextResponse.json(
        { error: 'לא נמצאה חנות למשתמש זה' },
        { status: 404 }
      );
    }

    // Generate token
    const token = await generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      store_id: store.id,
    });

    // Emit login event
    await eventBus.emitEvent('user.logged_in', {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: user.user_type,
      },
      store: {
        id: store.id,
        name: store.name,
      },
    }, {
      store_id: store.id,
      source: 'api',
      user_id: user.id,
    });

    // עדכון פעילות משתמש ב-Redis
    await updateUserActivity(user.id, store.id, {
      email: user.email,
      name: user.name,
    }).catch((error) => {
      console.error('Failed to update user activity in Redis:', error);
    });

    // Update last_login_at for staff users
    if (isStaffUser) {
      await queryOne(
        'UPDATE staff_users SET last_login_at = NOW() WHERE id = $1',
        [user.id]
      ).catch((error) => {
        console.error('Failed to update staff last_login_at:', error);
      });
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: user.user_type,
        role: isStaffUser && staffStoreAccess ? staffStoreAccess.role : 'owner',
      },
      store: {
        id: store.id,
        name: store.name,
        myshopify_domain: store.myshopify_domain,
      },
    });

    // Set session cookie
    const finalResponse = setSessionCookie(response, token);
    
    console.log('Login successful:', {
      userId: user.id,
      userType: user.user_type,
      storeId: store.id,
      cookieSet: finalResponse.cookies.get('quickshop3_session') ? 'yes' : 'no',
    });
    
    return finalResponse;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה בהתחברות' },
      { status: 500 }
    );
  }
}

