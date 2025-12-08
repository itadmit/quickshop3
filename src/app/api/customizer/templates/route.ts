/**
 * Customizer Module - Templates API Route
 * GET /api/customizer/templates?type=product
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { TemplateType, PageTemplate, TemplateWidget } from '@/lib/customizer/types';
import { getTemplateConfig, getPageLayout } from '@/lib/customizer/getPageConfig';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.store_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const templateType = searchParams.get('type') as TemplateType;
    const templateName = searchParams.get('name') || 'default';
    const pageHandle = searchParams.get('handle');

    if (!templateType) {
      return NextResponse.json(
        { error: 'template type is required' },
        { status: 400 }
      );
    }

    // קרא את ה-template config
    const config = await getTemplateConfig(
      user.store_id,
      templateType,
      templateName,
      true // useDraft
    );

    // Get page layout if it's a page type
    const pageLayout = await getPageLayout(user.store_id, templateType, pageHandle);

    return NextResponse.json({
      template: config.template,
      widgets: config.widgets,
      pageLayout: pageLayout
    });
  } catch (error) {
    console.error('Error getting template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or update template
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
    const { templateType, templateName, sections, themeSettings } = body;

    if (!templateType || !templateName) {
      return NextResponse.json(
        { error: 'templateType and templateName are required' },
        { status: 400 }
      );
    }

    // Check if template exists
    const existingTemplate = await query(`
      SELECT id FROM page_templates
      WHERE store_id = $1 AND template_type = $2 AND name = $3
    `, [user.store_id, templateType, templateName]);

    let templateId;

    if (existingTemplate.length > 0) {
      // Update existing template
      templateId = existingTemplate[0].id;
      await query(`
        UPDATE page_templates
        SET updated_at = now()
        WHERE id = $1
      `, [templateId]);
    } else {
      // Create new template
      const newTemplate = await query(`
        INSERT INTO page_templates (store_id, template_type, name, is_published)
        VALUES ($1, $2, $3, false)
        RETURNING id
      `, [user.store_id, templateType, templateName]);

      templateId = newTemplate[0].id;
    }

    // Save widgets (template_widgets table)
    if (sections && Array.isArray(sections)) {
      // Delete existing widgets
      await query(`DELETE FROM template_widgets WHERE template_id = $1`, [templateId]);

      // Insert new widgets
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        await query(`
          INSERT INTO template_widgets (
            template_id, widget_type, widget_id, position, is_visible,
            settings_json, custom_css, custom_classes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          templateId,
          section.type,
          section.id,
          i,
          section.visible !== false,
          JSON.stringify(section.settings || {}),
          section.custom_css || '',
          section.custom_classes || ''
        ]);
      }
    }

    return NextResponse.json({
      success: true,
      templateId
    });
  } catch (error) {
    console.error('Error saving template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
