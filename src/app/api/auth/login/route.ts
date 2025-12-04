import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { verifyPassword, generateToken, setSessionCookie } from '@/lib/auth';
import { eventBus } from '@/lib/events/eventBus';

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

    // Find user
    const user = await queryOne<{
      id: number;
      email: string;
      name: string;
      password_hash: string;
    }>(
      'SELECT id, email, name, password_hash FROM store_owners WHERE email = $1',
      [email]
    );

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

    // Get user's first store (or create one if doesn't exist)
    const store = await queryOne<{
      id: number;
      name: string;
      myshopify_domain: string;
    }>(
      'SELECT id, name, myshopify_domain FROM stores WHERE owner_id = $1 ORDER BY created_at ASC LIMIT 1',
      [user.id]
    );

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

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
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

