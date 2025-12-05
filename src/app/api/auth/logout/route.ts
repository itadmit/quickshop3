import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, getUserFromRequest } from '@/lib/auth';
import { eventBus } from '@/lib/events/eventBus';
import { removeUserSession } from '@/lib/session-tracker';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);

    // Emit logout event if user was logged in
    if (user) {
      await eventBus.emitEvent('user.logged_out', {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      }, {
        store_id: user.store_id,
        source: 'api',
        user_id: user.id,
      });

      // הסרת session מ-Redis
      await removeUserSession(user.id).catch((error) => {
        console.error('Failed to remove user session from Redis:', error);
      });
    }

    const response = NextResponse.json({
      success: true,
      message: 'התנתקת בהצלחה',
    });

    // Clear session cookie
    return clearSessionCookie(response);
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה בהתנתקות' },
      { status: 500 }
    );
  }
}

