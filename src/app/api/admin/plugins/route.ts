// API Routes for Admin Plugins Management (Super Admin)

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { Plugin } from '@/types/plugin';
import { getAllPlugins, getPluginBySlug } from '@/lib/plugins/registry';

/**
 * בדיקה אם המשתמש הוא סופר אדמין
 * TODO: לשפר את הבדיקה הזו - אולי לפי email או שדה במסד נתונים
 */
async function isSuperAdmin(userId: number, email: string): Promise<boolean> {
  // בינתיים - בדיקה בסיסית לפי email
  // בעתיד ניתן להוסיף שדה is_super_admin בטבלת store_owners
  const superAdminEmails = process.env.SUPER_ADMIN_EMAILS?.split(',') || [];
  return superAdminEmails.includes(email.toLowerCase());
}

/**
 * GET /api/admin/plugins - רשימת כל התוספים (סופר אדמין)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // בדיקה אם המשתמש הוא סופר אדמין
    const isAdmin = await isSuperAdmin(user.id, user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Super admin only' }, { status: 403 });
    }

    // קבלת כל התוספים מהמסד נתונים
    const plugins = await query<Plugin>(
      `SELECT * FROM plugins ORDER BY display_order ASC, created_at DESC`
    );

    // הוספת מידע מהרישום המובנה
    const pluginsWithDetails = plugins.map(plugin => {
      const pluginDef = getPluginBySlug(plugin.slug);
      return {
        ...plugin,
        definition: pluginDef || null,
      };
    });

    return NextResponse.json({
      plugins: pluginsWithDetails,
    });
  } catch (error: any) {
    console.error('Error fetching admin plugins:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch plugins' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/plugins - יצירת תוסף חדש (סופר אדמין)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // בדיקה אם המשתמש הוא סופר אדמין
    const isAdmin = await isSuperAdmin(user.id, user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Super admin only' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      slug,
      description,
      type,
      category,
      is_free,
      price,
      script_content,
      inject_location,
      icon,
      author,
      version = '1.0.0',
      defaultConfig = {},
    } = body;

    // בדיקות תקינות
    if (!name || !slug || !type || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug, type, category' },
        { status: 400 }
      );
    }

    // בדיקה אם ה-slug כבר קיים
    const existing = await queryOne<Plugin>(
      `SELECT * FROM plugins WHERE slug = $1`,
      [slug]
    );

    if (existing) {
      return NextResponse.json(
        { error: 'Plugin with this slug already exists' },
        { status: 400 }
      );
    }

    // בדיקת מחיר אם לא חינמי
    if (!is_free && (!price || price <= 0)) {
      return NextResponse.json(
        { error: 'Price is required for paid plugins' },
        { status: 400 }
      );
    }

    // יצירת התוסף
    const plugin = await queryOne<Plugin>(
      `INSERT INTO plugins (
        name, slug, description, type, category,
        is_free, price, currency,
        script_content, inject_location,
        icon, author, version,
        config, is_built_in, is_editable, is_deletable,
        display_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        name,
        slug,
        description || null,
        type,
        category,
        is_free || false,
        is_free ? null : price,
        'ILS',
        script_content || null,
        inject_location || null,
        icon || null,
        author || null,
        version,
        JSON.stringify(defaultConfig),
        false, // is_built_in
        true,  // is_editable
        true,  // is_deletable
        0,     // display_order
      ]
    );

    return NextResponse.json({
      success: true,
      plugin,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating plugin:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create plugin' },
      { status: 500 }
    );
  }
}



