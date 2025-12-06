import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { quickshopItem } from '@/lib/utils/apiFormatter';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/notifications/:id - Get notification details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const notificationId = parseInt(id);
    const storeId = user.store_id;

    const notification = await queryOne(
      `SELECT * FROM notifications 
       WHERE id = $1 AND store_id = $2 AND (user_id = $3 OR user_id IS NULL)`,
      [notificationId, storeId, user.id]
    );

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json(quickshopItem('notification', notification));
  } catch (error: any) {
    console.error('Error fetching notification:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notification' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/:id/read - Mark notification as read
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const notificationId = parseInt(id);
    const storeId = user.store_id;

    const notification = await queryOne(
      `SELECT * FROM notifications 
       WHERE id = $1 AND store_id = $2 AND (user_id = $3 OR user_id IS NULL)`,
      [notificationId, storeId, user.id]
    );

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    const updatedNotification = await queryOne(
      `UPDATE notifications 
       SET is_read = true, read_at = now()
       WHERE id = $1 AND store_id = $2
       RETURNING *`,
      [notificationId, storeId]
    );

    return NextResponse.json(quickshopItem('notification', updatedNotification));
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}


// DELETE /api/notifications/:id - Delete notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const notificationId = parseInt(id);
    const storeId = user.store_id;

    const notification = await queryOne(
      `SELECT * FROM notifications 
       WHERE id = $1 AND store_id = $2 AND (user_id = $3 OR user_id IS NULL)`,
      [notificationId, storeId, user.id]
    );

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    await query(
      `DELETE FROM notifications WHERE id = $1 AND store_id = $2`,
      [notificationId, storeId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete notification' },
      { status: 500 }
    );
  }
}

