import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getActiveUsersCount, getActiveUsers, getActiveVisitorsCount, getActiveVisitors } from '@/lib/session-tracker';
import { query } from '@/lib/db';

/**
 * GET /api/analytics/active-users
 * מחזיר מידע על משתמשים מחוברים (10 דקות אחרונות)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const includeDetails = searchParams.get('details') === 'true';
    const includeVisitors = searchParams.get('visitors') === 'true';

    // ספירת משתמשים מחוברים של ה-store (admin users)
    const adminCount = await getActiveUsersCount(user.store_id);
    
    // ספירת מבקרים בפרונט (visitors)
    // ב-middleware אנחנו שומרים רק storeSlug (storeId = 0), אז נחפש לפי storeSlug
    const stores = await query<{ slug: string }>(
      'SELECT slug FROM stores WHERE id = $1',
      [user.store_id]
    );
    const storeSlug = stores && stores.length > 0 ? stores[0].slug : undefined;
    
    // נחפש לפי storeSlug בלבד כי זה מה שנשמר ב-middleware
    // לא נשלח storeId כי ב-middleware אנחנו שומרים storeId = 0
    const visitorsCount = await getActiveVisitorsCount(undefined, storeSlug);

    if (!includeDetails && !includeVisitors) {
      return NextResponse.json({
        admin_users: adminCount,
        visitors: visitorsCount,
        total: adminCount + visitorsCount,
        store_id: user.store_id,
        period: '10 minutes',
      });
    }

    const response: any = {
      admin_users: adminCount,
      visitors: visitorsCount,
      total: adminCount + visitorsCount,
      store_id: user.store_id,
      period: '10 minutes',
    };

    if (includeDetails) {
      const activeUsers = await getActiveUsers(user.store_id);
      response.admin_users_list = activeUsers.map((u) => ({
        user_id: u.user_id,
        store_id: u.store_id,
        email: u.email,
        name: u.name,
        last_activity: new Date(u.last_activity).toISOString(),
        last_activity_ago: Math.floor((Date.now() - u.last_activity) / 1000),
      }));
    }

    if (includeVisitors) {
      // נקבל את ה-storeSlug גם עבור רשימת מבקרים
      const storesForVisitors = await query<{ slug: string }>(
        'SELECT slug FROM stores WHERE id = $1',
        [user.store_id]
      );
      const storeSlugForVisitors = storesForVisitors && storesForVisitors.length > 0 ? storesForVisitors[0].slug : undefined;
      
      // לא נשלח storeId כי ב-middleware אנחנו שומרים storeId = 0
      const activeVisitors = await getActiveVisitors(undefined, storeSlugForVisitors);
      response.visitors_list = activeVisitors.map((v) => ({
        visitor_id: v.visitor_id,
        store_id: v.store_id,
        store_slug: v.store_slug,
        ip_address: v.ip_address,
        last_activity: new Date(v.last_activity).toISOString(),
        last_activity_ago: Math.floor((Date.now() - v.last_activity) / 1000),
      }));
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching active users:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch active users' },
      { status: 500 }
    );
  }
}

