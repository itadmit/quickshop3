/**
 * Customizer Module - Templates API
 * GET /api/customizer/templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.store_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const storeId = user.store_id;
    const { searchParams } = new URL(request.url);
    
    const templateType = searchParams.get('type'); // 'product' | 'collection'
    const templateName = searchParams.get('name') || 'default';

    if (templateType) {
      // קבלת template ספציפי
      const templateResult = await query(
        `
        SELECT pt.*, 
               json_agg(
                 json_build_object(
                   'id', tw.id,
                   'widget_type', tw.widget_type,
                   'widget_id', tw.widget_id,
                   'position', tw.position,
                   'is_visible', tw.is_visible,
                   'is_dynamic', tw.is_dynamic,
                   'settings', tw.settings_json,
                   'custom_css', tw.custom_css,
                   'custom_classes', tw.custom_classes
                 ) ORDER BY tw.position
               ) FILTER (WHERE tw.id IS NOT NULL) as widgets
        FROM page_templates pt
        LEFT JOIN template_widgets tw ON tw.template_id = pt.id
        WHERE pt.store_id = $1 
          AND pt.template_type = $2 
          AND pt.name = $3
        GROUP BY pt.id
        `,
        [storeId, templateType, templateName]
      );

      if (templateResult.length === 0) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ template: templateResult[0] });
    } else {
      // רשימת כל התבניות הזמינות
      const templatesResult = await query(
        `
        SELECT * FROM theme_templates
        ORDER BY is_default DESC, name ASC
        `
      );

      return NextResponse.json({ templates: templatesResult });
    }
  } catch (error) {
    console.error('Error getting templates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

