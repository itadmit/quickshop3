/**
 * Customizer Module - Version History API Route
 * GET /api/customizer/pages/:pageType/versions
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { PageType, PageLayoutVersion } from '@/lib/customizer/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageType: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.store_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { pageType } = await params;
    const { searchParams } = new URL(request.url);
    const pageHandle = searchParams.get('handle') || undefined;

    // מצא את ה-page_layout
    const layoutResult = await query<{ id: number }>(
      `
      SELECT id FROM page_layouts
      WHERE store_id = $1 
        AND page_type = $2 
        AND (page_handle = $3 OR ($3 IS NULL AND page_handle IS NULL))
      ORDER BY updated_at DESC
      LIMIT 1
      `,
      [user.store_id, pageType, pageHandle || null]
    );

    if (layoutResult.length === 0) {
      return NextResponse.json({ versions: [] });
    }

    const layoutId = layoutResult[0].id;

    // קרא את כל הגרסאות
    const versionsResult = await query<PageLayoutVersion>(
      `
      SELECT 
        plv.*,
        au.name as created_by_name,
        au.email as created_by_email
      FROM page_layout_versions plv
      LEFT JOIN admin_users au ON au.id = plv.created_by
      WHERE plv.page_layout_id = $1
      ORDER BY plv.version_number DESC
      LIMIT 50
      `,
      [layoutId]
    );

    return NextResponse.json({
      versions: versionsResult.map(v => ({
        id: v.id,
        version_number: v.version_number,
        created_at: v.created_at,
        created_by: v.created_by,
        created_by_name: (v as any).created_by_name,
        created_by_email: (v as any).created_by_email,
        notes: v.notes,
        is_restorable: v.is_restorable,
        sections_count: v.snapshot_json?.section_order?.length || 0,
      })),
    });
  } catch (error) {
    console.error('Error getting versions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

