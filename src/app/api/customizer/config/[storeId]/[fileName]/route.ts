/**
 * Customizer Module - Config File API Route
 * קריאת קבצי JSON מה-DB (ללא S3)
 * GET /api/customizer/config/:storeId/:fileName
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { generateConfigJSON } from '@/lib/customizer/generateJSON';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string; fileName: string }> }
) {
  try {
    const { storeId, fileName } = await params;
    const storeIdNum = parseInt(storeId);

    if (isNaN(storeIdNum)) {
      return NextResponse.json(
        { error: 'Invalid store ID' },
        { status: 400 }
      );
    }

    // חלץ page_type מה-fileName (format: {pageType}.json או {pageType}-{handle}.json)
    const pageTypeMatch = fileName.match(/^([^-]+)(?:-(.+))?\.json$/);
    if (!pageTypeMatch) {
      return NextResponse.json(
        { error: 'Invalid file name format' },
        { status: 400 }
      );
    }

    const pageType = pageTypeMatch[1];
    const pageHandle = pageTypeMatch[2] || null;

    // קריאה מה-DB
    const layoutResult = await query<{
      id: number;
      page_type: string;
      page_handle: string | null;
      is_published: boolean;
    }>(
      `
      SELECT id, page_type, page_handle, is_published
      FROM page_layouts
      WHERE store_id = $1 
        AND page_type = $2 
        AND (page_handle = $3 OR ($3 IS NULL AND page_handle IS NULL))
        AND is_published = true
      ORDER BY published_at DESC
      LIMIT 1
      `,
      [storeIdNum, pageType, pageHandle]
    );

    if (!layoutResult || layoutResult.length === 0) {
      return NextResponse.json(
        { error: 'Config file not found' },
        { status: 404 }
      );
    }

    const layout = layoutResult[0];

    // טען את כל הסקשנים
    const sectionsResult = await query<{
      section_id: string;
      section_type: string;
      position: number;
      is_visible: boolean;
      settings_json: any;
    }>(
      `
      SELECT section_id, section_type, position, is_visible, settings_json
      FROM page_sections
      WHERE page_layout_id = $1
      ORDER BY position ASC
      `,
      [layout.id]
    );

    // טען הגדרות תבנית גלובליות
    const themeSettingsResult = await query<{
      published_settings_json: any;
      custom_css: string;
      custom_js: string;
    }>(
      `
      SELECT published_settings_json, custom_css, custom_js
      FROM store_theme_settings
      WHERE store_id = $1
      LIMIT 1
      `,
      [storeIdNum]
    );

    const themeSettings = themeSettingsResult[0] || {
      published_settings_json: {},
      custom_css: '',
      custom_js: '',
    };

    // בניית ה-config בפורמט הנדרש
    const sections: Record<string, any> = {};
    const sectionOrder: string[] = [];

    for (const s of sectionsResult) {
      sections[s.section_id] = {
        type: s.section_type,
        position: s.position,
        visible: s.is_visible,
        settings: s.settings_json,
      };
      sectionOrder.push(s.section_id);
    }

    const config = {
      version: '1.0.0',
      generated_at: new Date().toISOString(),
      page_type: layout.page_type,
      page_handle: layout.page_handle,
      global_settings: themeSettings.published_settings_json || {},
      sections,
      section_order: sectionOrder,
      custom_css: themeSettings.custom_css || '',
      custom_js: themeSettings.custom_js || '',
    };

    // יצירת JSON
    const jsonContent = JSON.stringify(config, null, 2);

    return new NextResponse(jsonContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error getting config file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

