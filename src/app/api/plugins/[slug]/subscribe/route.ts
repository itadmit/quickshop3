/**
 * API Route for Plugin Subscription
 * 
 * POST /api/plugins/[slug]/subscribe - רכישת תוסף בתשלום
 * 
 * משתמש בטוקן הקיים של החנות (מהמנוי הראשי)
 * אין צורך להזין פרטי כרטיס חדשים
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { subscribeToPlugin } from '@/lib/plugins/billing';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;

    // התקנת/רכישת התוסף
    // משתמש בטוקן הקיים של החנות - אין צורך ב-cardToken
    const result = await subscribeToPlugin(user.store_id, slug);

    if (!result.success) {
      // קודי שגיאה ספציפיים לטיפול ב-UI
      const statusCode = result.errorCode === 'NO_TOKEN' || result.errorCode === 'NOT_PAYING' 
        ? 402 // Payment Required 
        : 400;
      
      return NextResponse.json(
        { 
          error: result.error, 
          errorCode: result.errorCode,
        },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      subscriptionId: result.subscriptionId,
      message: 'התוסף הותקן בהצלחה והחיוב בוצע',
    });
  } catch (error: any) {
    console.error('Error subscribing to plugin:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to subscribe to plugin' },
      { status: 500 }
    );
  }
}
