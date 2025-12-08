/**
 * Customizer Module - Template Widgets API Route
 * POST /api/customizer/templates/widgets
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
// TemplateType is 'product' | 'collection'

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.store_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      template_type,
      widget_type,
      widget_id,
      position,
      is_dynamic,
      settings,
    } = body;

    if (!template_type || !widget_type || !widget_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // מצא או צור template
    let templateResult = await query<{ id: number }>(
      `
      SELECT id FROM page_templates
      WHERE store_id = $1 
        AND template_type = $2 
        AND name = 'default'
      `,
      [user.store_id, template_type]
    );

    let templateId: number;
    if (templateResult.length === 0) {
      // צור template חדש
      const newTemplateResult = await query<{ id: number }>(
        `
        INSERT INTO page_templates (
          store_id, template_type, name, is_default, is_published
        )
        VALUES ($1, $2, 'default', true, false)
        RETURNING id
        `,
        [user.store_id, template_type]
      );
      templateId = newTemplateResult[0].id;
    } else {
      templateId = templateResult[0].id;
    }

    // הוסף widget
    const widgetResult = await query<{ id: number }>(
      `
      INSERT INTO template_widgets (
        template_id, widget_type, widget_id, position,
        is_visible, is_dynamic, settings_json
      )
      VALUES ($1, $2, $3, $4, true, $5, $6)
      RETURNING id
      `,
      [
        templateId,
        widget_type,
        widget_id,
        position || 0,
        is_dynamic !== false,
        JSON.stringify(settings || {}),
      ]
    );

    return NextResponse.json({
      success: true,
      widgetId: widgetResult[0]?.id,
    });
  } catch (error) {
    console.error('Error adding widget:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

