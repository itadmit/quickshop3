import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { quickshopList, quickshopItem } from '@/lib/utils/apiFormatter';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/notifications - List all notifications
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const storeId = user.store_id;
    const userId = searchParams.get('user_id') || user.id.toString();
    const isRead = searchParams.get('is_read');
    const notificationType = searchParams.get('notification_type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let sql = `SELECT * FROM notifications WHERE store_id = $1 AND (user_id = $2 OR user_id IS NULL)`;
    const params: any[] = [storeId, parseInt(userId)];
    let paramIndex = 3;

    if (isRead !== null) {
      sql += ` AND is_read = $${paramIndex}`;
      params.push(isRead === 'true');
      paramIndex++;
    }

    if (notificationType) {
      sql += ` AND notification_type = $${paramIndex}`;
      params.push(notificationType);
      paramIndex++;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const notifications = await query(sql, params);

    return NextResponse.json(quickshopList('notifications', notifications));
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create notification
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const storeId = user.store_id;
    const {
      user_id,
      notification_type,
      title,
      message,
      link_url,
      metadata,
    } = body;

    if (!notification_type || !title || !message) {
      return NextResponse.json(
        { error: 'notification_type, title, and message are required' },
        { status: 400 }
      );
    }

    const notification = await queryOne(
      `INSERT INTO notifications (
        store_id, user_id, notification_type, title, message, link_url, metadata, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, now())
      RETURNING *`,
      [
        storeId,
        user_id || null,
        notification_type,
        title,
        message,
        link_url || null,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );

    return NextResponse.json(quickshopItem('notification', notification));
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create notification' },
      { status: 500 }
    );
  }
}

