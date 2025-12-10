// API Routes for Admin Plugin Management (Super Admin) - Single Plugin

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { Plugin } from '@/types/plugin';

/**
 * בדיקה אם המשתמש הוא סופר אדמין
 */
async function isSuperAdmin(userId: number, email: string): Promise<boolean> {
  const superAdminEmails = process.env.SUPER_ADMIN_EMAILS?.split(',') || [];
  return superAdminEmails.includes(email.toLowerCase());
}

/**
 * GET /api/admin/plugins/[id] - פרטי תוסף ספציפי
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isSuperAdmin(user.id, user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Super admin only' }, { status: 403 });
    }

    const { id } = await params;
    const pluginId = parseInt(id);

    if (isNaN(pluginId)) {
      return NextResponse.json({ error: 'Invalid plugin ID' }, { status: 400 });
    }

    const plugin = await queryOne<Plugin>(
      `SELECT * FROM plugins WHERE id = $1`,
      [pluginId]
    );

    if (!plugin) {
      return NextResponse.json({ error: 'Plugin not found' }, { status: 404 });
    }

    return NextResponse.json({ plugin });
  } catch (error: any) {
    console.error('Error fetching plugin:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch plugin' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/plugins/[id] - עדכון תוסף
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isSuperAdmin(user.id, user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Super admin only' }, { status: 403 });
    }

    const { id } = await params;
    const pluginId = parseInt(id);

    if (isNaN(pluginId)) {
      return NextResponse.json({ error: 'Invalid plugin ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      description,
      is_free,
      price,
      script_content,
      inject_location,
      icon,
      category,
      display_order,
      is_active,
    } = body;

    // בדיקה אם התוסף קיים
    const existing = await queryOne<Plugin>(
      `SELECT * FROM plugins WHERE id = $1`,
      [pluginId]
    );

    if (!existing) {
      return NextResponse.json({ error: 'Plugin not found' }, { status: 404 });
    }

    // בדיקה אם התוסף מובנה ולא ניתן לעריכה
    if (existing.is_built_in && !existing.is_editable) {
      return NextResponse.json(
        { error: 'Built-in plugins cannot be edited' },
        { status: 400 }
      );
    }

    // עדכון התוסף
    const updated = await queryOne<Plugin>(
      `UPDATE plugins SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        is_free = COALESCE($3, is_free),
        price = CASE WHEN $3 = false THEN COALESCE($4, price) ELSE NULL END,
        script_content = COALESCE($5, script_content),
        inject_location = COALESCE($6, inject_location),
        icon = COALESCE($7, icon),
        category = COALESCE($8, category),
        display_order = COALESCE($9, display_order),
        is_active = COALESCE($10, is_active),
        updated_at = now()
      WHERE id = $11
      RETURNING *`,
      [
        name,
        description,
        is_free,
        price,
        script_content,
        inject_location,
        icon,
        category,
        display_order,
        is_active,
        pluginId,
      ]
    );

    return NextResponse.json({
      success: true,
      plugin: updated,
    });
  } catch (error: any) {
    console.error('Error updating plugin:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update plugin' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/plugins/[id] - מחיקת תוסף
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isSuperAdmin(user.id, user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Super admin only' }, { status: 403 });
    }

    const { id } = await params;
    const pluginId = parseInt(id);

    if (isNaN(pluginId)) {
      return NextResponse.json({ error: 'Invalid plugin ID' }, { status: 400 });
    }

    // בדיקה אם התוסף קיים
    const existing = await queryOne<Plugin>(
      `SELECT * FROM plugins WHERE id = $1`,
      [pluginId]
    );

    if (!existing) {
      return NextResponse.json({ error: 'Plugin not found' }, { status: 404 });
    }

    // בדיקה אם התוסף מובנה
    if (existing.is_built_in) {
      return NextResponse.json(
        { error: 'Built-in plugins cannot be deleted' },
        { status: 400 }
      );
    }

    // בדיקה אם התוסף לא ניתן למחיקה
    if (!existing.is_deletable) {
      return NextResponse.json(
        { error: 'This plugin cannot be deleted' },
        { status: 400 }
      );
    }

    // בדיקה אם יש מנויים פעילים
    const activeSubscriptions = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM plugin_subscriptions
       WHERE plugin_id = $1 AND status = 'ACTIVE'`,
      [pluginId]
    );

    if (parseInt(activeSubscriptions?.count || '0') > 0) {
      return NextResponse.json(
        { error: 'Cannot delete plugin with active subscriptions' },
        { status: 400 }
      );
    }

    // מחיקת התוסף
    await query(`DELETE FROM plugins WHERE id = $1`, [pluginId]);

    return NextResponse.json({
      success: true,
      message: 'Plugin deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting plugin:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete plugin' },
      { status: 500 }
    );
  }
}

